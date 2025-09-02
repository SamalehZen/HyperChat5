import { auth } from '@clerk/nextjs/server';
import { getOCRManager } from '@repo/ai/ocr/server';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const ocrRequestSchema = z.object({
    files: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        base64: z.string(),
        size: z.number().optional().default(0),
    })),
});

export async function POST(request: NextRequest) {
    try {
        // Authentication check - same pattern as completion route
        const session = await auth();
        const userId = session?.userId ?? undefined;

        const parsed = await request.json().catch(() => ({}));
        const validatedBody = ocrRequestSchema.safeParse(parsed);

        if (!validatedBody.success) {
            return new Response(
                JSON.stringify({
                    error: 'Invalid request body',
                    details: validatedBody.error.format(),
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { files } = validatedBody.data;

        console.log(`Processing ${files.length} files with OCR`);

        const ocrManager = getOCRManager();
        const results = [];

        // Process each file
        for (const file of files) {
            try {
                console.log(`Processing file: ${file.name} (${file.type})`);
                const ocrResult = await ocrManager.processDocument(file);
                results.push({
                    id: file.id,
                    name: file.name,
                    type: file.type,
                    success: !ocrResult.error,
                    text: ocrResult.text,
                    method: ocrResult.method,
                    confidence: ocrResult.confidence,
                    processingTime: ocrResult.processingTime,
                    error: ocrResult.error,
                });
                
                console.log(`OCR result for ${file.name}: ${ocrResult.method} | ${ocrResult.confidence}% confidence`);
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                results.push({
                    id: file.id,
                    name: file.name,
                    type: file.type,
                    success: false,
                    text: '',
                    method: 'unknown',
                    confidence: 0,
                    processingTime: 0,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return new Response(JSON.stringify({ results }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error in OCR API handler:', error);
        return new Response(
            JSON.stringify({ 
                error: 'Internal server error', 
                details: String(error),
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

// GET endpoint to check OCR quota status
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        const userId = session?.userId ?? undefined;

        const ocrManager = getOCRManager();
        const quotaStatus = await ocrManager.getQuotaStatus();

        return new Response(JSON.stringify(quotaStatus), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error getting OCR quota status:', error);
        return new Response(
            JSON.stringify({ 
                error: 'Failed to get quota status', 
                details: String(error),
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}