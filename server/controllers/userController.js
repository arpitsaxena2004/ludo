import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { email, username } = req.body;
    const user = await User.findById(req.user._id);

    // Check if username is already taken by another user
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ 
        username: username.trim(),
        _id: { $ne: req.user._id }
      });
      
      if (existingUsername) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      
      user.username = username.trim();
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ 
        email: email.trim().toLowerCase(),
        _id: { $ne: req.user._id }
      });
      
      if (existingEmail) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
      
      user.email = email.trim().toLowerCase();
    }

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        username: user.username,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} is already taken` 
      });
    }
    
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// @desc    Upload avatar
// @route   POST /api/user/avatar
// @access  Private
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    const user = await User.findById(req.user._id);

    // Check if Cloudinary is configured
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      // Delete old avatar from Cloudinary if exists
      if (user.avatar && user.avatar.includes('cloudinary')) {
        try {
          const publicId = user.avatar.split('/').slice(-2).join('/').split('.')[0];
          await cloudinary.uploader.destroy(publicId);
          console.log('Old avatar deleted from Cloudinary');
        } catch (err) {
          console.log('Failed to delete old avatar:', err.message);
        }
      }

      // Upload new avatar to Cloudinary with optimization
      console.log('Uploading to Cloudinary...');
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'a2z-ludo/avatars',
        public_id: `user_${user._id}_${Date.now()}`,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
        resource_type: 'image'
      });

      console.log('Upload successful:', result.secure_url);

      // Delete temp file
      fs.unlink(req.file.path, (err) => {
        if (err) console.log('Failed to delete temp file:', err.message);
      });

      user.avatar = result.secure_url;
    } else {
      console.log('Cloudinary not configured, using placeholder');
      // Development fallback - use local file or placeholder
      user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&size=400&background=random`;
      
      // Delete temp file
      fs.unlink(req.file.path, (err) => {
        if (err) console.log('Failed to delete temp file:', err.message);
      });
    }

    await user.save();

    res.status(200).json({
      message: 'Avatar uploaded successfully',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Upload Avatar Error:', error);
    
    // Clean up temp file on error
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.log('Failed to delete temp file on error:', err.message);
      });
    }
    
    res.status(500).json({ message: 'Failed to upload avatar', error: error.message });
  }
};

// @desc    Get user statistics
// @route   GET /api/user/stats
// @access  Private
export const getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const stats = {
      totalGamesPlayed: user.totalGamesPlayed,
      totalGamesWon: user.totalGamesWon,
      totalGamesLost: user.totalGamesLost,
      winRate: user.totalGamesPlayed > 0 ? ((user.totalGamesWon / user.totalGamesPlayed) * 100).toFixed(2) : 0,
      totalCoinsWon: user.totalCoinsWon,
      totalWithdrawal: user.totalWithdrawal,
      referralEarnings: user.referralEarnings,
      referredUsers: user.referredUsers.length
    };

    res.status(200).json({ stats });
  } catch (error) {
    console.error('Get User Stats Error:', error);
    res.status(500).json({ message: 'Failed to get user stats', error: error.message });
  }
};

// @desc    Apply referral code
// @route   POST /api/user/apply-referral
// @access  Private
export const applyReferralCode = async (req, res) => {
  try {
    const { referralCode } = req.body;

    if (!referralCode) {
      return res.status(400).json({ message: 'Referral code is required' });
    }

    const user = await User.findById(req.user._id);

    // Check if user already has a referral code applied
    if (user.referredBy) {
      return res.status(400).json({ message: 'You have already applied a referral code' });
    }

    // Find the referrer
    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });

    if (!referrer) {
      return res.status(404).json({ message: 'Invalid referral code' });
    }

    // Check if user is trying to use their own code
    if (referrer._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'You cannot use your own referral code' });
    }

    // Get referral bonus from config
    const AppConfig = (await import('../models/AppConfig.js')).default;
    const referralBonusConfig = await AppConfig.findOne({ key: 'referralBonus' });
    const referralBonus = referralBonusConfig ? referralBonusConfig.value : 25;

    // Apply referral code
    user.referredBy = referralCode.toUpperCase();
    user.bonusCash += referralBonus; // Bonus for the user who applied the code
    await user.save();

    // Add bonus to referrer
    referrer.referralEarnings += referralBonus;
    referrer.bonusCash += referralBonus;
    referrer.referredUsers.push(user._id);
    await referrer.save();

    res.status(200).json({
      message: `Referral code applied successfully! You received ₹${referralBonus} bonus`,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        referredBy: user.referredBy,
        bonusCash: user.bonusCash,
        totalBalance: user.getTotalBalance()
      }
    });
  } catch (error) {
    console.error('Apply Referral Code Error:', error);
    res.status(500).json({ message: 'Failed to apply referral code', error: error.message });
  }
};
