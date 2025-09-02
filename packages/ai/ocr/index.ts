// Client-safe exports - only types and config
export * from './types';
export * from './config';

// Server-side functionality is in server.ts
// Import from '@repo/ai/ocr/server' for server-side usage
// This prevents client-side bundling of gRPC dependencies

// Note: Server-side imports have been moved to server.ts
// Use: import { getOCRManager } from '@repo/ai/ocr/server' in API routes