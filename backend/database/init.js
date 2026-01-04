const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

class DatabaseInitializer {
  constructor() {
    this.dbPath = path.join(__dirname, 'real_estate.db');
    this.db = null;
  }
  
  async initialize() {
    try {
      // Check if database exists
      const dbExists = fs.existsSync(this.dbPath);
      
      // Create or open database
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          throw err;
        }
        console.log(`Connected to SQLite database: ${this.dbPath}`);
      });
      
      // Enable foreign keys
      await this.runQuery('PRAGMA foreign_keys = ON');
      
      // Create tables
      await this.createTables();
      
      console.log('✅ Database tables created successfully!');
      
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    } finally {
      if (this.db) {
        this.db.close();
      }
    }
  }
  
  runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }
  
  async createTables() {
    const tables = [
      // Admins table
      `CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Properties table
      `CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        location TEXT NOT NULL,
        sqft TEXT,
        mobile_number TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Property media table
      `CREATE TABLE IF NOT EXISTS property_media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER NOT NULL,
        media_type TEXT CHECK(media_type IN ('photo','video')) NOT NULL,
        media_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
      )`,
      
      // Contact messages table (for contact form)
      `CREATE TABLE IF NOT EXISTS contact_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];
    
    // Create triggers for updated_at
    const triggers = [
      // Update trigger for properties
      `CREATE TRIGGER IF NOT EXISTS update_properties_timestamp 
       AFTER UPDATE ON properties
       BEGIN
         UPDATE properties SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
       END`,
      
      // Update trigger for admins
      `CREATE TRIGGER IF NOT EXISTS update_admins_timestamp 
       AFTER UPDATE ON admins
       BEGIN
         UPDATE admins SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
       END`
    ];
    
    // Create indexes
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location)`,
      `CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price)`,
      `CREATE INDEX IF NOT EXISTS idx_property_media_property_id ON property_media(property_id)`,
      `CREATE INDEX IF NOT EXISTS idx_property_media_type ON property_media(media_type)`
    ];
    
    console.log('Creating tables...');
    for (const tableSql of tables) {
      await this.runQuery(tableSql);
    }
    
    console.log('Creating triggers...');
    for (const triggerSql of triggers) {
      await this.runQuery(triggerSql);
    }
    
    console.log('Creating indexes...');
    for (const indexSql of indexes) {
      await this.runQuery(indexSql);
    }
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  const initializer = new DatabaseInitializer();
  initializer.initialize()
    .then(() => {
      console.log('✅ Database setup completed!');
      console.log('\n⚠️  Note: No admin user created automatically.');
      console.log('   Create admin manually using:');
      console.log('   node create-admin.js');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = DatabaseInitializer;