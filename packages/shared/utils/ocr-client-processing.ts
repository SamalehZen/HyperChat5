/**
 * Client-safe OCR processing utilities
 * This file calls the OCR API instead of importing server dependencies
 */

import { type FileAttachment } from '../types';

export interface ProcessedAttachment extends FileAttachment {}

/**
 * Process file attachments with OCR for PDFs (client-safe version)
 */
export async function processFileAttachmentsWithOCR(
    attachments: FileAttachment[]
): Promise<ProcessedAttachment[]> {
    if (!attachments || attachments.length === 0) {
        return [];
    }

    // Check if any PDFs need processing
    const pdfAttachments = attachments.filter(
        attachment => attachment.type === 'application/pdf' || 
                     attachment.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfAttachments.length === 0) {
        return [...attachments];
    }

    try {
        console.log(`Processing ${pdfAttachments.length} PDF(s) with OCR via API...`);

        // Call the OCR API route
        const response = await fetch('/api/ocr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(attachments),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`OCR API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
        }

        const processedAttachments: ProcessedAttachment[] = await response.json();
        
        console.log(`OCR processing completed for ${pdfAttachments.length} PDF(s)`);
        
        return processedAttachments;
    } catch (error) {
        console.error('Client-side OCR processing error:', error);
        
        // Fallback: return original attachments with error markers
        const fallbackAttachments: ProcessedAttachment[] = attachments.map(attachment => {
            if (pdfAttachments.some(pdf => pdf.id === attachment.id)) {
                return {
                    ...attachment,
                    ocrError: `OCR failed: ${error}`,
                    isProcessing: false,
                };
            }
            return attachment;
        });

        return fallbackAttachments;
    }
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