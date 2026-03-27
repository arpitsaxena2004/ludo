import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
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
import { autoExpireWaitingGames } from './jobs/autoExpireGames.js';
import { startPaymentCheckJob } from './jobs/checkPendingPayments.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Ensure upload directories exist
const screenshotDir = join(__dirname, 'uploads', 'screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// Parse allowed origins from environment variables
const getAllowedOrigins = () => {
  const origins = [];
  
  if (process.env.CLIENT_URL) {
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

// Start background job: auto-expire waiting games with no opponent after 1 minute
// Runs every 30 seconds so games expire within 60–90 seconds of creation
setInterval(autoExpireWaitingGames, 30 * 1000);
// Also run immediately on startup
setTimeout(autoExpireWaitingGames, 5000);

// Start background job: check pending payments
// Runs every 2 minutes to check payment status and auto-reject after 6 minutes
startPaymentCheckJob();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: function (origin, callback) {
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

// Serve static uploaded files with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(join(__dirname, 'uploads')));

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

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Allowed CORS origins:`, allowedOrigins);
});

export default app;
