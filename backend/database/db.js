const { Pool } = require('pg');
require('dotenv').config();

class Database {
  constructor() {
    // Neon requires sslmode=require in connection string
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error('❌ DATABASE_URL is not set');
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    this.pool = new Pool({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false,
        require: true
      },
      connectionTimeoutMillis: 10000, // 10 seconds
      idleTimeoutMillis: 30000,
      max: 5, // Neon free tier allows 5 connections
    });
    
    console.log('📊 PostgreSQL pool created for Neon.tech');
    
    // Test connection
    this.pool.on('connect', () => {
      console.log('✅ Connected to Neon PostgreSQL');
    });
    
    this.pool.on('error', (err) => {
      console.error('❌ PostgreSQL pool error:', err);
    });
  }

  // Convert SQLite ? placeholders to PostgreSQL $1, $2
  convertQuery(sql, params = []) {
    let paramIndex = 0;
    const convertedSql = sql.replace(/\?/g, () => {
      paramIndex++;
      return `$${paramIndex}`;
    });
    return { sql: convertedSql, params };
  }

  async query(sql, params = []) {
    const start = Date.now();
    try {
      const { sql: pgSql, params: pgParams } = this.convertQuery(sql, params);
      
      const result = await this.pool.query(pgSql, pgParams);
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        console.log(`⚠️ Slow query (${duration}ms): ${pgSql.substring(0, 50)}...`);
      }
      
      return result.rows;
    } catch (error) {
      console.error(`❌ Query error (${Date.now() - start}ms):`, error.message);
      console.error('Query:', sql.substring(0, 100));
      throw error;
    }
  }

  async run(sql, params = []) {
    try {
      const { sql: pgSql, params: pgParams } = this.convertQuery(sql, params);
      const result = await this.pool.query(pgSql, pgParams);
      return {
        id: result.rows[0]?.id,
        changes: result.rowCount
      };
    } catch (error) {
      console.error('❌ Run error:', error.message);
      throw error;
    }
  }

  async get(sql, params = []) {
    try {
      const { sql: pgSql, params: pgParams } = this.convertQuery(sql, params);
      const result = await this.pool.query(pgSql, pgParams);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Get error:', error.message);
      throw error;
    }
  }
}

const db = new Database();
module.exports = db;