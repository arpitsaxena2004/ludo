import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import kycRoutes from './routes/kycRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import configRoutes from './routes/configRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getPublicPolicy } from './controllers/adminController.js';
import { initializeDefaultConfigs } from './controllers/configController.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Parse allowed origins from environment variables
const getAllowedOrigins = () => {
  const origins = [];
  
  if (process.env.CLIENT_URL) {
    // Split by comma and trim whitespace
    const clientUrls = process.env.CLIENT_URL.split(',').map(url => url.trim());
    origins.push(...clientUrls);
  }
  
  if (process.env.ADMIN_URL) {
    const adminUrls = process.env.ADMIN_URL.split(',').map(url => url.trim());
    origins.push(...adminUrls);
  }
  
  return origins;
};

const allowedOrigins = getAllowedOrigins();

// Connect to MongoDB
connectDB();

// Initialize default configurations
initializeDefaultConfigs();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/config', configRoutes);
app.use('/api/game', gameRoutes);

// Public policy route
app.get('/api/policies/:policyKey', getPublicPolicy);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Allowed CORS origins:`, allowedOrigins);
});

export default app;
