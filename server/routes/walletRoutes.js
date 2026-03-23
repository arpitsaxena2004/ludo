import express from 'express';
import { getBalance, addCash, withdrawCash, getTransactions, getTransactionById } from '../controllers/walletController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/balance', protect, getBalance);
router.post('/deposit', protect, addCash);
router.post('/withdraw', protect, withdrawCash);
router.get('/transactions', protect, getTransactions);
router.get('/transaction/:id', protect, getTransactionById);

export default router;
