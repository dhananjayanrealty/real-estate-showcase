const path = require('path');
const fs = require('fs');

// Database configuration
const DB_CONFIG = {
  // SQLite database path
  database: process.env.DB_PATH || path.join(__dirname, '../database/real_estate.db'),
  
  // Connection settings
  connection: {
    filename: process.env.DB_PATH || path.join(__dirname, '../database/real_estate.db')
  },
  
  // SQLite settings
  useNullAsDefault: true,
  
  // Migration settings
  migrations: {
    directory: path.join(__dirname, '../database/migrations'),
    tableName: 'knex_migrations'
  },
  
  // Seed settings
  seeds: {
    directory: path.join(__dirname, '../database/seeds')
  },
  
  // Pool settings
  pool: {
    min: 1,
    max: 10,
    afterCreate: (conn, cb) => {
      // Enable foreign keys
      conn.run('PRAGMA foreign_keys = ON', cb);
    }
  }
};

// Ensure database directory exists
const ensureDatabaseDirectory = () => {
  const dbDir = path.dirname(DB_CONFIG.database);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`Created database directory: ${dbDir}`);
  }
};

// Check if database file exists
const databaseExists = () => {
  return fs.existsSync(DB_CONFIG.database);
};

// Initialize database file
const initializeDatabaseFile = () => {
  if (!databaseExists()) {
    ensureDatabaseDirectory();
    
    // Create an empty database file
    const db = require('sqlite3').verbose().Database;
    new db(DB_CONFIG.database);
    
    console.log(`Created new database file: ${DB_CONFIG.database}`);
    return true;
  }
  return false;
};

module.exports = {
  DB_CONFIG,
  ensureDatabaseDirectory,
  databaseExists,
  initializeDatabaseFile
};