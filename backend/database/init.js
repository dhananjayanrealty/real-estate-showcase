const db = require('./db');
const bcrypt = require('bcryptjs');

const initDatabase = async () => {
  try {
    console.log('🔄 Initializing PostgreSQL database...');

    // Create tables with PostgreSQL syntax
    const sql = `
      -- Admins table
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Properties table
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
      );

      -- Property media table
      CREATE TABLE IF NOT EXISTS property_media (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        media_type VARCHAR(10) CHECK (media_type IN ('photo', 'video')) NOT NULL,
        media_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Contact messages table
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await db.query(sql);
    console.log('✅ Tables created successfully!');

    // Create indexes
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
    console.log('✅ Indexes created successfully!');

    // Check if admin exists, if not create default admin
    const adminExists = await db.get('SELECT id FROM admins WHERE username = $1', ['dhananjayan']);
    
    if (!adminExists) {
      console.log('👑 Creating default admin user...');
      const hashedPassword = await bcrypt.hash('dhananjayan@2025', 10);
      await db.run(
        'INSERT INTO admins (username, password) VALUES ($1, $2)',
        ['dhananjayan', hashedPassword]
      );
      console.log('✅ Default admin created: dhananjayan / dhananjayan@2025');
    } else {
      console.log('✅ Admin user already exists');
    }

    console.log('✅ PostgreSQL database initialization completed!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Add update trigger function
const addUpdateTrigger = async () => {
  try {
    // Function to update timestamp
    await db.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers for properties
    await db.query(`
      DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
      CREATE TRIGGER update_properties_updated_at
      BEFORE UPDATE ON properties
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create triggers for admins
    await db.query(`
      DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
      CREATE TRIGGER update_admins_updated_at
      BEFORE UPDATE ON admins
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Update triggers created successfully!');
  } catch (error) {
    console.error('⚠️ Could not create triggers:', error.message);
    // Continue without triggers
  }
};

// Run initialization if this file is executed directly
if (require.main === module) {
  initDatabase()
    .then(() => addUpdateTrigger())
    .then(() => {
      console.log('✅ Database setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase, addUpdateTrigger };