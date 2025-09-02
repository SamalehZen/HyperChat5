import { NextRequest, NextResponse } from 'next/server';
import { processFileAttachmentsWithOCR } from '@repo/shared/utils';
import { type FileAttachment } from '@repo/shared/types';

export async function POST(request: NextRequest) {
    try {
        const attachments: FileAttachment[] = await request.json();
        
        if (!attachments || !Array.isArray(attachments)) {
            return NextResponse.json(
                { error: 'Invalid request body. Expected array of file attachments.' },
                { status: 400 }
            );
        }

        // Process attachments with OCR
        const processedAttachments = await processFileAttachmentsWithOCR(attachments);
        
        return NextResponse.json(processedAttachments);
    } catch (error) {
        console.error('OCR API error:', error);
        return NextResponse.json(
            { error: 'OCR processing failed', details: String(error) },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json(
        { message: 'OCR API is running' },
        { status: 200 }
    );
}