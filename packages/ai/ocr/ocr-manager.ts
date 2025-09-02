import { GoogleVisionService } from './google-vision';
import { TesseractService } from './tesseract';
import { QuotaTracker } from './quota-tracker';
import { type FileAttachment } from '@repo/shared/types';

export interface OCRResult {
    text: string;
    method: 'google-vision' | 'tesseract';
    confidence: number;
    error?: string;
}

export interface OCRConfig {
    googleVisionApiKey?: string;
    visionEnabled?: boolean;
    monthlyQuota?: number;
    fallbackEnabled?: boolean;
}

/**
 * Intelligent OCR orchestrator that decides between Google Vision and Tesseract
 */
export class OCRManager {
    private googleVision: GoogleVisionService | null = null;
    private tesseract: TesseractService | null = null;
    private quotaTracker: QuotaTracker;
    private config: OCRConfig;

    constructor(config: OCRConfig = {}) {
        this.config = {
            visionEnabled: true,
            monthlyQuota: 1000,
            fallbackEnabled: true,
            ...config,
        };

        this.quotaTracker = new QuotaTracker(this.config.monthlyQuota);

        // Initialize Google Vision if API key is provided
        if (this.config.googleVisionApiKey && this.config.visionEnabled) {
            try {
                this.googleVision = new GoogleVisionService(
                    this.config.googleVisionApiKey,
                    this.config.monthlyQuota
                );
            } catch (error) {
                console.error('Failed to initialize Google Vision:', error);
            }
        }

        // Initialize Tesseract if fallback is enabled
        if (this.config.fallbackEnabled) {
            this.tesseract = new TesseractService();
        }
    }

    /**
     * Process a document with intelligent OCR selection
     */
    async processDocument(attachment: FileAttachment): Promise<OCRResult> {
        if (!this.isPDFFile(attachment)) {
            throw new Error('Only PDF files are supported for OCR');
        }

        // Strategy 1: Try Google Vision if available and quota allows
        if (this.googleVision && await this.shouldUseGoogleVision()) {
            try {
                console.log(`Processing ${attachment.name} with Google Vision...`);
                const result = await this.googleVision.extractTextFromPDF(attachment.data);
                
                // Record usage
                await this.quotaTracker.recordUsage('google-vision');
                
                return {
                    text: result.text,
                    method: 'google-vision',
                    confidence: result.confidence,
                };
            } catch (error) {
                console.error('Google Vision failed, falling back to Tesseract:', error);
                
                // Fall through to Tesseract
                if (!this.tesseract) {
                    return {
                        text: '',
                        method: 'google-vision',
                        confidence: 0,
                        error: `Google Vision failed: ${error}`,
                    };
                }
            }
        }

        // Strategy 2: Use Tesseract as fallback or primary
        if (this.tesseract) {
            try {
                console.log(`Processing ${attachment.name} with Tesseract...`);
                const result = await this.tesseract.extractTextFromPDF(attachment.data);
                
                // Record usage for monitoring
                await this.quotaTracker.recordUsage('tesseract');
                
                return {
                    text: result.text,
                    method: 'tesseract',
                    confidence: result.confidence,
                };
            } catch (error) {
                console.error('Tesseract also failed:', error);
                return {
                    text: '',
                    method: 'tesseract',
                    confidence: 0,
                    error: `OCR failed: ${error}`,
                };
            }
        }

        // No OCR service available
        return {
            text: '',
            method: 'tesseract',
            confidence: 0,
            error: 'No OCR service available',
        };
    }

    /**
     * Process multiple documents in parallel
     */
    async processDocuments(attachments: FileAttachment[]): Promise<Map<string, OCRResult>> {
        const results = new Map<string, OCRResult>();
        const pdfAttachments = attachments.filter(att => this.isPDFFile(att));

        if (pdfAttachments.length === 0) return results;

        // Process PDFs in parallel with concurrency limit
        const concurrencyLimit = 3;
        const chunks = this.chunkArray(pdfAttachments, concurrencyLimit);

        for (const chunk of chunks) {
            const chunkResults = await Promise.allSettled(
                chunk.map(async (attachment) => {
                    const result = await this.processDocument(attachment);
                    return { id: attachment.id, result };
                })
            );

            chunkResults.forEach((settledResult) => {
                if (settledResult.status === 'fulfilled') {
                    const { id, result } = settledResult.value;
                    results.set(id, result);
                } else {
                    console.error('OCR processing failed:', settledResult.reason);
                }
            });
        }

        return results;
    }

    /**
     * Get current quota status
     */
    async getQuotaStatus() {
        return await this.quotaTracker.getQuotaStatus();
    }

    /**
     * Check if file is a PDF
     */
    private isPDFFile(attachment: FileAttachment): boolean {
        return attachment.type === 'application/pdf' || 
               attachment.name.toLowerCase().endsWith('.pdf');
    }

    /**
     * Decide whether to use Google Vision
     */
    private async shouldUseGoogleVision(): Promise<boolean> {
        if (!this.googleVision || !this.config.visionEnabled) return false;
        
        return await this.quotaTracker.shouldUseGoogleVision();
    }

    /**
     * Split array into chunks
     */
    private chunkArray<T>(array: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Clean up resources
     */
    async cleanup(): Promise<void> {
        if (this.tesseract) {
            await this.tesseract.terminate();
        }
    }
}

// Singleton instance for the application
let ocrManagerInstance: OCRManager | null = null;

/**
 * Get or create OCR Manager singleton
 */
export function getOCRManager(config?: OCRConfig): OCRManager {
    if (!ocrManagerInstance) {
        // Get config from environment variables
        const envConfig: OCRConfig = {
            googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY,
            visionEnabled: process.env.VISION_API_ENABLED !== 'false',
            monthlyQuota: parseInt(process.env.VISION_MONTHLY_QUOTA || '1000'),
            fallbackEnabled: true,
            ...config,
        };

        ocrManagerInstance = new OCRManager(envConfig);
    }

    return ocrManagerInstance;
}