import { createWorker } from 'tesseract.js';
import pdf2pic from 'pdf2pic';
import sharp from 'sharp';
import { OCRResult, FileAttachment } from './types';

export class TesseractService {
    private worker: any = null;

    async initWorker() {
        if (this.worker) return this.worker;
        
        this.worker = await createWorker('eng+fra', 1, {
            logger: (m) => {
                if (process.env.NODE_ENV === 'development') {
                    console.log('[Tesseract]', m);
                }
            },
        });

        return this.worker;
    }

    async extractTextFromPDF(file: FileAttachment): Promise<OCRResult> {
        const startTime = Date.now();

        try {
            // Convert base64 to buffer
            const base64Data = file.base64.replace(/^data:application\/pdf;base64,/, '');
            const pdfBuffer = Buffer.from(base64Data, 'base64');

            // Convert PDF to images
            const images = await this.convertPDFToImages(pdfBuffer);
            
            if (images.length === 0) {
                throw new Error('No images found in PDF');
            }

            // Initialize worker
            const worker = await this.initWorker();

            // Process each page
            let fullText = '';
            let totalConfidence = 0;

            for (let i = 0; i < images.length; i++) {
                console.log(`Processing PDF page ${i + 1}/${images.length}...`);
                
                const { data } = await worker.recognize(images[i]);
                fullText += `--- Page ${i + 1} ---\n${data.text}\n\n`;
                totalConfidence += data.confidence;
            }

            const averageConfidence = Math.round(totalConfidence / images.length);

            return {
                text: fullText.trim(),
                method: 'tesseract',
                confidence: averageConfidence,
                processingTime: Date.now() - startTime,
            };
        } catch (error) {
            console.error('Tesseract OCR failed:', error);
            
            return {
                text: '',
                method: 'tesseract',
                confidence: 0,
                processingTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    async extractTextFromImage(file: FileAttachment): Promise<OCRResult> {
        const startTime = Date.now();

        try {
            // Convert base64 to buffer
            const base64Data = file.base64.replace(/^data:image\/[^;]+;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');

            // Optimize image for OCR
            const optimizedImage = await sharp(imageBuffer)
                .resize(null, 2000, { 
                    withoutEnlargement: true,
                    fit: 'inside',
                })
                .sharpen()
                .toBuffer();

            // Initialize worker
            const worker = await this.initWorker();

            // Perform OCR
            const { data } = await worker.recognize(optimizedImage);

            return {
                text: data.text.trim(),
                method: 'tesseract',
                confidence: Math.round(data.confidence),
                processingTime: Date.now() - startTime,
            };
        } catch (error) {
            console.error('Tesseract image OCR failed:', error);
            
            return {
                text: '',
                method: 'tesseract',
                confidence: 0,
                processingTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    private async convertPDFToImages(pdfBuffer: Buffer): Promise<Buffer[]> {
        try {
            // Convert PDF to images using pdf2pic
            const convert = pdf2pic.fromBuffer(pdfBuffer, {
                density: 300,           // High DPI for better OCR
                saveFilename: "untitled",
                savePath: "/tmp",
                format: "png",
                width: 2000,           // High resolution
                height: 2000,
            });

            // Get page count first
            const firstPage = await convert(1, { responseType: "buffer" });
            
            const images: Buffer[] = [];
            let pageNum = 1;
            
            try {
                while (true) {
                    const page = await convert(pageNum, { responseType: "buffer" });
                    
                    if (page.buffer) {
                        images.push(page.buffer);
                        pageNum++;
                    } else {
                        break;
                    }
                    
                    // Safety limit
                    if (pageNum > 50) {
                        console.warn('PDF has more than 50 pages, limiting to first 50');
                        break;
                    }
                }
            } catch (error) {
                // Expected when reaching end of document
                if (pageNum === 1) {
                    throw error; // Real error on first page
                }
            }

            return images;
        } catch (error) {
            console.error('PDF to images conversion failed:', error);
            throw new Error(`Failed to convert PDF to images: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async cleanup() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
        }
    }
}