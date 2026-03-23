import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppConfig from '../models/AppConfig.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { phoneNumber, password, referralCode } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({ message: 'Phone number and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ message: 'Phone number already registered' });
    }

    // Generate unique referral code
    let referralCodeGenerated;
    let isUnique = false;
    while (!isUnique) {
      referralCodeGenerated = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingCode = await User.findOne({ referralCode: referralCodeGenerated });
      if (!existingCode) {
        isUnique = true;
      }
    }

    // Get signup bonus from config
    const signupBonusConfig = await AppConfig.findOne({ key: 'signupBonus' });
    const signupBonus = signupBonusConfig ? signupBonusConfig.value : 50;

    // Create new user
    const user = await User.create({
      phoneNumber,
      password,
      referralCode: referralCodeGenerated,
      referredBy: referralCode || null,
      bonusCash: signupBonus // Welcome bonus from config
    });

    // If referred by someone, add bonus to referrer
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        referrer.referralEarnings += 25;
        referrer.bonusCash += 25;
        referrer.referredUsers.push(user._id);
        await referrer.save();
      }
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        depositCash: user.depositCash,
        winningCash: user.winningCash,
        bonusCash: user.bonusCash,
        totalBalance: user.getTotalBalance(),
        isKYCVerified: user.isKYCVerified,
        kycDetails: user.kycDetails
      }
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Failed to register', error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({ message: 'Phone number and password are required' });
    }

    // Find user by phone number
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ 
        message: 'Your account has been blocked. Please contact support for assistance.' 
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        depositCash: user.depositCash,
        winningCash: user.winningCash,
        bonusCash: user.bonusCash,
        totalBalance: user.getTotalBalance(),
        isKYCVerified: user.isKYCVerified,
        kycDetails: user.kycDetails
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Failed to login', error: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');
    
    res.status(200).json({
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        depositCash: user.depositCash,
        winningCash: user.winningCash,
        bonusCash: user.bonusCash,
        totalBalance: user.getTotalBalance(),
        totalCoinsWon: user.totalCoinsWon,
        totalWithdrawal: user.totalWithdrawal,
        totalGamesPlayed: user.totalGamesPlayed,
        totalGamesWon: user.totalGamesWon,
        totalGamesLost: user.totalGamesLost,
        referralEarnings: user.referralEarnings,
        referredUsers: user.referredUsers.length,
        isKYCVerified: user.isKYCVerified,
        kycStatus: user.kycDetails?.status || 'not_submitted',
        kycDetails: user.kycDetails,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ message: 'Failed to get user profile', error: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ message: 'Failed to logout', error: error.message });
  }
};
