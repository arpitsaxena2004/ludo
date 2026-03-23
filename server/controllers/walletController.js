import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

// @desc    Get wallet balance
// @route   GET /api/wallet/balance
// @access  Private
export const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      depositCash: user.depositCash,
      winningCash: user.winningCash,
      bonusCash: user.bonusCash,
      totalBalance: user.getTotalBalance()
    });
  } catch (error) {
    console.error('Get Balance Error:', error);
    res.status(500).json({ message: 'Failed to get balance', error: error.message });
  }
};

// @desc    Add cash (deposit)
// @route   POST /api/wallet/deposit
// @access  Private
export const addCash = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    if (amount < 50) {
      return res.status(400).json({ message: 'Minimum deposit amount is ₹50' });
    }

    // Create transaction record
    const transaction = await Transaction.create({
      user: req.user._id,
      type: 'deposit',
      amount,
      paymentMethod,
      status: 'pending',
      description: `Deposit of ₹${amount}`
    });

    // In production, integrate with payment gateway here
    // For now, we'll simulate successful payment
    if (process.env.NODE_ENV === 'development') {
      transaction.status = 'completed';
      await transaction.save();

      const user = await User.findById(req.user._id);
      user.depositCash += amount;
      await user.save();
    }

    res.status(200).json({
      message: 'Deposit initiated successfully',
      transaction: {
        id: transaction._id,
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        status: transaction.status
      }
    });
  } catch (error) {
    console.error('Add Cash Error:', error);
    res.status(500).json({ message: 'Failed to add cash', error: error.message });
  }
};

// @desc    Withdraw cash
// @route   POST /api/wallet/withdraw
// @access  Private
export const withdrawCash = async (req, res) => {
  try {
    const { amount, withdrawalDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    if (amount < 100) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is ₹100' });
    }

    const user = await User.findById(req.user._id);

    // Check if user has completed KYC
    if (!user.isKYCVerified) {
      return res.status(400).json({ message: 'Please complete KYC verification to withdraw' });
    }

    // Check if user has sufficient winning cash
    if (user.winningCash < amount) {
      return res.status(400).json({ message: 'Insufficient winning cash balance' });
    }

    // Create withdrawal transaction
    const transaction = await Transaction.create({
      user: req.user._id,
      type: 'withdrawal',
      amount,
      status: 'pending',
      withdrawalDetails,
      description: `Withdrawal of ₹${amount}`
    });

    // Deduct from winning cash
    user.winningCash -= amount;
    await user.save();

    res.status(200).json({
      message: 'Withdrawal request submitted successfully. It will be processed within 24-48 hours.',
      transaction: {
        id: transaction._id,
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        status: transaction.status
      }
    });
  } catch (error) {
    console.error('Withdraw Cash Error:', error);
    res.status(500).json({ message: 'Failed to withdraw cash', error: error.message });
  }
};

// @desc    Get transaction history
// @route   GET /api/wallet/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-user -__v');

    const total = await Transaction.countDocuments({ user: req.user._id });

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
    console.error('Get Transactions Error:', error);
    res.status(500).json({ message: 'Failed to get transactions', error: error.message });
  }
};

// @desc    Get transaction by ID
// @route   GET /api/wallet/transaction/:id
// @access  Private
export const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({ transaction });
  } catch (error) {
    console.error('Get Transaction Error:', error);
    res.status(500).json({ message: 'Failed to get transaction', error: error.message });
  }
};
