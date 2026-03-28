import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import {
  getAvailableGames,
  createGame,
  joinGame,
  getGameDetails,
  uploadWinScreenshot,
  getMyGames,
  cancelGame,
  acceptBattle,
  rejectBattle,
  setGameRoomCode,
  submitGameResult,
  requestCancellation,
  respondToCancellation
} from '../controllers/gameController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'screenshots');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for screenshot uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'win-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Game routes
router.get('/available', protect, getAvailableGames);
router.post('/create', protect, createGame);
router.post('/join/:roomCode', protect, joinGame);
router.get('/my-games', protect, getMyGames);
router.post('/upload-screenshot', protect, upload.single('screenshot'), uploadWinScreenshot);
router.delete('/cancel/:roomCode', protect, cancelGame);
router.post('/request-cancel/:roomCode', protect, requestCancellation);
router.post('/respond-cancel/:roomCode', protect, respondToCancellation);
router.post('/accept/:roomCode', protect, acceptBattle);
router.post('/reject/:roomCode', protect, rejectBattle);
router.post('/set-room-code/:roomCode', protect, setGameRoomCode);
router.post('/submit-result/:roomCode', protect, submitGameResult);
router.get('/:roomCode', protect, getGameDetails);

export default router;
