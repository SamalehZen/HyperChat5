// Vercel-compatible PDF.js configuration
const PDFJSConfig = {
    // Use CDN worker to avoid bundling issues
    workerSrc: 'https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.js',
    cMapUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/cmaps/',
    cMapPacked: true,
    // Disable font loading for faster processing
    useSystemFonts: true,
    // Optimize for serverless
    maxImageSize: 1024 * 1024, // 1MB max per image
    isEvalSupported: false,
};

export { PDFJSConfig };