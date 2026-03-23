import express from 'express';
import { getReferralInfo, getReferredUsers } from '../controllers/referralController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/info', protect, getReferralInfo);
router.get('/users', protect, getReferredUsers);

export default router;
