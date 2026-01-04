const axios = require('axios');
const FormData = require('form-data');
const { query } = require('../database/db');

class MediaCleanup {
  constructor() {
    this.cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
    this.cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
    this.cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;
  }
  
  // Get all orphaned media (media without properties)
  async getOrphanedMedia() {
    try {
      const orphanedMedia = await query(`
        SELECT pm.* 
        FROM property_media pm
        LEFT JOIN properties p ON pm.property_id = p.id
        WHERE p.id IS NULL
      `);
      
      return orphanedMedia;
    } catch (error) {
      console.error('Error getting orphaned media:', error);
      return [];
    }
  }
  
  // Delete media from Cloudinary
  async deleteFromCloudinary(publicId) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Generate signature
      const crypto = require('crypto');
      const signatureString = `public_id=${publicId}&timestamp=${timestamp}${this.cloudinaryApiSecret}`;
      const signature = crypto.createHash('sha1').update(signatureString).digest('hex');
      
      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('api_key', this.cloudinaryApiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${this.cloudinaryCloudName}/destroy`,
        formData,
        { headers: formData.getHeaders() }
      );
      
      console.log(`✅ Deleted from Cloudinary: ${publicId}`);
      return { success: true, data: response.data };
      
    } catch (error) {
      console.error(`❌ Failed to delete ${publicId}:`, error.message);
      return { success: false, error: error.message };
    }
  }
  
  // Extract public_id from Cloudinary URL
  extractPublicId(url) {
    try {
      // Example: https://res.cloudinary.com/demo/video/upload/v1234567/property_1_video_1234567890.mp4
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      return filename.split('.')[0]; // Remove extension
    } catch (error) {
      console.error('Error extracting public_id:', error);
      return null;
    }
  }
  
  // Cleanup orphaned media
  async cleanupOrphanedMedia() {
    console.log('🧹 Starting orphaned media cleanup...');
    
    const orphanedMedia = await this.getOrphanedMedia();
    console.log(`Found ${orphanedMedia.length} orphaned media items`);
    
    let deletedCount = 0;
    let failedCount = 0;
    
    for (const media of orphanedMedia) {
      if (media.media_type === 'video' && media.media_url.includes('cloudinary.com')) {
        const publicId = this.extractPublicId(media.media_url);
        if (publicId) {
          const result = await this.deleteFromCloudinary(publicId);
          if (result.success) {
            deletedCount++;
            // Delete from database
            await query('DELETE FROM property_media WHERE id = ?', [media.id]);
          } else {
            failedCount++;
          }
        }
      }
      
      // ImgBB images - cannot delete via API
      if (media.media_type === 'photo') {
        console.log(`📷 ImgBB image cannot be deleted via API: ${media.media_url}`);
        // Still delete from database
        await query('DELETE FROM property_media WHERE id = ?', [media.id]);
        deletedCount++;
      }
    }
    
    console.log(`✅ Cleanup complete: ${deletedCount} deleted, ${failedCount} failed`);
    
    return { deletedCount, failedCount };
  }
}

module.exports = MediaCleanup;