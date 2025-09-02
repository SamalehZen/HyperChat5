/**
 * Client-safe OCR utilities
 * This file only imports client-safe OCR dependencies
 */

import { ClientQuotaTracker } from '@repo/ai/ocr/client';

/**
 * Get OCR quota status for UI display (client-safe)
 */
export async function getOCRQuotaStatus() {
    try {
        // Use client-safe quota tracker
        const tracker = new ClientQuotaTracker();
        return await tracker.getQuotaStatus();
    } catch (error) {
        console.error('Failed to get OCR quota status:', error);
        return {
            percentage: 0,
            status: 'green' as const,
            message: 'Statut du quota indisponible',
        };
    }
}

/**
 * Get current OCR quota usage
 */
export async function getOCRQuotaUsage() {
    try {
        const tracker = new ClientQuotaTracker();
        return await tracker.getCurrentUsage();
    } catch (error) {
        console.error('Failed to get OCR quota usage:', error);
        return {
            used: 0,
            remaining: 1000,
            month: new Date().toISOString().slice(0, 7),
            resetDate: new Date(),
        };
    }
}