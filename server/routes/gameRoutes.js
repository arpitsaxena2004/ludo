import express from 'express';
import multer from 'multer';
import path from 'path';
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
  submitGameResult
} from '../controllers/gameController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for screenshot uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/screenshots/');
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
router.get('/:roomCode', protect, getGameDetails);
router.post('/upload-screenshot', protect, upload.single('screenshot'), uploadWinScreenshot);
router.delete('/cancel/:roomCode', protect, cancelGame);
router.post('/accept/:roomCode', protect, acceptBattle);
router.post('/reject/:roomCode', protect, rejectBattle);
router.post('/set-room-code/:roomCode', protect, setGameRoomCode);
router.post('/submit-result/:roomCode', protect, submitGameResult);

export default router;
