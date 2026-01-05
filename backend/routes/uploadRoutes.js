const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  uploadImage,
  uploadVideo,
  deleteMedia
} = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

// Configure multer with separate limits for images and videos
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  console.log('File filter checking:', file.mimetype, file.originalname);
  
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported image type: ${file.mimetype}. Please use JPEG, PNG, GIF, or WebP.`), false);
    }
  } else if (file.mimetype.startsWith('video/')) {
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/ogg', 'video/webm', 'video/quicktime'];
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported video type: ${file.mimetype}. Please use MP4, MPEG, OGG, or WebM.`), false);
    }
  } else {
    cb(new Error('Only image and video files are allowed'), false);
  }
};

// Create separate upload instances with different limits
const uploadImageMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for images
  }
});

// In uploadVideoMiddleware, change limit from 50MB to 32MB (ImgBB limit)
const uploadVideoMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 32 * 1024 * 1024, // Changed from 50MB to 32MB for ImgBB
  }
});

// Update error message
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const fileType = req.path.includes('image') ? 'Image' : 'Video';
      const maxSize = req.path.includes('image') ? '10MB' : '32MB'; // Changed from 50MB to 32MB
      return res.status(400).json({ 
        success: false,
        error: 'File too large', 
        message: `${fileType} file must be less than ${maxSize}` 
      });
    }
    return res.status(400).json({ 
      success: false,
      error: 'Upload error', 
      message: err.message 
    });
  } else if (err) {
    return res.status(400).json({ 
      success: false,
      error: 'File validation error', 
      message: err.message 
    });
  }
  next();
};

// Protected upload routes with size limits
router.post('/image', 
  authenticateToken, 
  uploadImageMiddleware.single('image'),
  handleUploadError,
  uploadImage
);

router.post('/video', 
  authenticateToken, 
  uploadVideoMiddleware.single('video'),
  handleUploadError,
  uploadVideo
);

router.delete('/media/:id', authenticateToken, deleteMedia);

module.exports = router;