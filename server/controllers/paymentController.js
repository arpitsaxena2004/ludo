import DepositRequest from '../models/DepositRequest.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import PaymentSettings from '../models/PaymentSettings.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';

// Get payment settings (public)
export const getPaymentSettings = async (req, res) => {
  try {
    let settings = await PaymentSettings.findOne();
    
    if (!settings) {
      settings = await PaymentSettings.create({});
    }

    res.json({
      success: true,
      data: {
        upiId: settings.upiId,
        upiNumber: settings.upiNumber,
        qrCode: settings.qrCode,
        minDeposit: settings.minDeposit,
        maxDeposit: settings.maxDeposit,
        minWithdrawal: settings.minWithdrawal,
        maxWithdrawal: settings.maxWithdrawal,
        isDepositEnabled: settings.isDepositEnabled,
        isWithdrawalEnabled: settings.isWithdrawalEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update payment settings (admin)
export const updatePaymentSettings = async (req, res) => {
  try {
    const { upiId, upiNumber, minDeposit, maxDeposit, minWithdrawal, maxWithdrawal, isDepositEnabled, isWithdrawalEnabled } = req.body;

    let settings = await PaymentSettings.findOne();
    
    if (!settings) {
      settings = await PaymentSettings.create({});
    }

    if (upiId !== undefined) settings.upiId = upiId;
    if (upiNumber !== undefined) settings.upiNumber = upiNumber;
    if (minDeposit !== undefined) settings.minDeposit = minDeposit;
    if (maxDeposit !== undefined) settings.maxDeposit = maxDeposit;
    if (minWithdrawal !== undefined) settings.minWithdrawal = minWithdrawal;
    if (maxWithdrawal !== undefined) settings.maxWithdrawal = maxWithdrawal;
    if (isDepositEnabled !== undefined) settings.isDepositEnabled = isDepositEnabled;
    if (isWithdrawalEnabled !== undefined) settings.isWithdrawalEnabled = isWithdrawalEnabled;

    await settings.save();

    res.json({
      success: true,
      message: 'Payment settings updated successfully',
      data: settings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload QR code (admin)
export const uploadQRCode = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'payment_qr',
      transformation: [{ width: 500, height: 500, crop: 'limit' }]
    });

    let settings = await PaymentSettings.findOne();
    if (!settings) {
      settings = await PaymentSettings.create({});
    }

    settings.qrCode = result.secure_url;
    await settings.save();

    res.json({
      success: true,
      message: 'QR code uploaded successfully',
      data: { qrCode: result.secure_url }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create deposit request (user)
export const createDepositRequest = async (req, res) => {
  try {
    const { amount, upiTransactionId } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Payment screenshot is required' });
    }

    const settings = await PaymentSettings.findOne();
    
    if (!settings || !settings.isDepositEnabled) {
      return res.status(400).json({ success: false, message: 'Deposits are currently disabled' });
    }

    if (amount < settings.minDeposit || amount > settings.maxDeposit) {
      return res.status(400).json({ 
        success: false, 
        message: `Deposit amount must be between ₹${settings.minDeposit} and ₹${settings.maxDeposit}` 
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'deposit_screenshots',
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
    });

    const depositRequest = await DepositRequest.create({
      user: userId,
      amount,
      screenshot: result.secure_url,
      upiTransactionId: upiTransactionId || ''
    });

    res.json({
      success: true,
      message: 'Deposit request submitted successfully. Please wait for admin approval.',
      data: depositRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user deposit requests
export const getUserDepositRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const deposits = await DepositRequest.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: deposits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create withdrawal request (user)
export const createWithdrawalRequest = async (req, res) => {
  try {
    const { amount, paymentMethod, withdrawalDetails } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const settings = await PaymentSettings.findOne();

    if (!settings || !settings.isWithdrawalEnabled) {
      return res.status(400).json({ success: false, message: 'Withdrawals are currently disabled' });
    }

    if (amount < settings.minWithdrawal || amount > settings.maxWithdrawal) {
      return res.status(400).json({ 
        success: false, 
        message: `Withdrawal amount must be between ₹${settings.minWithdrawal} and ₹${settings.maxWithdrawal}` 
      });
    }

    // Check if user has sufficient winning cash
    if (user.winningCash < amount) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient winning balance. Available: ₹${user.winningCash}` 
      });
    }

    // Deduct amount from winning cash
    user.winningCash -= amount;
    await user.save();

    const withdrawalRequest = await WithdrawalRequest.create({
      user: userId,
      amount,
      paymentMethod,
      withdrawalDetails
    });

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully. Please wait for admin approval.',
      data: withdrawalRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user withdrawal requests
export const getUserWithdrawalRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const withdrawals = await WithdrawalRequest.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: withdrawals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all deposit requests
export const getAllDepositRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const deposits = await DepositRequest.find(filter)
      .populate('user', 'phoneNumber username email')
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: deposits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all withdrawal requests
export const getAllWithdrawalRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const withdrawals = await WithdrawalRequest.find(filter)
      .populate('user', 'phoneNumber username email winningCash')
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: withdrawals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Approve deposit request
export const approveDepositRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.admin.id;

    const depositRequest = await DepositRequest.findById(id).populate('user');

    if (!depositRequest) {
      return res.status(404).json({ success: false, message: 'Deposit request not found' });
    }

    if (depositRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Deposit request already processed' });
    }

    // Update user balance
    const user = await User.findById(depositRequest.user._id);
    user.depositCash += depositRequest.amount;
    await user.save();

    // Create transaction record
    await Transaction.create({
      user: user._id,
      type: 'deposit',
      amount: depositRequest.amount,
      status: 'completed',
      paymentMethod: 'upi',
      description: 'Manual deposit approved by admin',
      processedBy: adminId
    });

    // Update deposit request
    depositRequest.status = 'approved';
    depositRequest.adminNotes = adminNotes || '';
    depositRequest.processedBy = adminId;
    depositRequest.processedAt = new Date();
    await depositRequest.save();

    res.json({
      success: true,
      message: 'Deposit request approved successfully',
      data: depositRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Reject deposit request
export const rejectDepositRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.admin.id;

    const depositRequest = await DepositRequest.findById(id);

    if (!depositRequest) {
      return res.status(404).json({ success: false, message: 'Deposit request not found' });
    }

    if (depositRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Deposit request already processed' });
    }

    depositRequest.status = 'rejected';
    depositRequest.adminNotes = adminNotes || '';
    depositRequest.processedBy = adminId;
    depositRequest.processedAt = new Date();
    await depositRequest.save();

    res.json({
      success: true,
      message: 'Deposit request rejected',
      data: depositRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Approve withdrawal request
export const approveWithdrawalRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.admin.id;

    const withdrawalRequest = await WithdrawalRequest.findById(id).populate('user');

    if (!withdrawalRequest) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    if (withdrawalRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Withdrawal request already processed' });
    }

    const user = await User.findById(withdrawalRequest.user._id);
    user.totalWithdrawal += withdrawalRequest.amount;
    await user.save();

    // Create transaction record
    await Transaction.create({
      user: user._id,
      type: 'withdrawal',
      amount: withdrawalRequest.amount,
      status: 'completed',
      paymentMethod: withdrawalRequest.paymentMethod,
      description: 'Manual withdrawal approved by admin',
      withdrawalDetails: withdrawalRequest.withdrawalDetails,
      processedBy: adminId
    });

    withdrawalRequest.status = 'approved';
    withdrawalRequest.adminNotes = adminNotes || '';
    withdrawalRequest.processedBy = adminId;
    withdrawalRequest.processedAt = new Date();
    await withdrawalRequest.save();

    res.json({
      success: true,
      message: 'Withdrawal request approved successfully',
      data: withdrawalRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Reject withdrawal request
export const rejectWithdrawalRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.admin.id;

    const withdrawalRequest = await WithdrawalRequest.findById(id).populate('user');

    if (!withdrawalRequest) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    if (withdrawalRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Withdrawal request already processed' });
    }

    // Refund amount to user's winning cash
    const user = await User.findById(withdrawalRequest.user._id);
    user.winningCash += withdrawalRequest.amount;
    await user.save();

    withdrawalRequest.status = 'rejected';
    withdrawalRequest.adminNotes = adminNotes || '';
    withdrawalRequest.processedBy = adminId;
    withdrawalRequest.processedAt = new Date();
    await withdrawalRequest.save();

    res.json({
      success: true,
      message: 'Withdrawal request rejected and amount refunded',
      data: withdrawalRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
