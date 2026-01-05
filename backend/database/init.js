const db = require('./db');
const bcrypt = require('bcryptjs');

const initDatabase = async () => {
  try {
    console.log('🔄 Initializing Neon PostgreSQL database...');
    
    // Test connection first
    await db.query('SELECT 1 as test');
    console.log('✅ Connection test successful');
    
    // Create tables with shorter SQL
    const tables = [
      // Admins table
      `CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Properties table
      `CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price BIGINT NOT NULL,
        location VARCHAR(255) NOT NULL,
        sqft VARCHAR(50),
        mobile_number VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Property media table
      `CREATE TABLE IF NOT EXISTS property_media (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL,
        media_type VARCHAR(10) NOT NULL,
        media_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
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
    
    // Create tables one by one
    for (const tableSql of tables) {
      await db.query(tableSql);
    }
    console.log('✅ All tables created');
    
    // Check/create admin user
    const adminExists = await db.get(
      'SELECT id FROM admins WHERE username = $1', 
      ['dhananjayan']
    );
    
    if (!adminExists) {
      console.log('👑 Creating admin user...');
      const hashedPassword = await bcrypt.hash('dhananjayan@2025', 10);
      await db.run(
        'INSERT INTO admins (username, password) VALUES ($1, $2)',
        ['dhananjayan', hashedPassword]
      );
      console.log('✅ Admin created: dhananjayan / dhananjayan@2025');
    } else {
      console.log('✅ Admin already exists');
    }
    
    console.log('🎉 Neon database initialization complete!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

module.exports = { initDatabase };