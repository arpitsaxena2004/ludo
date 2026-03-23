import express from 'express';
import multer from 'multer';
import {
  getPaymentSettings,
  updatePaymentSettings,
  uploadQRCode,
  createDepositRequest,
  getUserDepositRequests,
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

// Configure multer for file uploads
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
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

// User routes
router.post('/deposit', protect, upload.single('screenshot'), createDepositRequest);
router.get('/deposit/history', protect, getUserDepositRequests);
router.post('/withdrawal', protect, createWithdrawalRequest);
router.get('/withdrawal/history', protect, getUserWithdrawalRequests);

// Admin routes
router.put('/settings', adminProtect, updatePaymentSettings);
router.post('/qr-code', adminProtect, upload.single('qrCode'), uploadQRCode);
router.get('/admin/deposits', adminProtect, getAllDepositRequests);
router.get('/admin/withdrawals', adminProtect, getAllWithdrawalRequests);
router.put('/admin/deposit/:id/approve', adminProtect, approveDepositRequest);
router.put('/admin/deposit/:id/reject', adminProtect, rejectDepositRequest);
router.put('/admin/withdrawal/:id/approve', adminProtect, approveWithdrawalRequest);
router.put('/admin/withdrawal/:id/reject', adminProtect, rejectWithdrawalRequest);

export default router;
