import express from 'express';
import { submitKYC, getKYCStatus } from '../controllers/kycController.js';
import { protect } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/submit', protect, upload.fields([
  { name: 'documentFront', maxCount: 1 },
  { name: 'documentBack', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), submitKYC);
router.get('/status', protect, getKYCStatus);

export default router;
