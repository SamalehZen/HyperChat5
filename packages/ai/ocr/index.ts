export { GoogleVisionService } from './google-vision';
export { TesseractService } from './tesseract';
export { QuotaTracker } from './quota-tracker';
export { OCRManager, getOCRManager } from './ocr-manager';

// Client-safe exports
export { ClientQuotaTracker, hasGoogleVisionApiKey } from './client';

export type {
    OCRResult as GoogleVisionOCRResult,
    QuotaInfo,
} from './google-vision';

export type {
    TesseractOCRResult,
} from './tesseract';

export type {
    QuotaUsage,
    UsageRecord,
} from './quota-tracker';

export type {
    OCRResult,
    OCRConfig,
} from './ocr-manager';