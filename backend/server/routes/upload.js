import express from 'express';
import multer from 'multer';
import { authMiddleware as authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles as authorize } from '../middleware/roleMiddleware.js';;
import { imageService } from '../services/imageService.js';

const router = express.Router();

// Configure multer for memory storage (no temp files)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
});

// Upload single image
router.post('/single', authenticate, upload.single('image'), async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const { folder } = req.body;
        const fileName = req.file.originalname || 'upload.jpg';

        const result = await imageService.uploadImage(req.file.buffer, fileName, folder);

        res.json({
            message: 'Image uploaded successfully',
            image: result,
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Failed to upload image', error: error.message });
    }
});

// Upload multiple images
router.post('/multiple', authenticate, upload.array('images', 10), async(req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No image files provided' });
        }

        const { folder } = req.body;
        const uploadPromises = req.files.map(async(file) => {
            const fileName = file.originalname || 'upload.jpg';
            return imageService.uploadImage(file.buffer, fileName, folder);
        });

        const results = await Promise.all(uploadPromises);

        res.json({
            message: `${results.length} images uploaded successfully`,
            images: results,
        });
    } catch (error) {
        console.error('Multiple upload error:', error);
        res.status(500).json({ message: 'Failed to upload images', error: error.message });
    }
});

// Upload base64 image
router.post('/base64', authenticate, async(req, res) => {
    try {
        const { image: base64Data, fileName, folder } = req.body;

        if (!base64Data) {
            return res.status(400).json({ message: 'No base64 image data provided' });
        }

        const result = await imageService.uploadBase64Image(base64Data, fileName || 'upload.jpg', folder);

        res.json({
            message: 'Image uploaded successfully',
            image: result,
        });
    } catch (error) {
        console.error('Base64 upload error:', error);
        res.status(500).json({ message: 'Failed to upload image', error: error.message });
    }
});

// Delete image
router.delete('/:fileId', authenticate, async(req, res) => {
    try {
        const { fileId } = req.params;

        await imageService.deleteImage(fileId);

        res.json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: 'Failed to delete image', error: error.message });
    }
});

// Get transformed image URL
router.get('/transform', (req, res) => {
    try {
        const { url, width, height, quality, format } = req.query;

        if (!url) {
            return res.status(400).json({ message: 'Image URL is required' });
        }

        const transformedUrl = imageService.getTransformedUrl(url, {
            width: width ? parseInt(width) : undefined,
            height: height ? parseInt(height) : undefined,
            quality: quality ? parseInt(quality) : undefined,
            format: format,
        });

        res.json({ transformedUrl });
    } catch (error) {
        console.error('Transform error:', error);
        res.status(500).json({ message: 'Failed to transform image URL', error: error.message });
    }
});

export default router;