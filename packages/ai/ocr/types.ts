export interface OCRResult {
    text: string;
    method: 'google-vision' | 'tesseract';
    confidence: number;
    processingTime: number;
    error?: string;
}

export interface FileAttachment {
    id: string;
    name: string;
    type: string;
    base64: string;
    size: number;
}

export interface QuotaInfo {
    used: number;
    remaining: number;
    resetDate: Date;
    limit: number;
}

export interface OCRConfig {
    googleVisionEnabled: boolean;
    monthlyQuota: number;
    fallbackToTesseract: boolean;
    maxFileSize: number;
}