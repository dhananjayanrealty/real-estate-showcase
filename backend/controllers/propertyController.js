const { query, run, get } = require('../database/db');
const CloudinaryDelete = require('../utils/cloudinaryDelete');

// Get all properties (PostgreSQL version)
const getAllProperties = async (req, res) => {
  try {
    const { location, minPrice, maxPrice } = req.query;
    
    // PostgreSQL uses STRING_AGG instead of GROUP_CONCAT
    let sql = `
      SELECT p.*, 
        STRING_AGG(DISTINCT CASE WHEN pm.media_type = 'photo' THEN pm.media_url END, ',') as photos,
        STRING_AGG(DISTINCT CASE WHEN pm.media_type = 'video' THEN pm.media_url END, ',') as videos
      FROM properties p
      LEFT JOIN property_media pm ON p.id = pm.property_id
    `;
    
    const params = [];
    const conditions = [];
    
    if (location) {
      conditions.push('p.location ILIKE $' + (params.length + 1));
      params.push(`%${location}%`);
    }
    
    if (minPrice) {
      conditions.push('p.price >= $' + (params.length + 1));
      params.push(parseFloat(minPrice));
    }
    
    if (maxPrice) {
      conditions.push('p.price <= $' + (params.length + 1));
      params.push(parseFloat(maxPrice));
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' GROUP BY p.id ORDER BY p.created_at DESC';
    
    const properties = await query(sql, params);
    
    // Parse comma-separated strings into arrays
    const formattedProperties = properties.map(property => ({
      ...property,
      photos: property.photos ? property.photos.split(',').filter(url => url && url.trim() !== '') : [],
      videos: property.videos ? property.videos.split(',').filter(url => url && url.trim() !== '') : [],
      price: parseFloat(property.price)
    }));
    
    res.json(formattedProperties);
  } catch (error) {
    console.error('Error getting properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
};

// Get single property (PostgreSQL version)
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const property = await get('SELECT * FROM properties WHERE id = $1', [id]);
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    const media = await query(
      'SELECT * FROM property_media WHERE property_id = $1 ORDER BY created_at',
      [id]
    );
    
    const photos = media.filter(m => m.media_type === 'photo').map(m => m.media_url);
    const videos = media.filter(m => m.media_type === 'video').map(m => m.media_url);
    
    res.json({
      ...property,
      photos,
      videos,
      price: parseFloat(property.price)
    });
  } catch (error) {
    console.error('Error getting property:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
};

// Create property (PostgreSQL version)
const createProperty = async (req, res) => {
  try {
    const { title, description, price, location, sqft, mobile_number } = req.body;
    
    if (!title || !price || !location || !mobile_number) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await run(
      `INSERT INTO properties (title, description, price, location, sqft, mobile_number) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [title, description, parseFloat(price), location, sqft, mobile_number]
    );
    
    res.status(201).json({
      message: 'Property created successfully',
      propertyId: result.id
    });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
};

// Update property (PostgreSQL version)
const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, location, sqft, mobile_number } = req.body;
    
    // Check if property exists
    const property = await get('SELECT id FROM properties WHERE id = $1', [id]);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    await run(
      `UPDATE properties 
       SET title = $1, description = $2, price = $3, location = $4, sqft = $5, 
           mobile_number = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [title, description, parseFloat(price), location, sqft, mobile_number, id]
    );
    
    res.json({ message: 'Property updated successfully' });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
};

// Delete property (PostgreSQL version)
const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Deleting property ID: ${id}`);
    
    // Check if property exists
    const property = await get('SELECT id FROM properties WHERE id = $1', [id]);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Get all videos for this property
    const videos = await query(
      'SELECT * FROM property_media WHERE property_id = $1 AND media_type = $2',
      [id, 'video']
    );
    
    console.log(`Found ${videos.length} videos to delete from Cloudinary`);
    
    // Delete videos from Cloudinary if enabled
    let cloudinaryResults = [];
    if (process.env.ENABLE_MEDIA_CLEANUP === 'true' && videos.length > 0) {
      const cloudinaryDelete = new CloudinaryDelete();
      
      for (const video of videos) {
        const publicId = cloudinaryDelete.extractPublicId(video.media_url);
        if (publicId) {
          console.log(`Deleting Cloudinary video with public_id: ${publicId}`);
          const result = await cloudinaryDelete.deleteResource(publicId, 'video');
          cloudinaryResults.push({
            url: video.media_url,
            publicId: publicId,
            success: result.success,
            error: result.error
          });
        } else {
          console.log(`Could not extract public_id from: ${video.media_url}`);
          cloudinaryResults.push({
            url: video.media_url,
            success: false,
            error: 'Could not extract public_id'
          });
        }
      }
    }
    
    // Get all images
    const images = await query(
      'SELECT * FROM property_media WHERE property_id = $1 AND media_type = $2',
      [id, 'photo']
    );
    
    console.log(`Found ${images.length} images`);
    
    // Delete all media
    await run('DELETE FROM property_media WHERE property_id = $1', [id]);
    
    // Delete property
    await run('DELETE FROM properties WHERE id = $1', [id]);
    
    res.json({ 
      message: 'Property deleted successfully',
      details: {
        propertyId: id,
        videosDeleted: videos.length,
        imagesDeleted: images.length,
        cloudinaryResults: cloudinaryResults
      }
    });
    
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
};

// Get media rows for a property
const getPropertyMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await query(
      'SELECT id, media_type, media_url, created_at FROM property_media WHERE property_id = $1 ORDER BY created_at', 
      [id]
    );
    res.json(media);
  } catch (error) {
    console.error('Error getting property media:', error);
    res.status(500).json({ error: 'Failed to fetch property media' });
  }
};

module.exports = {
  getAllProperties,
  getPropertyById,
  getPropertyMedia,
  createProperty,
  updateProperty,
  deleteProperty
};