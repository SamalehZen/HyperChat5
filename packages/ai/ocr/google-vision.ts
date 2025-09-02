import { ImageAnnotatorClient } from '@google-cloud/vision';
import { OCRResult, FileAttachment } from './types';

export class GoogleVisionService {
    private client: ImageAnnotatorClient | undefined;
    private enabled: boolean;

    constructor() {
        this.enabled = process.env.GOOGLE_VISION_API_KEY ? true : false;
        
        if (this.enabled) {
            this.client = new ImageAnnotatorClient({
                keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
                apiKey: process.env.GOOGLE_VISION_API_KEY,
            });
        }
    }

    async isAvailable(): Promise<boolean> {
        return this.enabled && !!process.env.GOOGLE_VISION_API_KEY;
    }

    async extractTextFromPDF(file: FileAttachment): Promise<OCRResult> {
        const startTime = Date.now();

        try {
            if (!this.enabled || !this.client) {
                throw new Error('Google Vision API not configured');
            }

            // Convert base64 to buffer
            const base64Data = file.base64.replace(/^data:application\/pdf;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            // Google Vision can handle PDF directly
            const [result] = await this.client.documentTextDetection({
                image: { content: buffer },
            });

            const text = result.fullTextAnnotation?.text || '';
            const confidence = this.calculateConfidence(result);

            return {
                text: text.trim(),
                method: 'google-vision',
                confidence,
                processingTime: Date.now() - startTime,
            };
        } catch (error) {
            console.error('Google Vision OCR failed:', error);
            
            return {
                text: '',
                method: 'google-vision',
                confidence: 0,
                processingTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    async extractTextFromImage(file: FileAttachment): Promise<OCRResult> {
        const startTime = Date.now();

        try {
            if (!this.enabled || !this.client) {
                throw new Error('Google Vision API not configured');
            }

            // Convert base64 to buffer
            const base64Data = file.base64.replace(/^data:image\/[^;]+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            const [result] = await this.client.textDetection({
                image: { content: buffer },
            });

            const text = result.textAnnotations?.[0]?.description || '';
            const confidence = this.calculateConfidence(result);

            return {
                text: text.trim(),
                method: 'google-vision',
                confidence,
                processingTime: Date.now() - startTime,
            };
        } catch (error) {
            console.error('Google Vision OCR failed:', error);
            
            return {
                text: '',
                method: 'google-vision', 
                confidence: 0,
                processingTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    private calculateConfidence(result: any): number {
        // Calculate average confidence from all text annotations
        const annotations = result.textAnnotations || [];
        if (annotations.length === 0) return 0;

        const totalConfidence = annotations.reduce((sum: number, annotation: any) => {
            return sum + (annotation.confidence || 0.8); // Default confidence if not available
        }, 0);

        return Math.round((totalConfidence / annotations.length) * 100);
    }

    async testConnection(): Promise<boolean> {
        try {
            if (!this.enabled || !this.client) return false;
            
            // Simple test with minimal image
            const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
            const buffer = Buffer.from(testImage.replace(/^data:image\/[^;]+;base64,/, ''), 'base64');
            
            await this.client.textDetection({ image: { content: buffer } });
            return true;
        } catch (error) {
            console.error('Google Vision connection test failed:', error);
            return false;
        }
    }
}