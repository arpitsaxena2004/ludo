import express from 'express';
import {
  getConfig,
  getPublicConfig,
  updateConfig,
  deleteConfig
} from '../controllers/configController.js';
import { adminProtect } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/public/:key?', getPublicConfig);

// Admin routes
router.get('/:key?', adminProtect, getConfig);
router.put('/', adminProtect, updateConfig);
router.delete('/:key', adminProtect, deleteConfig);

export default router;
