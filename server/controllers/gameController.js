import Game from '../models/Game.js';
import User from '../models/User.js';
import AppConfig from '../models/AppConfig.js';

// @desc    Get available games
// @route   GET /api/game/available
// @access  Private
export const getAvailableGames = async (req, res) => {
  try {
    const games = await Game.find({
      status: { $in: ['waiting', 'accepted', 'in_progress'] }
    })
      .populate('players.user', 'username phoneNumber avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      games
    });
  } catch (error) {
    console.error('Get Available Games Error:', error);
    res.status(500).json({ message: 'Failed to fetch games', error: error.message });
  }
};

// @desc    Create new game
// @route   POST /api/game/create
// @access  Private
export const createGame = async (req, res) => {
  try {
    const { entryFee } = req.body;

    if (!entryFee) {
      return res.status(400).json({ message: 'Entry fee is required' });
    }

    if (entryFee < 10) {
      return res.status(400).json({ message: 'Minimum entry fee is ₹10' });
    }

    const user = await User.findById(req.user._id);
    const totalBalance = user.depositCash + user.winningCash + user.bonusCash;

    if (totalBalance < entryFee) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Generate unique room code
    let roomCode;
    let existingGame;
    do {
      roomCode = 'GAME' + Math.random().toString(36).substring(2, 8).toUpperCase();
      existingGame = await Game.findOne({ roomCode });
    } while (existingGame);

    // Get commission rate
    const commissionConfig = await AppConfig.findOne({ key: 'commissionRate' });
    const commissionRate = commissionConfig ? commissionConfig.value : 5;

    // Calculate prize pool
    const prizePool = (entryFee * 2 * (100 - commissionRate)) / 100;

    // Deduct entry fee from user balance (creator pays immediately)
    const deducted = await user.deductGameEntry(entryFee);
    if (!deducted) {
      return res.status(400).json({ message: 'Failed to deduct entry fee' });
    }

    // Create game
    const game = await Game.create({
      roomCode,
      entryFee,
      prizePool,
      commissionRate,
      players: [{
        user: user._id,
        joinedAt: new Date()
      }]
    });

    // Create transaction record
    const Transaction = (await import('../models/Transaction.js')).default;
    await Transaction.create({
      user: user._id,
      type: 'game_entry',
      amount: entryFee,
      status: 'completed',
      description: `Game entry fee for room ${roomCode}`,
      metadata: {
        gameId: game._id,
        roomCode
      }
    });

    const populatedGame = await Game.findById(game._id)
      .populate('players.user', 'username phoneNumber avatar');

    res.status(201).json({
      success: true,
      message: 'Game created successfully',
      game: populatedGame
    });
  } catch (error) {
    console.error('Create Game Error:', error);
    res.status(500).json({ message: 'Failed to create game', error: error.message });
  }
};

// @desc    Join game
// @route   POST /api/game/join/:roomCode
// @access  Private
export const joinGame = async (req, res) => {
  try {
    const { roomCode } = req.params;

    const game = await Game.findOne({ roomCode: roomCode.toUpperCase() });
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({ message: 'Game is not accepting players' });
    }

    if (game.currentPlayers >= game.maxPlayers) {
      return res.status(400).json({ message: 'Game is full' });
    }

    // Check if user already joined
    const alreadyJoined = game.players.some(p => p.user.toString() === req.user._id.toString());
    if (alreadyJoined) {
      return res.status(400).json({ message: 'You have already joined this game' });
    }

    const user = await User.findById(req.user._id);
    const totalBalance = user.depositCash + user.winningCash + user.bonusCash;

    if (totalBalance < game.entryFee) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Deduct entry fee
    const deducted = await user.deductGameEntry(game.entryFee);
    if (!deducted) {
      return res.status(400).json({ message: 'Failed to deduct entry fee' });
    }

    // Add player to game
    game.players.push({
      user: user._id,
      joinedAt: new Date()
    });
    game.currentPlayers += 1;

    // Game stays in 'waiting' status until creator accepts
    // Don't change to in_progress here

    await game.save();

    // Create transaction record
    const Transaction = (await import('../models/Transaction.js')).default;
    await Transaction.create({
      user: user._id,
      type: 'game_entry',
      amount: game.entryFee,
      status: 'completed',
      description: `Game entry fee for room ${roomCode.toUpperCase()}`,
      metadata: {
        gameId: game._id,
        roomCode: roomCode.toUpperCase()
      }
    });

    const populatedGame = await Game.findById(game._id)
      .populate('players.user', 'username phoneNumber avatar');

    res.status(200).json({
      success: true,
      message: 'Joined game successfully',
      game: populatedGame
    });
  } catch (error) {
    console.error('Join Game Error:', error);
    res.status(500).json({ message: 'Failed to join game', error: error.message });
  }
};

// @desc    Get game details
// @route   GET /api/game/:roomCode
// @access  Private
export const getGameDetails = async (req, res) => {
  try {
    const { roomCode } = req.params;

    const game = await Game.findOne({ roomCode: roomCode.toUpperCase() })
      .populate('players.user', 'username phoneNumber avatar')
      .populate('winner', 'username phoneNumber avatar');

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.status(200).json({
      success: true,
      game
    });
  } catch (error) {
    console.error('Get Game Details Error:', error);
    res.status(500).json({ message: 'Failed to fetch game details', error: error.message });
  }
};

// @desc    Upload win screenshot
// @route   POST /api/game/upload-screenshot
// @access  Private
export const uploadWinScreenshot = async (req, res) => {
  try {
    const { roomCode } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No screenshot uploaded' });
    }

    const game = await Game.findOne({ roomCode: roomCode.toUpperCase() });
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    if (game.status !== 'in_progress') {
      return res.status(400).json({ message: 'Game is not in progress' });
    }

    // Find player in game
    const playerIndex = game.players.findIndex(p => p.user.toString() === req.user._id.toString());
    if (playerIndex === -1) {
      return res.status(403).json({ message: 'You are not a player in this game' });
    }

    if (game.players[playerIndex].winScreenshot) {
      return res.status(400).json({ message: 'You have already uploaded a screenshot' });
    }

    let screenshotUrl;

    // Check if Cloudinary is configured
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      // Upload to Cloudinary
      const cloudinary = (await import('../config/cloudinary.js')).default;
      const fs = (await import('fs')).default;

      try {
        console.log('Uploading screenshot to Cloudinary...');
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'a2z-ludo/game-screenshots',
          public_id: `game_${roomCode}_${req.user._id}_${Date.now()}`,
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ],
          resource_type: 'image'
        });

        console.log('Upload successful:', result.secure_url);
        screenshotUrl = result.secure_url;

        // Delete temp file
        fs.unlink(req.file.path, (err) => {
          if (err) console.log('Failed to delete temp file:', err.message);
        });
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError);
        // Fallback to local storage
        screenshotUrl = `/uploads/screenshots/${req.file.filename}`;
      }
    } else {
      console.log('Cloudinary not configured, using local storage');
      screenshotUrl = `/uploads/screenshots/${req.file.filename}`;
    }

    // Store screenshot URL
    game.players[playerIndex].winScreenshot = screenshotUrl;
    game.players[playerIndex].uploadedAt = new Date();

    await game.save();

    const populatedGame = await Game.findById(game._id)
      .populate('players.user', 'username phoneNumber avatar')
      .populate('winner', 'username phoneNumber avatar');

    res.status(200).json({
      success: true,
      message: 'Screenshot uploaded successfully',
      game: populatedGame
    });
  } catch (error) {
    console.error('Upload Screenshot Error:', error);
    
    // Clean up temp file on error
    if (req.file?.path) {
      const fs = (await import('fs')).default;
      fs.unlink(req.file.path, (err) => {
        if (err) console.log('Failed to delete temp file on error:', err.message);
      });
    }
    
    res.status(500).json({ message: 'Failed to upload screenshot', error: error.message });
  }
};

// @desc    Get user's games
// @route   GET /api/game/my-games
// @access  Private
export const getMyGames = async (req, res) => {
  try {
    const games = await Game.find({
      'players.user': req.user._id
    })
      .populate('players.user', 'username phoneNumber avatar')
      .populate('winner', 'username phoneNumber avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      games
    });
  } catch (error) {
    console.error('Get My Games Error:', error);
    res.status(500).json({ message: 'Failed to fetch your games', error: error.message });
  }
};

// @desc    Cancel game (only creator, only before second player joins)
// @route   DELETE /api/game/cancel/:roomCode
// @access  Private
export const cancelGame = async (req, res) => {
  try {
    const { roomCode } = req.params;

    const game = await Game.findOne({ roomCode: roomCode.toUpperCase() });
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check if user is the creator (first player)
    if (game.players[0].user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can cancel the battle' });
    }

    // Check if game has only one player
    if (game.currentPlayers > 1) {
      return res.status(400).json({ message: 'Cannot cancel battle after second player has joined' });
    }

    // Check if game is still waiting
    if (game.status !== 'waiting') {
      return res.status(400).json({ message: 'Can only cancel battles that are waiting for players' });
    }

    // Refund entry fee to creator
    const user = await User.findById(req.user._id);
    user.depositCash += game.entryFee; // Refund to deposit cash
    await user.save();

    // Create refund transaction
    const Transaction = (await import('../models/Transaction.js')).default;
    await Transaction.create({
      user: req.user._id,
      type: 'refund',
      amount: game.entryFee,
      status: 'completed',
      description: `Refund for cancelled game ${roomCode.toUpperCase()}`,
      metadata: {
        gameId: game._id,
        roomCode: roomCode.toUpperCase()
      }
    });

    // Mark game as cancelled
    game.status = 'cancelled';
    await game.save();

    res.status(200).json({
      success: true,
      message: 'Battle cancelled and entry fee refunded',
      refundedAmount: game.entryFee
    });
  } catch (error) {
    console.error('Cancel Game Error:', error);
    res.status(500).json({ message: 'Failed to cancel battle', error: error.message });
  }
};


// @desc    Accept battle (creator accepts second player)
// @route   POST /api/game/accept/:roomCode
// @access  Private
export const acceptBattle = async (req, res) => {
  try {
    const { roomCode } = req.params;

    const game = await Game.findOne({ roomCode: roomCode.toUpperCase() });
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check if user is the creator
    if (game.players[0].user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can accept the battle' });
    }

    // Check if game has 2 players
    if (game.currentPlayers < 2) {
      return res.status(400).json({ message: 'Waiting for second player to join' });
    }

    // Update status to accepted
    game.status = 'accepted';
    await game.save();

    const populatedGame = await Game.findById(game._id)
      .populate('players.user', 'username phoneNumber avatar');

    res.status(200).json({
      success: true,
      message: 'Battle accepted',
      game: populatedGame
    });
  } catch (error) {
    console.error('Accept Battle Error:', error);
    res.status(500).json({ message: 'Failed to accept battle', error: error.message });
  }
};

// @desc    Reject battle (creator rejects second player)
// @route   POST /api/game/reject/:roomCode
// @access  Private
export const rejectBattle = async (req, res) => {
  try {
    const { roomCode } = req.params;

    const game = await Game.findOne({ roomCode: roomCode.toUpperCase() });
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check if user is the creator
    if (game.players[0].user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can reject the battle' });
    }

    // Check if game has 2 players
    if (game.currentPlayers < 2) {
      return res.status(400).json({ message: 'No player to reject' });
    }

    // Get second player
    const secondPlayer = await User.findById(game.players[1].user);
    
    // Refund second player
    secondPlayer.depositCash += game.entryFee;
    await secondPlayer.save();

    // Create refund transaction
    const Transaction = (await import('../models/Transaction.js')).default;
    await Transaction.create({
      user: secondPlayer._id,
      type: 'refund',
      amount: game.entryFee,
      status: 'completed',
      description: `Refund for rejected game ${roomCode.toUpperCase()}`,
      metadata: {
        gameId: game._id,
        roomCode: roomCode.toUpperCase()
      }
    });

    // Remove second player and update status
    game.players.pop();
    game.currentPlayers = 1;
    game.status = 'waiting';
    await game.save();

    const populatedGame = await Game.findById(game._id)
      .populate('players.user', 'username phoneNumber avatar');

    res.status(200).json({
      success: true,
      message: 'Battle rejected and player refunded',
      game: populatedGame
    });
  } catch (error) {
    console.error('Reject Battle Error:', error);
    res.status(500).json({ message: 'Failed to reject battle', error: error.message });
  }
};

// @desc    Set game room code (only creator can set)
// @route   POST /api/game/set-room-code/:roomCode
// @access  Private
export const setGameRoomCode = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { gameRoomCode } = req.body;

    if (!gameRoomCode || !gameRoomCode.trim()) {
      return res.status(400).json({ message: 'Game room code is required' });
    }

    const game = await Game.findOne({ roomCode: roomCode.toUpperCase() });
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check if user is the creator
    if (game.players[0].user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can set the room code' });
    }

    // Check if game is accepted
    if (game.status !== 'accepted') {
      return res.status(400).json({ message: 'Game must be accepted first' });
    }

    // Set room code and update status
    game.gameRoomCode = gameRoomCode.trim().toUpperCase();
    game.gameRoomCodeSetAt = new Date();
    game.status = 'in_progress';
    game.startedAt = new Date();
    await game.save();

    const populatedGame = await Game.findById(game._id)
      .populate('players.user', 'username phoneNumber avatar');

    res.status(200).json({
      success: true,
      message: 'Game room code set successfully',
      game: populatedGame
    });
  } catch (error) {
    console.error('Set Game Room Code Error:', error);
    res.status(500).json({ message: 'Failed to set room code', error: error.message });
  }
};


// @desc    Submit game result (I Won / I Lost)
// @route   POST /api/game/submit-result/:roomCode
// @access  Private
export const submitGameResult = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { result } = req.body; // 'won' or 'lost'

    if (!result || !['won', 'lost'].includes(result)) {
      return res.status(400).json({ message: 'Invalid result. Must be "won" or "lost"' });
    }

    const game = await Game.findOne({ roomCode: roomCode.toUpperCase() });
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check if user is a player in this game
    const playerIndex = game.players.findIndex(p => p.user.toString() === req.user._id.toString());
    if (playerIndex === -1) {
      return res.status(403).json({ message: 'You are not a player in this game' });
    }

    // Check if game is in progress
    if (game.status !== 'in_progress') {
      return res.status(400).json({ message: 'Game is not in progress' });
    }

    // Store the result in player data
    if (!game.players[playerIndex].result) {
      game.players[playerIndex].result = result;
      game.players[playerIndex].resultSubmittedAt = new Date();
      
      // Check if both players have submitted results
      const allPlayersSubmitted = game.players.every(p => p.result !== null);
      
      if (allPlayersSubmitted) {
        // Mark game as completed
        game.status = 'completed';
        game.completedAt = new Date();
      }
      
      await game.save();
    }

    const populatedGame = await Game.findById(game._id)
      .populate('players.user', 'username phoneNumber avatar');

    res.status(200).json({
      success: true,
      message: 'Result submitted successfully',
      game: populatedGame
    });
  } catch (error) {
    console.error('Submit Game Result Error:', error);
    res.status(500).json({ message: 'Failed to submit result', error: error.message });
  }
};
