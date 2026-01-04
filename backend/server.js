require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const contactRoutes = require('./routes/contactRoutes');
// Middleware - consolidate CORS using ALLOWED_ORIGINS env var
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/contact', contactRoutes);
// Database initialization
const db = require('./database/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: '🏠 Real Estate Land Showcase API',
    version: '1.0.0',
    documentation: 'Available endpoints:',
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
      health: 'GET /api/health'
    },
    database: {
      type: 'SQLite',
      status: 'Connected',
      path: './database/real_estate.db'
    },
    quickStart: {
      testProperty: 'GET /api/properties/1',
      testHealth: 'GET /api/health',
      adminLogin: 'POST /api/auth/login with {"username":"admin","password":"admin123"}'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.redirect('/api');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
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
    availableEndpoints: ['/api', '/api/health', '/api/properties', '/api/auth/login']
  });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
db.initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔗 API Documentation: http://localhost:${PORT}/api`);
    console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
    console.log(`🏠 Properties: http://localhost:${PORT}/api/properties`);
  });
}).catch(err => {
  console.error('❌ Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;