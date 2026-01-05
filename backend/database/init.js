const db = require('./db');
const bcrypt = require('bcryptjs');

const initDatabase = async () => {
  try {
    console.log('🔄 Initializing PostgreSQL database...');

    // Test connection first
    console.log('🔌 Testing database connection...');
    await db.query('SELECT 1 as test');
    console.log('✅ Database connection successful');

    // Create tables one by one (not all in one query)
    console.log('📝 Creating tables...');
    
    // 1. Admins table
    await db.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Admins table created');

    // 2. Properties table
    await db.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(12, 2) NOT NULL,
        location VARCHAR(255) NOT NULL,
        sqft VARCHAR(50),
        mobile_number VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Properties table created');

    // 3. Property media table
    await db.query(`
      CREATE TABLE IF NOT EXISTS property_media (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        media_type VARCHAR(10) CHECK (media_type IN ('photo', 'video')) NOT NULL,
        media_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Property media table created');

    // 4. Contact messages table
    await db.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Contact messages table created');

    // Create indexes one by one
    console.log('📊 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location)',
      'CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price)',
      'CREATE INDEX IF NOT EXISTS idx_property_media_property_id ON property_media(property_id)',
      'CREATE INDEX IF NOT EXISTS idx_property_media_type ON property_media(media_type)',
      'CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC)'
    ];

    for (const indexSql of indexes) {
      await db.query(indexSql);
    }
    console.log('✅ Indexes created');

    // Check if admin exists
    console.log('👑 Checking admin user...');
    const adminExists = await db.get('SELECT id FROM admins WHERE username = $1', ['dhananjayan']);
    
    if (!adminExists) {
      console.log('Creating default admin user...');
      const hashedPassword = await bcrypt.hash('dhananjayan@2025', 10);
      await db.run(
        'INSERT INTO admins (username, password) VALUES ($1, $2)',
        ['dhananjayan', hashedPassword]
      );
      console.log('✅ Default admin created: dhananjayan / dhananjayan@2025');
    } else {
      console.log('✅ Admin user already exists');
    }

    console.log('🎉 PostgreSQL database initialization completed!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

module.exports = { initDatabase };