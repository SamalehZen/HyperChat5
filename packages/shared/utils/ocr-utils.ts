import { getOCRManager, type OCRResult } from '@repo/ai/ocr';
import { type FileAttachment } from '../types';

export interface ProcessedAttachment extends FileAttachment {}

/**
 * Process file attachments with OCR for PDFs
 */
export async function processFileAttachmentsWithOCR(
    attachments: FileAttachment[]
): Promise<ProcessedAttachment[]> {
    if (!attachments || attachments.length === 0) {
        return [];
    }

    const ocrManager = getOCRManager();
    const processedAttachments: ProcessedAttachment[] = [...attachments];

    // Identify PDF attachments that need OCR
    const pdfAttachments = attachments.filter(
        attachment => attachment.type === 'application/pdf' || 
                     attachment.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfAttachments.length === 0) {
        return processedAttachments;
    }

    console.log(`Processing ${pdfAttachments.length} PDF(s) with OCR...`);

    try {
        // Process PDFs with OCR in parallel
        const ocrResults = await ocrManager.processDocuments(pdfAttachments);

        // Update processed attachments with OCR results
        processedAttachments.forEach((attachment, index) => {
            if (pdfAttachments.some(pdf => pdf.id === attachment.id)) {
                const ocrResult = ocrResults.get(attachment.id);
                
                if (ocrResult) {
                    attachment.extractedText = ocrResult.text;
                    attachment.ocrMethod = ocrResult.method;
                    attachment.ocrConfidence = ocrResult.confidence;
                    attachment.ocrError = ocrResult.error;
                    attachment.isProcessing = false;

                    console.log(
                        `OCR completed for ${attachment.name}: ` +
                        `${ocrResult.method} (confidence: ${Math.round(ocrResult.confidence * 100)}%)`
                    );
                } else {
                    attachment.ocrError = 'OCR processing failed';
                    attachment.isProcessing = false;
                }
            }
        });

    } catch (error) {
        console.error('OCR processing error:', error);
        
        // Mark all PDF attachments as failed
        processedAttachments.forEach(attachment => {
            if (pdfAttachments.some(pdf => pdf.id === attachment.id)) {
                attachment.ocrError = `OCR failed: ${error}`;
                attachment.isProcessing = false;
            }
        });
    }

    return processedAttachments;
}

/**
 * Build content for message with OCR support
 */
export function buildContentWithOCR(attachment: ProcessedAttachment) {
    if (attachment.type.startsWith('image/')) {
        return { type: 'image' as const, image: attachment.data };
    }

    if (attachment.type === 'application/pdf' || attachment.name.toLowerCase().endsWith('.pdf')) {
        if (attachment.extractedText) {
            // Include OCR metadata in the content
            const metadata = `[PDF: ${attachment.name}]`;
            const methodInfo = attachment.ocrMethod ? 
                `\n[OCR: ${attachment.ocrMethod}, Confiance: ${Math.round((attachment.ocrConfidence || 0) * 100)}%]` : '';
            
            return {
                type: 'text' as const,
                text: `${metadata}${methodInfo}\n\n${attachment.extractedText}`
            };
        } else if (attachment.ocrError) {
            return {
                type: 'text' as const,
                text: `[PDF: ${attachment.name}]\n[Erreur OCR: ${attachment.ocrError}]\n\n${attachment.data}`
            };
        } else if (attachment.isProcessing) {
            return {
                type: 'text' as const,
                text: `[PDF: ${attachment.name}]\n[OCR en cours...]\n\n${attachment.data}`
            };
        }

        // Fallback to original data
        return {
            type: 'text' as const,
            text: `[PDF: ${attachment.name}]\n${attachment.data}`
        };
    }

    // For other file types, return as text
    return {
        type: 'text' as const,
        text: `[Fichier: ${attachment.name}]\n${attachment.data}`
    };
}

/**
 * Get OCR quota status for UI display
 */
export async function getOCRQuotaStatus() {
    try {
        const ocrManager = getOCRManager();
        return await ocrManager.getQuotaStatus();
    } catch (error) {
        console.error('Failed to get OCR quota status:', error);
        return {
            percentage: 0,
            status: 'green' as const,
            message: 'Statut du quota indisponible',
        };
    }
}