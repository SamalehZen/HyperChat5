import { GoogleVisionService } from './google-vision';
import { TesseractService } from './tesseract';
import { QuotaTracker } from './quota-tracker';
import { OCRResult, FileAttachment, OCRConfig } from './types';

export class OCRManager {
    private googleVision: GoogleVisionService;
    private tesseract: TesseractService;
    private quotaTracker: QuotaTracker;
    private config: OCRConfig;

    constructor(config?: Partial<OCRConfig>) {
        this.config = {
            googleVisionEnabled: true,
            monthlyQuota: 1000,
            fallbackToTesseract: true,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            ...config,
        };

        this.googleVision = new GoogleVisionService();
        this.tesseract = new TesseractService();
        this.quotaTracker = new QuotaTracker(this.config.monthlyQuota);
    }

    async processDocument(file: FileAttachment): Promise<OCRResult> {
        console.log(`Starting OCR for ${file.name} (${file.type})`);

        // Validate file size
        if (file.size > this.config.maxFileSize) {
            return {
                text: '',
                method: 'tesseract',
                confidence: 0,
                processingTime: 0,
                error: `File too large: ${this.formatFileSize(file.size)} (max: ${this.formatFileSize(this.config.maxFileSize)})`,
            };
        }

        // Determine processing strategy
        const strategy = await this.determineProcessingStrategy(file);
        console.log(`Using strategy: ${strategy} for ${file.name}`);

        let result: OCRResult;

        switch (strategy) {
            case 'google-vision':
                result = await this.processWithGoogleVision(file);
                
                // If Google Vision fails, try Tesseract fallback
                if (result.error && this.config.fallbackToTesseract) {
                    console.log('Google Vision failed, falling back to Tesseract...');
                    result = await this.processWithTesseract(file);
                    result.method = 'tesseract'; // Update method to reflect fallback
                } else {
                    // Record usage only if successful
                    await this.quotaTracker.recordUsage(1);
                }
                break;

            case 'tesseract':
            default:
                result = await this.processWithTesseract(file);
                break;
        }

        // Log result summary
        console.log(`OCR completed: ${file.name} | Method: ${result.method} | Confidence: ${result.confidence}% | Time: ${result.processingTime}ms`);

        return result;
    }

    private async determineProcessingStrategy(file: FileAttachment): Promise<'google-vision' | 'tesseract'> {
        // Check if Google Vision is enabled and available
        if (!this.config.googleVisionEnabled || !await this.googleVision.isAvailable()) {
            return 'tesseract';
        }

        // Check quota limits
        const canUseGoogleVision = await this.quotaTracker.canUseGoogleVision(1);
        if (!canUseGoogleVision) {
            console.log('Google Vision quota exhausted, using Tesseract fallback');
            return 'tesseract';
        }

        // Check file type - Google Vision handles PDF directly
        if (file.type === 'application/pdf') {
            return 'google-vision'; // Google Vision is better for PDF
        }

        // For images, prefer Google Vision if available
        if (file.type.startsWith('image/')) {
            return 'google-vision';
        }

        return 'tesseract';
    }

    private async processWithGoogleVision(file: FileAttachment): Promise<OCRResult> {
        if (file.type === 'application/pdf') {
            return await this.googleVision.extractTextFromPDF(file);
        } else {
            return await this.googleVision.extractTextFromImage(file);
        }
    }

    private async processWithTesseract(file: FileAttachment): Promise<OCRResult> {
        if (file.type === 'application/pdf') {
            return await this.tesseract.extractTextFromPDF(file);
        } else {
            return await this.tesseract.extractTextFromImage(file);
        }
    }

    async getQuotaStatus() {
        return await this.quotaTracker.getUsageStats();
    }

    async testServices(): Promise<{
        googleVision: { available: boolean; error?: string };
        tesseract: { available: boolean; error?: string };
    }> {
        const results = {
            googleVision: { available: false, error: undefined as string | undefined },
            tesseract: { available: false, error: undefined as string | undefined },
        };

        // Test Google Vision
        try {
            results.googleVision.available = await this.googleVision.testConnection();
        } catch (error) {
            results.googleVision.error = error instanceof Error ? error.message : 'Unknown error';
        }

        // Test Tesseract
        try {
            await this.tesseract.initWorker();
            results.tesseract.available = true;
        } catch (error) {
            results.tesseract.error = error instanceof Error ? error.message : 'Unknown error';
        }

        return results;
    }

    async cleanup() {
        await this.tesseract.cleanup();
    }

    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Batch processing for multiple files
    async processMultipleDocuments(files: FileAttachment[]): Promise<OCRResult[]> {
        const results: OCRResult[] = [];
        
        for (const file of files) {
            try {
                const result = await this.processDocument(file);
                results.push(result);
            } catch (error) {
                results.push({
                    text: '',
                    method: 'tesseract',
                    confidence: 0,
                    processingTime: 0,
                    error: `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                });
            }
        }

        return results;
    }
}

// Singleton instance
let ocrManagerInstance: OCRManager | null = null;

export const getOCRManager = (config?: Partial<OCRConfig>): OCRManager => {
    if (!ocrManagerInstance) {
        ocrManagerInstance = new OCRManager(config);
    }
    return ocrManagerInstance;
};