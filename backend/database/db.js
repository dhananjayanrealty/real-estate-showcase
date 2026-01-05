const { Pool } = require('pg');
require('dotenv').config();

class Database {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { 
        rejectUnauthorized: false 
      } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // Test connection on startup
    this.pool.on('connect', () => {
      console.log('✅ Connected to PostgreSQL database');
    });

    this.pool.on('error', (err) => {
      console.error('❌ PostgreSQL pool error:', err);
    });
  }

  // Convert SQLite ? placeholders to PostgreSQL $1, $2, $3
  convertQuery(sql, params = []) {
    let paramIndex = 0;
    const convertedSql = sql.replace(/\?/g, () => {
      paramIndex++;
      return `$${paramIndex}`;
    });
    return { sql: convertedSql, params };
  }

  async query(sql, params = []) {
    try {
      const { sql: pgSql, params: pgParams } = this.convertQuery(sql, params);
      console.log('📊 Query:', pgSql.substring(0, 100), '...');
      const result = await this.pool.query(pgSql, pgParams);
      return result.rows;
    } catch (error) {
      console.error('❌ Database query error:', error.message);
      console.error('Query:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  async run(sql, params = []) {
    try {
      const { sql: pgSql, params: pgParams } = this.convertQuery(sql, params);
      console.log('📝 Run:', pgSql.substring(0, 100), '...');
      const result = await this.pool.query(pgSql, pgParams);
      return {
        id: result.rows[0]?.id,
        changes: result.rowCount
      };
    } catch (error) {
      console.error('❌ Database run error:', error.message);
      console.error('Query:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  async get(sql, params = []) {
    try {
      const { sql: pgSql, params: pgParams } = this.convertQuery(sql, params);
      console.log('🔍 Get:', pgSql.substring(0, 100), '...');
      const result = await this.pool.query(pgSql, pgParams);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Database get error:', error.message);
      console.error('Query:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  async close() {
    await this.pool.end();
  }
}

// Create singleton instance
const db = new Database();
module.exports = db;