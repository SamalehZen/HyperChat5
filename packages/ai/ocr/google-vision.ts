import { ImageAnnotatorClient } from '@google-cloud/vision';
import pdf from 'pdf-poppler';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

export interface OCRResult {
    text: string;
    confidence: number;
    method: 'google-vision';
}

export interface QuotaInfo {
    remaining: number;
    resetDate: Date;
}

export class GoogleVisionService {
    private client: ImageAnnotatorClient;
    private apiKey: string;
    private monthlyQuota: number;

    constructor(apiKey: string, monthlyQuota: number = 1000) {
        this.apiKey = apiKey;
        this.monthlyQuota = monthlyQuota;
        
        // Initialize client with API key
        this.client = new ImageAnnotatorClient({
            apiKey: this.apiKey,
        });
    }

    /**
     * Extract text from base64 encoded PDF
     */
    async extractTextFromPDF(base64PDF: string): Promise<OCRResult> {
        try {
            // Remove data URL prefix if present
            const cleanBase64 = base64PDF.replace(/^data:application\/pdf;base64,/, '');
            const buffer = Buffer.from(cleanBase64, 'base64');

            // Convert PDF to images first (we'll need pdf-poppler for this)
            const images = await this.convertPDFToImages(buffer);
            let fullText = '';
            let totalConfidence = 0;

            for (const image of images) {
                const result = await this.extractTextFromImage(image);
                fullText += result.text + '\n';
                totalConfidence += result.confidence;
            }

            return {
                text: fullText.trim(),
                confidence: totalConfidence / images.length,
                method: 'google-vision',
            };
        } catch (error) {
            console.error('Google Vision PDF OCR error:', error);
            throw new Error(`Google Vision failed: ${error}`);
        }
    }

    /**
     * Extract text from base64 encoded image
     */
    async extractTextFromImage(imageBuffer: Buffer): Promise<OCRResult> {
        try {
            const [result] = await this.client.textDetection({
                image: {
                    content: imageBuffer,
                },
            });

            const detections = result.textAnnotations || [];
            const text = detections.length > 0 ? detections[0].description || '' : '';
            
            // Calculate confidence based on detection quality
            const confidence = this.calculateConfidence(detections);

            return {
                text,
                confidence,
                method: 'google-vision',
            };
        } catch (error) {
            console.error('Google Vision image OCR error:', error);
            throw new Error(`Google Vision failed: ${error}`);
        }
    }

    /**
     * Check remaining quota (simplified - in production would call actual API)
     */
    async checkQuota(): Promise<QuotaInfo> {
        // This is a simplified implementation
        // In production, you would call Google's quota API or maintain local tracking
        const now = new Date();
        const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        
        return {
            remaining: this.monthlyQuota,
            resetDate,
        };
    }

    /**
     * Convert PDF buffer to image buffers using pdf-poppler
     */
    private async convertPDFToImages(pdfBuffer: Buffer): Promise<Buffer[]> {
        try {
            const tempDir = tmpdir();
            const pdfPath = join(tempDir, `google-vision-pdf-${Date.now()}.pdf`);
            
            // Write PDF to temp file
            await fs.writeFile(pdfPath, pdfBuffer);

            // Convert PDF pages to images
            const options = {
                type: 'png',
                size: 2048,
                density: 300,
                outputDir: tempDir,
                outputName: `google-vision-page-${Date.now()}`,
            };

            const pages = await pdf.convert(pdfPath, options as any);
            const imageBuffers: Buffer[] = [];

            for (let i = 1; i <= pages; i++) {
                const imagePath = join(tempDir, `${options.outputName}-${i}.png`);
                try {
                    const buffer = await fs.readFile(imagePath);
                    imageBuffers.push(buffer);
                    
                    // Clean up temp image file
                    await fs.unlink(imagePath).catch(() => {});
                } catch (error) {
                    console.warn(`Could not read page ${i} for Google Vision:`, error);
                }
            }

            // Clean up temp PDF file
            await fs.unlink(pdfPath).catch(() => {});

            return imageBuffers;
        } catch (error) {
            console.error('PDF to images conversion error in Google Vision:', error);
            throw new Error(`Google Vision PDF conversion failed: ${error}`);
        }
    }

    /**
     * Calculate confidence score from Google Vision detections
     */
    private calculateConfidence(detections: any[]): number {
        if (!detections || detections.length === 0) return 0;
        
        // Google Vision doesn't provide confidence scores for text detection
        // We estimate based on number of detections and text quality
        const textLength = detections[0]?.description?.length || 0;
        const numDetections = detections.length;
        
        if (textLength === 0) return 0;
        if (textLength > 100 && numDetections > 10) return 0.9;
        if (textLength > 50 && numDetections > 5) return 0.8;
        if (textLength > 20) return 0.7;
        
        return 0.6;
    }
}