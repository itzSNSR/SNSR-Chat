import express from 'express';
import multer from 'multer';

const router = express.Router();

// Multer config — memory storage, 10MB max
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'application/pdf'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only images (JPEG, PNG, GIF, BMP) and PDF files are allowed'));
        }
    }
});

// POST /api/ocr/extract — Extract text from image or PDF
router.post('/extract', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const apiKey = process.env.OCR_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'OCR API key not configured' });
        }

        // Build FormData for OCR.space API
        const formData = new FormData();
        const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
        formData.append('file', blob, req.file.originalname);
        formData.append('apikey', apiKey);
        formData.append('language', 'eng');
        formData.append('isOverlayRequired', 'false');
        formData.append('detectOrientation', 'true');
        formData.append('scale', 'true');
        formData.append('OCREngine', '2'); // Engine 2 is better for most text

        // For PDF files, enable multi-page processing
        if (req.file.mimetype === 'application/pdf') {
            formData.append('isTable', 'true');
        }

        // Call OCR.space API
        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.IsErroredOnProcessing) {
            const errorMsg = result.ErrorMessage?.[0] || 'OCR processing failed';
            return res.status(400).json({ error: errorMsg });
        }

        // Extract text from all parsed results (multi-page support)
        const extractedText = result.ParsedResults
            ?.map(r => r.ParsedText)
            .filter(Boolean)
            .join('\n\n--- Page Break ---\n\n');

        if (!extractedText || extractedText.trim().length === 0) {
            return res.status(400).json({ error: 'No text could be extracted from the file. The image might be too blurry or contain no text.' });
        }

        res.json({
            text: extractedText.trim(),
            filename: req.file.originalname,
            pages: result.ParsedResults?.length || 1,
            fileType: req.file.mimetype
        });

    } catch (error) {
        console.error('OCR Error:', error);

        // Handle multer file size error
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }

        res.status(500).json({ error: error.message || 'Failed to extract text from file' });
    }
});

export default router;
