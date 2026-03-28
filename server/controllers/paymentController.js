import DepositRequest from '../models/DepositRequest.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import PaymentSettings from '../models/PaymentSettings.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { createPaymentOrder, checkPaymentStatus } from '../services/paymentGateway.js';

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

    const qrCodeUrl = `/uploads/payments/${req.file.filename}`;

    let settings = await PaymentSettings.findOne();
    if (!settings) {
      settings = await PaymentSettings.create({});
    }

    settings.qrCode = qrCodeUrl;
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

// Create deposit request (user) - NEW AUTOMATIC GATEWAY
export const createDepositRequest = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);

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

    // Generate unique order ID
    const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Get the origin from request headers (dynamic domain detection)
    const origin = req.get('origin') || req.get('referer')?.split('/').slice(0, 3).join('/') || process.env.CLIENT_URL;
    
    // Create payment order with gateway
    const paymentResponse = await createPaymentOrder({
      customerMobile: user.phoneNumber,
      customerName: user.username || user.phoneNumber,
      amount,
      orderId,
      redirectUrl: `${origin}/payment-success`,
      remark1: `Deposit by ${user.username}`,
      remark2: userId.toString()
    });

    if (!paymentResponse.status) {
      return res.status(400).json({ 
        success: false, 
        message: paymentResponse.message || 'Failed to create payment order' 
      });
    }

    // Create deposit request in database
    const depositRequest = await DepositRequest.create({
      user: userId,
      amount,
      paymentMethod: 'gateway',
      orderId,
      gatewayOrderId: paymentResponse.result.orderId,
      paymentUrl: paymentResponse.result.payment_url,
      status: 'processing'
    });

    res.json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId,
        paymentUrl: paymentResponse.result.payment_url,
        depositRequest
      }
    });
  } catch (error) {
    console.error('Deposit request error:', error);
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

// Test payment gateway connection (for debugging)
export const testPaymentGateway = async (req, res) => {
  try {
    // Get the origin from request headers (dynamic domain detection)
    const origin = req.get('origin') || req.get('referer')?.split('/').slice(0, 3).join('/') || process.env.CLIENT_URL;
    
    const testOrder = {
      customerMobile: '9999999999',
      customerName: 'Test User',
      amount: 1,
      orderId: `TEST${Date.now()}`,
      redirectUrl: `${origin}/payment-success`,
      remark1: 'Test payment',
      remark2: 'Testing'
    };

    console.log('Testing payment gateway with:', testOrder);
    const response = await createPaymentOrder(testOrder);
    
    res.json({
      success: true,
      message: 'Payment gateway is working!',
      data: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      details: 'Check server console for more details'
    });
  }
};

// Webhook handler for payment gateway
export const handlePaymentWebhook = async (req, res) => {
  try {
    const { status, order_id, customer_mobile, amount, remark1, remark2 } = req.body;

    console.log('Payment webhook received:', req.body);

    // Find deposit request by order ID
    const depositRequest = await DepositRequest.findOne({ orderId: order_id });

    if (!depositRequest) {
      console.error('Deposit request not found for order:', order_id);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (status === 'SUCCESS' || status === 'success') {
      // Update deposit request status
      depositRequest.status = 'approved';
      depositRequest.processedAt = new Date();
      await depositRequest.save();

      // Add amount to user's deposit cash
      const user = await User.findById(depositRequest.user);
      if (user) {
        user.depositCash += depositRequest.amount;
        await user.save();

        // Create transaction record
        await Transaction.create({
          user: user._id,
          type: 'deposit',
          amount: depositRequest.amount,
          status: 'completed',
          paymentMethod: 'gateway',
          description: 'Automatic deposit via payment gateway',
          orderId: order_id
        });

        console.log(`Deposit approved automatically for user ${user._id}, amount: ₹${depositRequest.amount}`);
      }

      return res.json({ success: true, message: 'Payment processed successfully' });
    } else {
      // Payment failed or pending
      depositRequest.status = status === 'PENDING' ? 'processing' : 'rejected';
      await depositRequest.save();

      return res.json({ success: true, message: 'Payment status updated' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check payment status manually
export const checkDepositStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const depositRequest = await DepositRequest.findOne({ orderId, user: userId });

    if (!depositRequest) {
      return res.status(404).json({ success: false, message: 'Deposit request not found' });
    }

    // Check status from payment gateway
    const statusResponse = await checkPaymentStatus(orderId);

    if (statusResponse.status && statusResponse.result) {
      const { txnStatus, utr } = statusResponse.result;

      if (txnStatus === 'SUCCESS' && depositRequest.status !== 'approved') {
        // Update deposit request
        depositRequest.status = 'approved';
        depositRequest.utr = utr || '';
        depositRequest.processedAt = new Date();
        await depositRequest.save();

        // Add amount to user's deposit cash
        const user = await User.findById(userId);
        user.depositCash += depositRequest.amount;
        await user.save();

        // Create transaction record
        await Transaction.create({
          user: userId,
          type: 'deposit',
          amount: depositRequest.amount,
          status: 'completed',
          paymentMethod: 'gateway',
          description: 'Automatic deposit via payment gateway',
          orderId
        });
      } else if (txnStatus === 'PENDING') {
        depositRequest.status = 'processing';
        await depositRequest.save();
      }
    }

    res.json({ 
      success: true, 
      data: depositRequest,
      gatewayStatus: statusResponse 
    });
  } catch (error) {
    console.error('Check status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create withdrawal request (user)
export const createWithdrawalRequest = async (req, res) => {
  try {
    const { amount, paymentMethod, withdrawalDetails } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

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
    console.error('Withdrawal request error:', error);
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

// Admin: Approve withdrawal request (with payment screenshot)
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

    // Upload payment screenshot if provided
    let paymentScreenshotUrl = null;
    if (req.file) {
      paymentScreenshotUrl = `/uploads/payments/${req.file.filename}`;
    }

    const user = await User.findById(withdrawalRequest.user._id);
    user.totalWithdrawal += withdrawalRequest.amount;
    await user.save();

    // Create transaction record with screenshot
    await Transaction.create({
      user: user._id,
      type: 'withdrawal',
      amount: withdrawalRequest.amount,
      status: 'completed',
      paymentMethod: withdrawalRequest.paymentMethod,
      description: 'Manual withdrawal approved by admin',
      withdrawalDetails: withdrawalRequest.withdrawalDetails,
      paymentScreenshot: paymentScreenshotUrl,
      screenshotExpiresAt: paymentScreenshotUrl ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      processedBy: adminId
    });

    withdrawalRequest.status = 'approved';
    withdrawalRequest.adminNotes = adminNotes || '';
    withdrawalRequest.processedBy = adminId;
    withdrawalRequest.processedAt = new Date();
    withdrawalRequest.paymentScreenshot = paymentScreenshotUrl;
    withdrawalRequest.screenshotExpiresAt = paymentScreenshotUrl
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : null;
    await withdrawalRequest.save();

    res.json({
      success: true,
      message: 'Withdrawal approved successfully',
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
