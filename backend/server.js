require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// ========== CORS Configuration ==========
const allowedOrigins = [
  'https://dhananjayan-realty.netlify.app',
  'https://dhananjayan-realty.onrender.com',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'http://localhost:5500'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.log('⚠️ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Database initialization
const { initDatabase } = require('./database/init');

// Routes
const contactRoutes = require('./routes/contactRoutes');
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

app.use('/api/contact', contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./database/db');
    await db.query('SELECT 1 as test');
    res.json({ 
      status: 'OK', 
      message: 'Server is running',
      database: 'Neon PostgreSQL - Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// API docs
app.get('/api', (req, res) => {
  res.json({
    message: '🏠 Real Estate Land Showcase API',
    version: '2.0.0',
    database: 'Neon PostgreSQL',
    admin: 'dhananjayan / dhananjayan@2025',
    endpoints: {
      health: 'GET /api/health',
      auth: 'POST /api/auth/login',
      properties: 'GET /api/properties',
      contact: 'POST /api/contact'
    }
  });
});

// Root
app.get('/', (req, res) => {
  res.redirect('/api');
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
    availableEndpoints: ['/api', '/api/health', '/api/properties', '/api/auth/login']
  });
});

// Start server
const PORT = process.env.PORT || 5000;

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📊 Database: Neon PostgreSQL`);
    console.log(`🔗 API: https://real-estate-showcase-backend.onrender.com`);
    console.log(`🔐 Admin: dhananjayan / dhananjayan@2025`);
  });
}).catch(err => {
  console.error('❌ Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;