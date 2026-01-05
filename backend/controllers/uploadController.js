const axios = require('axios');
const FormData = require('form-data');
const { run, get } = require('../database/db');
const {
  IMGBB_API_KEY,
  IMGBB_UPLOAD_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} = require('../config/upload');

// Upload image to ImgBB (PostgreSQL version)
const uploadImage = async (req, res) => {
  try {
    console.log('Image upload started...');
    const { propertyId } = req.body;
    const file = req.file;

    console.log('Property ID:', propertyId);
    console.log('File received:', file ? {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    } : 'No file');

    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    // Check if property exists - PostgreSQL uses $1 placeholder
    const property = await get('SELECT id FROM properties WHERE id = $1', [propertyId]);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Convert buffer to base64
    const base64Image = file.buffer.toString('base64');
    console.log('Image converted to base64, length:', base64Image.length);

    // Upload to ImgBB
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Image);
    formData.append('name', `property_${propertyId}_${Date.now()}`);
    
    console.log('Uploading to ImgBB...');
    
    const response = await axios.post(IMGBB_UPLOAD_URL, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });

    console.log('ImgBB response status:', response.status);

    if (!response.data.success) {
      throw new Error(`ImgBB upload failed: ${response.data.error?.message || 'Unknown error'}`);
    }

    const imageUrl = response.data.data.url;
    console.log('Image URL received:', imageUrl);

    // Save to database - PostgreSQL uses $1, $2, $3
    await run(
      'INSERT INTO property_media (property_id, media_type, media_url) VALUES ($1, $2, $3)',
      [propertyId, 'photo', imageUrl]
    );

    res.json({
      message: 'Image uploaded successfully',
      url: imageUrl
    });

  } catch (error) {
    console.error('Image upload error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ error: 'Upload timeout. Please try again.' });
    }
    
    if (error.response) {
      console.error('ImgBB error response:', error.response.data);
      return res.status(502).json({ 
        error: 'ImgBB service error', 
        details: error.response.data.error?.message || 'Unknown ImgBB error' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to upload image',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Upload video to Cloudinary (PostgreSQL version)
const uploadVideo = async (req, res) => {
  try {
    console.log('Video upload started...');
    const { propertyId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    // Check if property exists
    const property = await get('SELECT id FROM properties WHERE id = $1', [propertyId]);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check file size
    if (file.size > 50 * 1024 * 1024) {
      return res.status(400).json({ error: 'Video file must be less than 50MB' });
    }

    console.log(`Uploading video: ${file.originalname}, Size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);

    // Convert buffer to base64
    const base64Video = file.buffer.toString('base64');
    const dataUri = `data:${file.mimetype};base64,${base64Video}`;
    
    const publicId = `property_${propertyId}_video_${Date.now()}`;

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', dataUri);
    formData.append('upload_preset', 'real_estate_videos');
    formData.append('resource_type', 'video');
    formData.append('folder', 'real-estate-videos');
    formData.append('public_id', publicId);
    formData.append('tags', `property_${propertyId},real_estate`);
    
    console.log('Sending to Cloudinary...');
    
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 300000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    console.log('✅ Cloudinary upload successful');
    
    const videoUrl = response.data.secure_url;

    // Save to database
    await run(
      'INSERT INTO property_media (property_id, media_type, media_url) VALUES ($1, $2, $3)',
      [propertyId, 'video', videoUrl]
    );

    console.log('✅ Video saved to database');

    res.json({
      message: 'Video uploaded successfully',
      url: videoUrl,
      duration: response.data.duration,
      format: response.data.format,
      size: response.data.bytes,
      public_id: response.data.public_id
    });

  } catch (error) {
    console.error('❌ Video upload error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ 
        error: 'Upload timeout', 
        message: 'Video upload took too long. Try a smaller file.' 
      });
    }
    
    if (error.response) {
      console.error('Cloudinary error:', error.response.data);
      return res.status(502).json({ 
        error: 'Cloudinary error', 
        message: error.response.data.error?.message || 'Upload failed' 
      });
    }
    
    res.status(500).json({ 
      error: 'Upload failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete media (PostgreSQL version)
const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the media record
    const media = await get('SELECT * FROM property_media WHERE id = $1', [id]);

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // If it's a Cloudinary video
    if (media.media_type === 'video' && media.media_url && media.media_url.includes('cloudinary.com')) {
      try {
        const CloudinaryDelete = require('../utils/cloudinaryDelete');
        const cleaner = new CloudinaryDelete();
        const publicId = cleaner.extractPublicId(media.media_url);
        if (publicId) {
          const result = await cleaner.deleteResource(publicId, 'video');
          if (!result.success) {
            console.warn('Cloudinary deletion reported failure:', result.error);
          }
        } else {
          console.warn('Could not extract Cloudinary public_id for URL:', media.media_url);
        }
      } catch (err) {
        console.error('Error deleting from Cloudinary:', err);
      }
    }

    // Delete from database
    await run('DELETE FROM property_media WHERE id = $1', [id]);

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
};

module.exports = {
  uploadImage,
  uploadVideo,
  deleteMedia
};
backend/config/upload.js
// ImgBB Configuration
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || 'your-imgbb-api-key';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'your-api-key';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'your-api-secret';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

module.exports = {
  IMGBB_API_KEY,
  IMGBB_UPLOAD_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_UPLOAD_URL
};