import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Support from '../models/Support.js';
import AppSettings from '../models/AppSettings.js';
import Policy from '../models/Policy.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email });

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ message: 'Failed to login', error: error.message });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const kycPending = await User.countDocuments({ 'kycDetails.status': 'pending' });
    
    const totalTransactions = await Transaction.countDocuments();
    const pendingWithdrawals = await Transaction.countDocuments({ type: 'withdrawal', status: 'pending' });
    
    const totalDeposits = await Transaction.aggregate([
      { $match: { type: 'deposit', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalWithdrawals = await Transaction.aggregate([
      { $match: { type: 'withdrawal', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const openTickets = await Support.countDocuments({ status: 'open' });
    
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('phoneNumber username avatar createdAt');
    
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'phoneNumber username')
      .select('type amount status transactionId createdAt');

    res.status(200).json({
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          blocked: blockedUsers,
          kycPending
        },
        games: {
          total: 0,
          active: 0,
          completed: 0
        },
        transactions: {
          total: totalTransactions,
          pendingWithdrawals,
          totalDeposits: totalDeposits[0]?.total || 0,
          totalWithdrawals: totalWithdrawals[0]?.total || 0
        },
        support: {
          openTickets
        }
      },
      recentUsers,
      recentTransactions
    });
  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);
    res.status(500).json({ message: 'Failed to get dashboard stats', error: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = search ? {
      $or: [
        { phoneNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await User.countDocuments(query);

    res.status(200).json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({ message: 'Failed to get users', error: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/user/:id
// @access  Private (Admin)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('referredUsers', 'username phoneNumber avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const transactions = await Transaction.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      user,
      recentTransactions: transactions,
      recentGames: []
    });
  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({ message: 'Failed to get user', error: error.message });
  }
};

// @desc    Block user
// @route   PUT /api/admin/user/:id/block
// @access  Private (Admin)
export const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBlocked = true;
    user.isActive = false;
    await user.save();

    res.status(200).json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block User Error:', error);
    res.status(500).json({ message: 'Failed to block user', error: error.message });
  }
};

// @desc    Unblock user
// @route   PUT /api/admin/user/:id/unblock
// @access  Private (Admin)
export const unblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBlocked = false;
    user.isActive = true;
    await user.save();

    res.status(200).json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock User Error:', error);
    res.status(500).json({ message: 'Failed to unblock user', error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/user/:id
// @access  Private (Admin)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has balance
    const totalBalance = user.depositCash + user.winningCash + user.bonusCash;
    if (totalBalance > 0) {
      return res.status(400).json({ 
        message: `Cannot delete user with balance. User has ₹${totalBalance} in wallet.` 
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

// @desc    Get all transactions
// @route   GET /api/admin/transactions
// @access  Private (Admin)
export const getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type;
    const status = req.query.status;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .populate('user', 'phoneNumber username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get All Transactions Error:', error);
    res.status(500).json({ message: 'Failed to get transactions', error: error.message });
  }
};

// @desc    Update transaction status
// @route   PUT /api/admin/transaction/:id
// @access  Private (Admin)
export const updateTransactionStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    transaction.status = status;
    transaction.adminNotes = adminNotes || transaction.adminNotes;
    transaction.processedBy = req.admin._id;
    transaction.processedAt = new Date();

    // If withdrawal is completed, update user's total withdrawal
    if (transaction.type === 'withdrawal' && status === 'completed') {
      const user = await User.findById(transaction.user);
      user.totalWithdrawal += transaction.amount;
      await user.save();
    }

    // If withdrawal is failed or cancelled, refund to user
    if (transaction.type === 'withdrawal' && (status === 'failed' || status === 'cancelled')) {
      const user = await User.findById(transaction.user);
      user.winningCash += transaction.amount;
      await user.save();
    }

    await transaction.save();

    res.status(200).json({
      message: 'Transaction updated successfully',
      transaction
    });
  } catch (error) {
    console.error('Update Transaction Error:', error);
    res.status(500).json({ message: 'Failed to update transaction', error: error.message });
  }
};

// @desc    Get all games
// @desc    Get all games
// @route   GET /api/admin/games
// @access  Private (Admin)
export const getAllGames = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    // Import Game model
    const Game = (await import('../models/Game.js')).default;

    // Build query
    let query = {};
    if (status && status !== 'all' && status !== '') {
      query.status = status;
    }

    const games = await Game.find(query)
      .populate('players.user', 'username phoneNumber avatar')
      .populate('winner', 'username phoneNumber avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Game.countDocuments(query);

    res.status(200).json({
      games,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get All Games Error:', error);
    res.status(500).json({ message: 'Failed to get games', error: error.message });
  }
};

// @desc    Declare game winner
// @route   POST /api/admin/games/:roomCode/declare-winner
// @access  Private (Admin)
export const declareGameWinner = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { winnerId } = req.body;

    if (!winnerId) {
      return res.status(400).json({ message: 'Winner ID is required' });
    }

    // Import Game model
    const Game = (await import('../models/Game.js')).default;

    const game = await Game.findOne({ roomCode: roomCode.toUpperCase() })
      .populate('players.user', 'username phoneNumber avatar');

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    if (game.status === 'completed') {
      return res.status(400).json({ message: 'Game already completed' });
    }

    if (game.status !== 'in_progress') {
      return res.status(400).json({ message: 'Can only declare winner for games in progress' });
    }

    // Check if winner is a player in the game
    const isPlayer = game.players.some(p => p.user._id.toString() === winnerId);
    if (!isPlayer) {
      return res.status(400).json({ message: 'Winner must be a player in the game' });
    }

    // Check if winning transaction already exists (prevent duplicate)
    const Transaction = (await import('../models/Transaction.js')).default;
    const existingWinTransaction = await Transaction.findOne({
      user: winnerId,
      type: 'game_win',
      'metadata.gameId': game._id
    });

    if (existingWinTransaction) {
      return res.status(400).json({ message: 'Winner already declared for this game' });
    }

    // Update game
    game.winner = winnerId;
    game.status = 'completed';
    game.completedAt = new Date();
    await game.save();

    // Credit winner
    const winner = await User.findById(winnerId);
    winner.winningCash += game.prizePool;
    winner.totalCoinsWon += game.prizePool;
    winner.totalGamesWon += 1;
    winner.totalGamesPlayed += 1;
    await winner.save();

    // Create winning transaction
    await Transaction.create({
      user: winnerId,
      type: 'game_win',
      amount: game.prizePool,
      status: 'completed',
      description: `Game winning for room ${roomCode.toUpperCase()}`,
      metadata: {
        gameId: game._id,
        roomCode: roomCode.toUpperCase()
      }
    });

    // Update loser stats
    const loserId = game.players.find(p => p.user._id.toString() !== winnerId).user._id;
    const loser = await User.findById(loserId);
    loser.totalGamesLost += 1;
    loser.totalGamesPlayed += 1;
    await loser.save();

    // Handle referral commission (3% of entry fee)
    if (winner.referredBy) {
      const referrer = await User.findOne({ referralCode: winner.referredBy });
      if (referrer) {
        const commission = game.entryFee * 0.03;
        referrer.referralEarnings += commission;
        referrer.bonusCash += commission;
        await referrer.save();
      }
    }

    const populatedGame = await Game.findById(game._id)
      .populate('players.user', 'username phoneNumber avatar')
      .populate('winner', 'username phoneNumber avatar');

    res.status(200).json({
      success: true,
      message: 'Winner declared successfully',
      game: populatedGame
    });
  } catch (error) {
    console.error('Declare Winner Error:', error);
    res.status(500).json({ message: 'Failed to declare winner', error: error.message });
  }
};

// @desc    Manually add funds to user
// @route   POST /api/admin/users/:userId/add-funds
// @access  Private (Admin)
export const addFundsToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, type, reason } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    if (!type || !['deposit', 'winning', 'bonus'].includes(type)) {
      return res.status(400).json({ message: 'Type must be deposit, winning, or bonus' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add funds based on type
    if (type === 'deposit') {
      user.depositCash += amount;
    } else if (type === 'winning') {
      user.winningCash += amount;
    } else if (type === 'bonus') {
      user.bonusCash += amount;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `₹${amount} added to ${type} cash successfully`,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        depositCash: user.depositCash,
        winningCash: user.winningCash,
        bonusCash: user.bonusCash,
        totalBalance: user.getTotalBalance()
      }
    });
  } catch (error) {
    console.error('Add Funds Error:', error);
    res.status(500).json({ message: 'Failed to add funds', error: error.message });
  }
};

// @desc    Manually deduct funds from user
// @route   POST /api/admin/users/:userId/deduct-funds
// @access  Private (Admin)
export const deductFundsFromUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, type, reason } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    if (!type || !['deposit', 'winning', 'bonus'].includes(type)) {
      return res.status(400).json({ message: 'Type must be deposit, winning, or bonus' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has sufficient balance
    let currentBalance = 0;
    if (type === 'deposit') {
      currentBalance = user.depositCash;
    } else if (type === 'winning') {
      currentBalance = user.winningCash;
    } else if (type === 'bonus') {
      currentBalance = user.bonusCash;
    }

    if (currentBalance < amount) {
      return res.status(400).json({ 
        message: `Insufficient ${type} cash. Available: ₹${currentBalance}` 
      });
    }

    // Deduct funds based on type
    if (type === 'deposit') {
      user.depositCash -= amount;
    } else if (type === 'winning') {
      user.winningCash -= amount;
    } else if (type === 'bonus') {
      user.bonusCash -= amount;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `₹${amount} deducted from ${type} cash successfully`,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        depositCash: user.depositCash,
        winningCash: user.winningCash,
        bonusCash: user.bonusCash,
        totalBalance: user.getTotalBalance()
      }
    });
  } catch (error) {
    console.error('Deduct Funds Error:', error);
    res.status(500).json({ message: 'Failed to deduct funds', error: error.message });
  }
};

// @desc    Get all KYC requests
// @route   GET /api/admin/kyc
// @access  Private (Admin)
export const getAllKYCRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    // Build query - if status is empty or 'all', get all KYC submissions
    let query = { 'kycDetails.submittedAt': { $exists: true } };
    if (status && status !== 'all' && status !== '') {
      query['kycDetails.status'] = status;
    }

    const users = await User.find(query)
      .sort({ 'kycDetails.submittedAt': -1 })
      .skip(skip)
      .limit(limit)
      .select('phoneNumber username email kycDetails');

    const total = await User.countDocuments(query);

    res.status(200).json({
      kycRequests: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get KYC Requests Error:', error);
    res.status(500).json({ message: 'Failed to get KYC requests', error: error.message });
  }
};

// @desc    Update KYC status
// @route   PUT /api/admin/kyc/:id
// @access  Private (Admin)
export const updateKYCStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.kycDetails.status = status;
    
    if (status === 'approved') {
      user.isKYCVerified = true;
      user.kycDetails.verifiedAt = new Date();
    } else if (status === 'rejected') {
      user.isKYCVerified = false;
      user.kycDetails.rejectionReason = rejectionReason;
    }

    await user.save();

    res.status(200).json({
      message: `KYC ${status} successfully`,
      user
    });
  } catch (error) {
    console.error('Update KYC Status Error:', error);
    res.status(500).json({ message: 'Failed to update KYC status', error: error.message });
  }
};

// @desc    Get all support tickets
// @route   GET /api/admin/support
// @access  Private (Admin)
export const getAllSupportTickets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = status ? { status } : {};

    const tickets = await Support.find(query)
      .populate('user', 'phoneNumber username email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Support.countDocuments(query);

    res.status(200).json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Support Tickets Error:', error);
    res.status(500).json({ message: 'Failed to get support tickets', error: error.message });
  }
};

// @desc    Update ticket status
// @route   PUT /api/admin/support/:id/status
// @access  Private (Admin)
export const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const ticket = await Support.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = status;
    ticket.assignedTo = req.admin._id;

    if (status === 'resolved') {
      ticket.resolvedAt = new Date();
    } else if (status === 'closed') {
      ticket.closedAt = new Date();
    }

    await ticket.save();

    res.status(200).json({
      message: 'Ticket status updated successfully',
      ticket
    });
  } catch (error) {
    console.error('Update Ticket Status Error:', error);
    res.status(500).json({ message: 'Failed to update ticket status', error: error.message });
  }
};

// @desc    Reply to ticket
// @route   POST /api/admin/support/:id/reply
// @access  Private (Admin)
export const replyToTicket = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const ticket = await Support.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.messages.push({
      sender: 'admin',
      senderName: req.admin.name,
      message
    });

    ticket.status = 'in_progress';
    ticket.assignedTo = req.admin._id;

    await ticket.save();

    res.status(200).json({
      message: 'Reply sent successfully',
      ticket
    });
  } catch (error) {
    console.error('Reply to Ticket Error:', error);
    res.status(500).json({ message: 'Failed to reply to ticket', error: error.message });
  }
};

// @desc    Get app settings
// @route   GET /api/admin/settings
// @access  Private (Admin)
export const getAppSettings = async (req, res) => {
  try {
    const settings = await AppSettings.find();
    res.status(200).json({ settings });
  } catch (error) {
    console.error('Get Settings Error:', error);
    res.status(500).json({ message: 'Failed to get settings', error: error.message });
  }
};

// @desc    Update app settings
// @route   PUT /api/admin/settings
// @access  Private (Admin)
export const updateAppSettings = async (req, res) => {
  try {
    const { settingKey, settingValue, description, category } = req.body;

    let setting = await AppSettings.findOne({ settingKey });

    if (setting) {
      setting.settingValue = settingValue;
      setting.description = description || setting.description;
      setting.category = category || setting.category;
      setting.updatedBy = req.admin._id;
      await setting.save();
    } else {
      setting = await AppSettings.create({
        settingKey,
        settingValue,
        description,
        category,
        updatedBy: req.admin._id
      });
    }

    res.status(200).json({
      message: 'Settings updated successfully',
      setting
    });
  } catch (error) {
    console.error('Update Settings Error:', error);
    res.status(500).json({ message: 'Failed to update settings', error: error.message });
  }
};


// @desc    Get all policies
// @route   GET /api/admin/policies
// @access  Private (Admin)
export const getAllPolicies = async (req, res) => {
  try {
    const policies = await Policy.find().sort({ policyKey: 1 });
    res.status(200).json({ policies });
  } catch (error) {
    console.error('Get All Policies Error:', error);
    res.status(500).json({ message: 'Failed to get policies', error: error.message });
  }
};

// @desc    Get policy by key
// @route   GET /api/admin/policies/:policyKey
// @access  Private (Admin)
export const getPolicy = async (req, res) => {
  try {
    const { policyKey } = req.params;
    const policy = await Policy.findOne({ policyKey });
    
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found', policy: null });
    }
    
    res.status(200).json({ policy });
  } catch (error) {
    console.error('Get Policy Error:', error);
    res.status(500).json({ message: 'Failed to get policy', error: error.message });
  }
};

// @desc    Update or create policy
// @route   PUT /api/admin/policies/:policyKey
// @access  Private (Admin)
export const updatePolicy = async (req, res) => {
  try {
    const { policyKey } = req.params;
    const { title, sections } = req.body;

    let policy = await Policy.findOne({ policyKey });

    if (policy) {
      policy.title = title;
      policy.sections = sections;
      policy.updatedBy = req.admin._id;
      await policy.save();
    } else {
      policy = await Policy.create({
        policyKey,
        title,
        sections,
        updatedBy: req.admin._id
      });
    }

    res.status(200).json({
      message: 'Policy updated successfully',
      policy
    });
  } catch (error) {
    console.error('Update Policy Error:', error);
    res.status(500).json({ message: 'Failed to update policy', error: error.message });
  }
};

// @desc    Get policy for public (client app)
// @route   GET /api/policies/:policyKey
// @access  Public
export const getPublicPolicy = async (req, res) => {
  try {
    const { policyKey } = req.params;
    const policy = await Policy.findOne({ policyKey, isActive: true });
    
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    
    res.status(200).json({ policy });
  } catch (error) {
    console.error('Get Public Policy Error:', error);
    res.status(500).json({ message: 'Failed to get policy', error: error.message });
  }
};

// @desc    Change admin password
// @route   PUT /api/admin/change-password
// @access  Private (Admin)
export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.status(200).json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
};

// @desc    Get comprehensive platform reports
// @route   GET /api/admin/reports
// @access  Private (Admin)
export const getReports = async (req, res) => {
  try {
    const { dateRange, startDate, endDate } = req.query;

    // Calculate date range
    let start, end;
    end = new Date();
    
    switch (dateRange) {
      case 'today':
        start = new Date();
        start.setHours(0, 0, 0, 0);
        break;
      case '7days':
        start = new Date();
        start.setDate(start.getDate() - 7);
        break;
      case '30days':
        start = new Date();
        start.setDate(start.getDate() - 30);
        break;
      case '90days':
        start = new Date();
        start.setDate(start.getDate() - 90);
        break;
      case 'custom':
        if (startDate && endDate) {
          start = new Date(startDate);
          end = new Date(endDate);
        } else {
          start = new Date();
          start.setDate(start.getDate() - 30);
        }
        break;
      default:
        start = new Date();
        start.setDate(start.getDate() - 7);
    }

    // Import Game model
    const Game = (await import('../models/Game.js')).default;

    // Get previous period for comparison
    const periodDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - periodDays);
    const prevEnd = new Date(start);

    // === OVERVIEW STATS ===
    const totalUsers = await User.countDocuments();
    const prevTotalUsers = await User.countDocuments({ createdAt: { $lt: prevEnd } });
    const userGrowth = prevTotalUsers > 0 ? (((totalUsers - prevTotalUsers) / prevTotalUsers) * 100).toFixed(1) : 0;

    const totalGames = await Game.countDocuments({ createdAt: { $gte: start, $lte: end } });
    const prevTotalGames = await Game.countDocuments({ createdAt: { $gte: prevStart, $lt: prevEnd } });
    const gamesChange = prevTotalGames > 0 ? (((totalGames - prevTotalGames) / prevTotalGames) * 100).toFixed(1) : 0;

    // Revenue calculations
    const completedGames = await Game.find({ 
      status: 'completed',
      createdAt: { $gte: start, $lte: end }
    });
    
    const totalRevenue = completedGames.reduce((sum, game) => {
      const commission = (game.entryFee * 2 * game.commissionRate) / 100;
      return sum + commission;
    }, 0);

    const prevCompletedGames = await Game.find({ 
      status: 'completed',
      createdAt: { $gte: prevStart, $lt: prevEnd }
    });
    
    const prevRevenue = prevCompletedGames.reduce((sum, game) => {
      const commission = (game.entryFee * 2 * game.commissionRate) / 100;
      return sum + commission;
    }, 0);

    const revenueChange = prevRevenue > 0 ? (((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : 0;

    const totalCommission = totalRevenue;
    const commissionChange = revenueChange;

    // === USER STATS ===
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false, isBlocked: false });
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const newUsers = await User.countDocuments({ createdAt: { $gte: start, $lte: end } });
    const verifiedUsers = await User.countDocuments({ isKYCVerified: true });

    // === GAME STATS ===
    const completedGamesCount = await Game.countDocuments({ 
      status: 'completed',
      createdAt: { $gte: start, $lte: end }
    });
    const inProgressGames = await Game.countDocuments({ status: 'in_progress' });
    const cancelledGames = await Game.countDocuments({ 
      status: 'cancelled',
      createdAt: { $gte: start, $lte: end }
    });

    const avgEntryFeeResult = await Game.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, avgFee: { $avg: '$entryFee' } } }
    ]);
    const avgEntryFee = avgEntryFeeResult[0]?.avgFee?.toFixed(2) || 0;

    // === TRANSACTION STATS ===
    const deposits = await Transaction.aggregate([
      { $match: { type: 'deposit', status: 'completed', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } }
    ]);

    const withdrawals = await Transaction.aggregate([
      { $match: { type: 'withdrawal', status: 'completed', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } }
    ]);

    const gameEntries = await Transaction.aggregate([
      { $match: { type: 'game_entry', status: 'completed', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } }
    ]);

    const winnings = await Transaction.aggregate([
      { $match: { type: 'game_win', status: 'completed', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } }
    ]);

    const refunds = await Transaction.aggregate([
      { $match: { type: 'refund', status: 'completed', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } }
    ]);

    // === REVENUE BREAKDOWN ===
    const totalDeposits = deposits[0]?.amount || 0;
    const totalWithdrawals = withdrawals[0]?.amount || 0;
    const netProfit = totalRevenue - totalWithdrawals;

    // === TRENDS DATA (Daily breakdown) ===
    const days = Math.min(periodDays, 30); // Max 30 days for chart
    const trends = {
      dates: [],
      revenue: [],
      commission: [],
      gamesPlayed: []
    };

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(end);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      trends.dates.push(date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));

      // Daily games
      const dailyGames = await Game.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });
      trends.gamesPlayed.push(dailyGames);

      // Daily revenue
      const dailyCompletedGames = await Game.find({
        status: 'completed',
        createdAt: { $gte: date, $lt: nextDate }
      });

      const dailyRevenue = dailyCompletedGames.reduce((sum, game) => {
        const commission = (game.entryFee * 2 * game.commissionRate) / 100;
        return sum + commission;
      }, 0);

      trends.revenue.push(dailyRevenue);
      trends.commission.push(dailyRevenue);
    }

    // === COMPILE REPORT ===
    const report = {
      overview: {
        totalRevenue: Math.round(totalRevenue),
        revenueChange: parseFloat(revenueChange),
        totalUsers,
        userGrowth: parseFloat(userGrowth),
        totalGames,
        gamesChange: parseFloat(gamesChange),
        totalCommission: Math.round(totalCommission),
        commissionChange: parseFloat(commissionChange)
      },
      users: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        blockedUsers,
        newUsers,
        verifiedUsers
      },
      games: {
        totalGames,
        completed: completedGamesCount,
        inProgress: inProgressGames,
        cancelled: cancelledGames,
        avgEntryFee
      },
      transactions: {
        deposits: {
          count: deposits[0]?.count || 0,
          amount: Math.round(deposits[0]?.amount || 0)
        },
        withdrawals: {
          count: withdrawals[0]?.count || 0,
          amount: Math.round(withdrawals[0]?.amount || 0)
        },
        gameEntries: {
          count: gameEntries[0]?.count || 0,
          amount: Math.round(gameEntries[0]?.amount || 0)
        },
        winnings: {
          count: winnings[0]?.count || 0,
          amount: Math.round(winnings[0]?.amount || 0)
        },
        refunds: {
          count: refunds[0]?.count || 0,
          amount: Math.round(refunds[0]?.amount || 0)
        }
      },
      revenue: {
        totalRevenue: Math.round(totalRevenue),
        commission: Math.round(totalCommission),
        deposits: Math.round(totalDeposits),
        withdrawals: Math.round(totalWithdrawals),
        netProfit: Math.round(netProfit)
      },
      trends
    };

    res.status(200).json({
      success: true,
      report,
      dateRange: {
        start,
        end,
        days: periodDays
      }
    });
  } catch (error) {
    console.error('Get Reports Error:', error);
    res.status(500).json({ message: 'Failed to generate reports', error: error.message });
  }
};
