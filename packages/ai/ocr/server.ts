// Server-only exports for OCR functionality
// This file should only be imported in server-side contexts (API routes, etc.)

export * from './types';
export * from './config';
export * from './google-vision';
export * from './tesseract';
export * from './quota-tracker';
export * from './ocr-manager';

// Default export for server usage
export { getOCRManager as default } from './ocr-manager';