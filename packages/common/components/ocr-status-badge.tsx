import React from 'react';
import { Badge } from '@repo/ui';

interface OCRStatusBadgeProps {
    method?: 'google-vision' | 'tesseract';
    confidence?: number;
    isProcessing?: boolean;
    error?: string;
    className?: string;
}

export const OCRStatusBadge: React.FC<OCRStatusBadgeProps> = ({
    method,
    confidence,
    isProcessing,
    error,
    className,
}) => {
    if (isProcessing) {
        return (
            <Badge variant="secondary" className={className}>
                <div className="flex items-center gap-1">
                    <div className="h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" />
                    OCR en cours...
                </div>
            </Badge>
        );
    }

    if (error) {
        return (
            <Badge variant="destructive" className={className}>
                Erreur OCR
            </Badge>
        );
    }

    if (method && confidence !== undefined) {
        const confidencePercent = Math.round(confidence * 100);
        const variant = method === 'google-vision' ? 'default' : 'secondary';
        const methodLabel = method === 'google-vision' ? 'Google Vision' : 'Tesseract';

        return (
            <Badge variant={variant} className={className}>
                {methodLabel} ({confidencePercent}%)
            </Badge>
        );
    }

    return null;
};