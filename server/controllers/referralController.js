import User from '../models/User.js';

// @desc    Get referral information
// @route   GET /api/referral/info
// @access  Private
export const getReferralInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('referredUsers', 'username phoneNumber avatar createdAt');

    res.status(200).json({
      referralCode: user.referralCode,
      referralEarnings: user.referralEarnings,
      totalReferrals: user.referredUsers.length,
      referralLink: `${process.env.CLIENT_URL}/signup?ref=${user.referralCode}`
    });
  } catch (error) {
    console.error('Get Referral Info Error:', error);
    res.status(500).json({ message: 'Failed to get referral info', error: error.message });
  }
};

// @desc    Get referred users
// @route   GET /api/referral/users
// @access  Private
export const getReferredUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('referredUsers', 'username phoneNumber avatar totalGamesPlayed createdAt');

    const referredUsers = user.referredUsers.map(u => ({
      id: u._id,
      username: u.username || 'User',
      phoneNumber: u.phoneNumber,
      avatar: u.avatar,
      totalGamesPlayed: u.totalGamesPlayed,
      joinedAt: u.createdAt
    }));

    res.status(200).json({ referredUsers });
  } catch (error) {
    console.error('Get Referred Users Error:', error);
    res.status(500).json({ message: 'Failed to get referred users', error: error.message });
  }
};
