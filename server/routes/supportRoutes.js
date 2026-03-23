import express from 'express';
import { createTicket, getMyTickets, getTicketById, addMessage } from '../controllers/supportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/ticket', protect, createTicket);
router.get('/tickets', protect, getMyTickets);
router.get('/ticket/:id', protect, getTicketById);
router.post('/ticket/:id/message', protect, addMessage);

export default router;
