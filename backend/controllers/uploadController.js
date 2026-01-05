const axios = require('axios');
const FormData = require('form-data');
const { run, get } = require('../database/db');
const {
  IMGBB_API_KEY,
  IMGBB_UPLOAD_URL
} = require('../config/upload');

// Upload image to ImgBB
const uploadImage = async (req, res) => {
  try {
    console.log('🖼️ Image upload started...');
    const { propertyId } = req.body;
    const file = req.file;

    console.log('Property ID:', propertyId);
    console.log('File received:', file ? {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    } : 'No file');

    if (!file) {
      return res.status(400).json({ 
        success: false,
        error: 'No image file provided' 
      });
    }

    if (!propertyId) {
      return res.status(400).json({ 
        success: false,
        error: 'Property ID is required' 
      });
    }

    // Check if property exists
    const property = await get('SELECT id FROM properties WHERE id = $1', [propertyId]);
    if (!property) {
      return res.status(404).json({ 
        success: false,
        error: 'Property not found' 
      });
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
    console.log('✅ Image uploaded:', imageUrl);

    // Save to database
    await run(
      'INSERT INTO property_media (property_id, media_type, media_url) VALUES ($1, $2, $3)',
      [propertyId, 'photo', imageUrl]
    );

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      url: imageUrl,
      size: file.size,
      thumbnail: response.data.data.thumb?.url || imageUrl
    });

  } catch (error) {
    console.error('❌ Image upload error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ 
        success: false,
        error: 'Upload timeout', 
        message: 'Image upload took too long. Please try again.' 
      });
    }
    
    if (error.response) {
      console.error('ImgBB error response:', error.response.data);
      return res.status(502).json({ 
        success: false,
        error: 'ImgBB service error', 
        message: error.response.data.error?.message || 'Unknown ImgBB error' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to upload image',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Upload video to ImgBB (same as images, just different file type)
const uploadVideo = async (req, res) => {
  try {
    console.log('🎬 Video upload to ImgBB started...');
    const { propertyId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ 
        success: false,
        error: 'No video file provided' 
      });
    }

    if (!propertyId) {
      return res.status(400).json({ 
        success: false,
        error: 'Property ID is required' 
      });
    }

    // Check if property exists
    const property = await get('SELECT id FROM properties WHERE id = $1', [propertyId]);
    if (!property) {
      return res.status(404).json({ 
        success: false,
        error: 'Property not found' 
      });
    }

    // Check file size (ImgBB limit: 32MB per file)
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    if (file.size > 32 * 1024 * 1024) {
      return res.status(400).json({ 
        success: false,
        error: 'Video too large',
        message: `Video file must be less than 32MB. Your file is ${fileSizeMB}MB.`,
        maxSize: '32MB',
        yourSize: `${fileSizeMB}MB`
      });
    }

    // Check file type
    const allowedTypes = [
      'video/mp4', 'video/mpeg', 'video/quicktime', 
      'video/x-msvideo', 'video/webm', 'video/ogg'
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        success: false,
        error: 'Unsupported format',
        message: 'Please upload MP4, MPEG, MOV, AVI, WebM, or OGG format.'
      });
    }

    console.log(`📤 Uploading ${fileSizeMB}MB video (${file.originalname}) to ImgBB...`);

    // Convert to base64 for ImgBB (same as images)
    const base64Video = file.buffer.toString('base64');
    
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Video); // ImgBB accepts videos as "image"
    formData.append('name', `property_${propertyId}_video_${Date.now()}`);
    
    const startTime = Date.now();
    console.log('⏳ Sending to ImgBB...');
    
    const response = await axios.post(IMGBB_UPLOAD_URL, formData, {
      headers: formData.getHeaders(),
      timeout: 120000 // 2 minutes for 32MB
    });

    const uploadTime = Date.now() - startTime;
    const speed = fileSizeMB / (uploadTime / 1000);
    
    console.log(`✅ ImgBB response received in ${uploadTime}ms (~${speed.toFixed(2)} MB/s)`);
    
    if (!response.data.success) {
      throw new Error(`ImgBB upload failed: ${response.data.error?.message || 'Unknown error'}`);
    }

    const videoUrl = response.data.data.url;
    const thumbUrl = response.data.data.thumb?.url || videoUrl;
    
    console.log(`✅ Video uploaded: ${videoUrl}`);
    console.log(`📊 Size: ${fileSizeMB}MB, Time: ${uploadTime}ms`);

    // Save to database
    await run(
      'INSERT INTO property_media (property_id, media_type, media_url) VALUES ($1, $2, $3)',
      [propertyId, 'video', videoUrl]
    );

    console.log('💾 Video saved to database');

    res.json({
      success: true,
      message: `Video uploaded successfully! (${fileSizeMB}MB in ${uploadTime}ms)`,
      url: videoUrl,
      thumbnail: thumbUrl,
      size: file.size,
      uploadStats: {
        time: uploadTime,
        speed: `${speed.toFixed(2)} MB/s`,
        size: `${fileSizeMB} MB`
      }
    });

  } catch (error) {
    console.error('❌ Video upload error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ 
        success: false,
        error: 'Upload timeout', 
        message: 'Video upload took too long. Try a smaller video or check your connection.' 
      });
    }
    
    if (error.response) {
      console.error('ImgBB error response:', error.response.data);
      return res.status(502).json({ 
        success: false,
        error: 'ImgBB service error', 
        message: error.response.data.error?.message || 'Upload service failed' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Upload failed',
      message: error.message
    });
  }
};

// Delete media (updated for ImgBB)
const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the media record
    const media = await get('SELECT * FROM property_media WHERE id = $1', [id]);

    if (!media) {
      return res.status(404).json({ 
        success: false,
        error: 'Media not found' 
      });
    }

    // Note: ImgBB doesn't provide API to delete uploaded files
    // We can only delete from our database
    // Files on ImgBB will auto-delete after some time if not accessed
    
    console.log(`🗑️ Deleting media ${id} from database (ImgBB files cannot be deleted via API)`);

    // Delete from database
    await run('DELETE FROM property_media WHERE id = $1', [id]);

    res.json({ 
      success: true,
      message: 'Media deleted from database successfully',
      note: 'Note: Files on ImgBB cannot be deleted via API (free tier limitation)'
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete media' 
    });
  }
};

module.exports = {
  uploadImage,
  uploadVideo,
  deleteMedia
};