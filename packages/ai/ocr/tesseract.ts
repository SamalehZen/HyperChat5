import Tesseract from 'tesseract.js';
import pdf from 'pdf-poppler';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

export interface TesseractOCRResult {
    text: string;
    confidence: number;
    method: 'tesseract';
}

export class TesseractService {
    private worker: Tesseract.Worker | null = null;

    constructor() {
        this.initializeWorker();
    }

    /**
     * Initialize Tesseract worker
     */
    private async initializeWorker(): Promise<void> {
        try {
            this.worker = await Tesseract.createWorker('fra+eng');
        } catch (error) {
            console.error('Failed to initialize Tesseract worker:', error);
            throw new Error('Tesseract initialization failed');
        }
    }

    /**
     * Extract text from base64 encoded PDF
     */
    async extractTextFromPDF(base64PDF: string): Promise<TesseractOCRResult> {
        try {
            // Remove data URL prefix if present
            const cleanBase64 = base64PDF.replace(/^data:application\/pdf;base64,/, '');
            const buffer = Buffer.from(cleanBase64, 'base64');

            // Convert PDF to images
            const imageBuffers = await this.convertPDFToImages(buffer);
            
            let fullText = '';
            let totalConfidence = 0;

            for (const imageBuffer of imageBuffers) {
                const result = await this.extractTextFromImage(imageBuffer);
                fullText += result.text + '\n';
                totalConfidence += result.confidence;
            }

            return {
                text: fullText.trim(),
                confidence: totalConfidence / imageBuffers.length,
                method: 'tesseract',
            };
        } catch (error) {
            console.error('Tesseract PDF OCR error:', error);
            throw new Error(`Tesseract failed: ${error}`);
        }
    }

    /**
     * Extract text from image buffer
     */
    async extractTextFromImage(imageBuffer: Buffer): Promise<TesseractOCRResult> {
        try {
            if (!this.worker) {
                await this.initializeWorker();
            }

            // Optimize image for OCR
            const optimizedBuffer = await this.optimizeImageForOCR(imageBuffer);

            const { data } = await this.worker!.recognize(optimizedBuffer);
            
            return {
                text: data.text,
                confidence: data.confidence / 100, // Convert to 0-1 scale
                method: 'tesseract',
            };
        } catch (error) {
            console.error('Tesseract image OCR error:', error);
            throw new Error(`Tesseract failed: ${error}`);
        }
    }

    /**
     * Convert PDF buffer to image buffers
     */
    async convertPDFToImages(pdfBuffer: Buffer): Promise<Buffer[]> {
        try {
            const tempDir = tmpdir();
            const pdfPath = join(tempDir, `temp-${Date.now()}.pdf`);
            
            // Write PDF to temp file
            await fs.writeFile(pdfPath, pdfBuffer);

            // Convert PDF pages to images
            const options = {
                type: 'png',
                size: 2048,
                density: 300,
                outputDir: tempDir,
                outputName: `pdf-page-${Date.now()}`,
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
                    console.warn(`Could not read page ${i}:`, error);
                }
            }

            // Clean up temp PDF file
            await fs.unlink(pdfPath).catch(() => {});

            return imageBuffers;
        } catch (error) {
            console.error('PDF to images conversion error:', error);
            throw new Error(`PDF conversion failed: ${error}`);
        }
    }

    /**
     * Optimize image for better OCR results
     */
    private async optimizeImageForOCR(imageBuffer: Buffer): Promise<Buffer> {
        try {
            return await sharp(imageBuffer)
                .grayscale()
                .normalize()
                .sharpen()
                .png({ quality: 100 })
                .toBuffer();
        } catch (error) {
            console.warn('Image optimization failed, using original:', error);
            return imageBuffer;
        }
    }

    /**
     * Clean up resources
     */
    async terminate(): Promise<void> {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
        }
    }
}