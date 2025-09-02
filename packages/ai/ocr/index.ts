export * from './types';
export * from './config';
export * from './google-vision';
export * from './tesseract';
export * from './quota-tracker';
export * from './ocr-manager';

// Default export for easy usage
export { getOCRManager as default } from './ocr-manager';