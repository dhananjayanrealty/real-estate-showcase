const db = require('./db');
const bcrypt = require('bcryptjs');

const initDatabase = async () => {
  try {
    console.log('🔄 Initializing Neon PostgreSQL database...');
    
    // Simple test query
    await db.query('SELECT 1 as test');
    console.log('✅ Connection test successful');
    
    // Create tables one by one
    const tables = [
      // Admins table
      `CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Properties table (simplified)
      `CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price BIGINT NOT NULL,
        location VARCHAR(255) NOT NULL,
        sqft VARCHAR(50),
        mobile_number VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Property media table
      `CREATE TABLE IF NOT EXISTS property_media (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL,
        media_type VARCHAR(10) NOT NULL,
        media_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Contact messages table
      `CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];
    
    for (const tableSql of tables) {
      await db.query(tableSql);
    }
    console.log('✅ All tables created');
    
    // Create admin user
    try {
      const hashedPassword = await bcrypt.hash('dhananjayan@2025', 10);
      await db.run(
        'INSERT INTO admins (username, password) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING',
        ['dhananjayan', hashedPassword]
      );
      console.log('✅ Admin user ready: dhananjayan / dhananjayan@2025');
    } catch (adminError) {
      console.log('⚠️ Admin may already exist');
    }
    
    console.log('🎉 Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    // Don't crash the server - maybe database is still starting
    console.log('⚠️ Continuing without database initialization...');
  }
};

module.exports = { initDatabase };