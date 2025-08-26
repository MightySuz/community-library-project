const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 15000,
  retryWrites: true,
  tls: true,
  // For modern Atlas deployments (optional but clearer)
  serverApi: { version: '1', strict: false, deprecationErrors: false }
})
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    if (error.reason) console.error('Reason:', JSON.stringify(error.reason, null, 2));
    console.error('Hint: Ensure your IP is whitelisted in Atlas, the URI has no leading/trailing spaces, and the cluster is in READY state.');
    process.exit(1);
  });

// Middleware
app.use(helmet());
app.use(compression());

// Dynamic CORS: allow all in development; restrict in production if ALLOWED_ORIGINS set
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // non-browser or same-origin
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn('Blocked by CORS:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
// Root route (some free hosts ping this)
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Community Library API',
    health: '/api/health',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Community Library API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes (to be implemented)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/books', require('./routes/books'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/requests', require('./routes/requests'));
// app.use('/api/publisher', require('./routes/publisher')); // Temporarily disabled
// app.use('/api/borrower', require('./routes/borrower')); // Temporarily disabled
// app.use('/api/rental', require('./routes/rental')); // Temporarily disabled
// app.use('/api/notifications', require('./routes/notifications')); // Temporarily disabled

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Community Library API server running on port ${PORT}`);
  console.log(`📚 Health check available at http://localhost:${PORT}/api/health`);
});
