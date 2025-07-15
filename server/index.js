const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['OPENAI_API_KEY', 'PINECONE_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  console.error('\n🔧 Please check your server/.env file and add the missing variables.');
  console.error('📋 You can copy server/env.example to server/.env as a template.');
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');

const { initializePinecone } = require('./services/pineconeService');
const documentRoutes = require('./controllers/documentController');
const chatRoutes = require('./controllers/chatController');

const app = express();
const PORT = process.env.PORT || 5001;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Root endpoint - API information
app.get('/', (req, res) => {
  res.json({
    message: 'RAG Starter Kit API Server',
    status: 'Running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      documents: {
        upload: 'POST /api/documents/upload',
        list: 'GET /api/documents/list',
        delete: 'DELETE /api/documents/:documentId',
        stats: 'GET /api/documents/stats'
      },
      chat: {
        send: 'POST /api/chat/send',
        history: 'GET /api/chat/history/:conversationId',
        conversation: 'POST /api/chat/conversation',
        deleteConversation: 'DELETE /api/chat/conversation/:conversationId',
        conversations: 'GET /api/chat/conversations',
        search: 'POST /api/chat/search'
      }
    },
    documentation: 'See README.md for detailed API usage'
  });
});

// API information endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'RAG Starter Kit API',
    status: 'Running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      documents: {
        upload: 'POST /api/documents/upload',
        list: 'GET /api/documents/list',
        stats: 'GET /api/documents/stats'
      },
      chat: {
        send: 'POST /api/chat/send',
        conversation: 'POST /api/chat/conversation',
        conversations: 'GET /api/chat/conversations'
      }
    }
  });
});

// API routes
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler with helpful information
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `The route ${req.originalUrl} does not exist`,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'GET /api/documents/list',
      'POST /api/documents/upload',
      'GET /api/documents/stats',
      'POST /api/chat/send',
      'POST /api/chat/conversation',
      'GET /api/chat/conversations'
    ],
    timestamp: new Date().toISOString()
  });
});

// Initialize Pinecone and start server
async function startServer() {
  try {
    await initializePinecone();
    console.log('✅ Pinecone initialized successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 API available at: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize Pinecone:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app; 