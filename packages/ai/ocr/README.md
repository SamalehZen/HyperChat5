# 🔍 OCR System for HyperChat5

This module provides intelligent OCR (Optical Character Recognition) capabilities for PDF and image files using Google Vision API with Tesseract.js fallback.

## ⚙️ Configuration

### 1. Environment Variables

Create a `.env.local` file in your project root:

```bash
# Google Vision API
GOOGLE_VISION_API_KEY=your_google_vision_api_key_here
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# OCR Settings
VISION_API_ENABLED=true
VISION_MONTHLY_QUOTA=1000
OCR_FALLBACK_ENABLED=true
OCR_MAX_FILE_SIZE=10485760
```

### 2. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the **Vision API**
4. Create a **Service Account** and download the JSON key
5. Set `GOOGLE_APPLICATION_CREDENTIALS` to the JSON file path
6. Or use the API key directly with `GOOGLE_VISION_API_KEY`

## 🚀 Usage

### Basic Usage

```typescript
import { getOCRManager } from '@repo/ai/ocr';

const ocrManager = getOCRManager();

// Process a PDF file
const result = await ocrManager.processDocument({
    id: 'file-1',
    name: 'document.pdf',
    type: 'application/pdf',
    base64: 'data:application/pdf;base64,...',
    size: 1024000,
});

console.log(`Extracted text: ${result.text}`);
console.log(`Method used: ${result.method}`);
console.log(`Confidence: ${result.confidence}%`);
```

### Batch Processing

```typescript
const files = [/* array of FileAttachment objects */];
const results = await ocrManager.processMultipleDocuments(files);
```

### Quota Monitoring

```typescript
const quotaStatus = await ocrManager.getQuotaStatus();
console.log(`Google Vision usage: ${quotaStatus.currentMonth.used}/${quotaStatus.currentMonth.limit}`);
```

## 🔄 How it Works

### Processing Strategy

1. **Check quota**: Verify Google Vision API quota availability
2. **Choose method**: 
   - Google Vision (if quota available, high quality)
   - Tesseract (free fallback, good quality)
3. **Process file**:
   - PDF: Google Vision handles directly OR Tesseract via PDF→Images
   - Images: Direct processing with both services
4. **Return result**: Text + metadata (method, confidence, timing)

### Fallback Logic

```
📊 Google Vision Available + Quota OK
├── ✅ Use Google Vision (fast, accurate)
└── ❌ Fallback to Tesseract if fails

📊 Google Vision Unavailable OR No Quota  
└── ✅ Use Tesseract (slower, free)
```

## 📈 Monitoring

### Quota Tracking

- **Local storage**: Tracks monthly usage client-side
- **Auto reset**: Resets every month automatically
- **Warnings**: Alerts at 80% usage
- **Auto fallback**: Switches to Tesseract at 95% usage

### Performance Metrics

Each OCR result includes:
- `processingTime`: Time taken in milliseconds
- `confidence`: Accuracy percentage (0-100)
- `method`: Which service was used
- `error`: Error message if processing failed

## 🎯 Integration with Chat Modes

OCR is automatically enabled for these chat modes:
- **SMART_PDF_TO_EXCEL**: Extracts table data from PDF invoices
- **REVISION_DE_PRIX**: Processes invoice documents

Other modes use files as-is without OCR processing.

## 🛠️ Troubleshooting

### Common Issues

**Google Vision fails**
```bash
# Check API key
echo $GOOGLE_VISION_API_KEY

# Test connection
node -e "console.log(require('@google-cloud/vision'))"
```

**Tesseract is slow**
```bash
# Expected: 5-15 seconds per document
# Large PDFs take longer due to image conversion
```

**Out of quota**
```bash
# Check quota status in browser localStorage
# Key: 'google-vision-quota'
```

## 📦 Dependencies

- `@google-cloud/vision`: Google Vision API client
- `tesseract.js`: Open source OCR engine
- `pdf-poppler`: PDF to image conversion
- `sharp`: Image optimization

## 🔒 Privacy & Security

- **Google Vision**: Documents are sent to Google servers
- **Tesseract**: All processing happens locally on your server
- **Recommendation**: Use Tesseract for sensitive documents