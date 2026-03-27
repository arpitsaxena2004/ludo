import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import {
  getPaymentSettings,
  updatePaymentSettings,
  uploadQRCode,
  createDepositRequest,
  getUserDepositRequests,
  handlePaymentWebhook,
  checkDepositStatus,
  testPaymentGateway,
  createWithdrawalRequest,
  getUserWithdrawalRequests,
  getAllDepositRequests,
  getAllWithdrawalRequests,
  approveDepositRequest,
  rejectDepositRequest,
  approveWithdrawalRequest,
  rejectWithdrawalRequest
} from '../controllers/paymentController.js';
import { protect, adminProtect } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'payments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Public routes
router.get('/settings', getPaymentSettings);
router.post('/webhook', handlePaymentWebhook); // Payment gateway webhook
router.get('/test-gateway', testPaymentGateway); // Test endpoint (remove in production)

// User routes
router.post('/deposit', protect, createDepositRequest); // No file upload needed now
router.get('/deposit/history', protect, getUserDepositRequests);
router.get('/deposit/status/:orderId', protect, checkDepositStatus);
router.post('/withdrawal', protect, createWithdrawalRequest);
router.get('/withdrawal/history', protect, getUserWithdrawalRequests);

// Admin routes
router.put('/settings', adminProtect, updatePaymentSettings);
router.post('/qr-code', adminProtect, upload.single('qrCode'), uploadQRCode);
router.get('/admin/deposits', adminProtect, getAllDepositRequests);
router.get('/admin/withdrawals', adminProtect, getAllWithdrawalRequests);
router.put('/admin/deposit/:id/approve', adminProtect, approveDepositRequest);
router.put('/admin/deposit/:id/reject', adminProtect, rejectDepositRequest);
router.put('/admin/withdrawal/:id/approve', adminProtect, upload.single('paymentProof'), approveWithdrawalRequest);
router.put('/admin/withdrawal/:id/reject', adminProtect, rejectWithdrawalRequest);

export default router;
