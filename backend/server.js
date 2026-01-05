require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ========== CORS Configuration ==========
const allowedOrigins = [
  'https://dhananjayan-realty.netlify.app',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'http://localhost:5500'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
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
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Database initialization
const db = require('./database/db');
const { initDatabase, addUpdateTrigger } = require('./database/init');

// Routes
const contactRoutes = require('./routes/contactRoutes');
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

app.use('/api/contact', contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/upload', uploadRoutes);

// ========== Health & Test Endpoints ==========
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await db.query('SELECT 1 as test');
    res.json({ 
      status: 'OK', 
      message: 'Server is running',
      database: 'PostgreSQL - Connected',
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

// Test CORS endpoint
app.get('/api/test-cors', (req, res) => {
  res.json({
    message: 'CORS is working!',
    origin: req.headers.origin || 'No origin header',
    timestamp: new Date().toISOString()
  });
});

// API Documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: '🏠 Real Estate Land Showcase API',
    version: '2.0.0',
    database: 'PostgreSQL',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        check: 'GET /api/auth/check'
      },
      properties: {
        getAll: 'GET /api/properties',
        getSingle: 'GET /api/properties/:id',
        create: 'POST /api/properties',
        update: 'PUT /api/properties/:id',
        delete: 'DELETE /api/properties/:id'
      },
      upload: {
        image: 'POST /api/upload/image',
        video: 'POST /api/upload/video',
        deleteMedia: 'DELETE /api/upload/media/:id'
      },
      contact: {
        submit: 'POST /api/contact',
        getAll: 'GET /api/contact',
        getOne: 'GET /api/contact/:id',
        delete: 'DELETE /api/contact/:id'
      },
      health: 'GET /api/health',
      test: 'GET /api/test-cors'
    },
    adminCredentials: {
      username: 'dhananjayan',
      password: 'dhananjayan@2025'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.redirect('/api');
});

// ========== Error Handling ==========
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  
  // CORS error
  if (err.message.includes('CORS')) {
    return res.status(403).json({ 
      error: 'CORS Error', 
      message: 'Origin not allowed',
      allowedOrigins: allowedOrigins.filter(o => o !== '*')
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
    availableEndpoints: ['/api', '/api/health', '/api/properties', '/api/auth/login', '/api/test-cors']
  });
});

// ========== Server Startup ==========
const PORT = process.env.PORT || 5000;

// Update the database initialization part
const startServer = async () => {
  try {
    console.log('🚀 Starting server with PostgreSQL...');
    console.log('📊 Database URL:', process.env.DATABASE_URL ? 'Configured' : 'Not configured');
    
    // Initialize database with timeout
    console.log('🔄 Initializing database (timeout: 30s)...');
    await Promise.race([
      initDatabase(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database initialization timeout')), 30000)
      )
    ]);
    
    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🔗 API: https://real-estate-showcase-backend.onrender.com`);
      console.log(`🔐 Admin: dhananjayan / dhananjayan@2025`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    
    // If database fails, try to start server anyway (for debugging)
    if (error.message.includes('database') || error.message.includes('timeout')) {
      console.log('⚠️ Starting server in degraded mode (database may not work)');
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`⚠️ Server running (database issue) on port ${PORT}`);
      });
    } else {
      process.exit(1);
    }
  }
};
startServer();

module.exports = app;