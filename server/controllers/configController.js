import AppConfig from '../models/AppConfig.js';

// Get all configs or specific config by key
export const getConfig = async (req, res) => {
  try {
    const { key } = req.params;

    if (key) {
      const config = await AppConfig.findOne({ key });
      if (!config) {
        return res.status(404).json({ success: false, message: 'Config not found' });
      }
      return res.json({ success: true, data: config });
    }

    const configs = await AppConfig.find();
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get public configs (for client side)
export const getPublicConfig = async (req, res) => {
  try {
    const { key } = req.params;

    if (key) {
      const config = await AppConfig.findOne({ key });
      if (!config) {
        // Return default values if not found
        const defaults = {
          commissionRate: 5,
          referralBonus: 50,
          signupBonus: 50,
          noticeBoard: '⚡ 5% Commission • 3% Referral • 24/7 Withdrawal • WhatsApp Support 📞'
        };
        return res.json({ success: true, data: { key, value: defaults[key] || '' } });
      }
      return res.json({ success: true, data: config });
    }

    const configs = await AppConfig.find();
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update or create config (admin only)
export const updateConfig = async (req, res) => {
  try {
    const { key, value, description, category } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ success: false, message: 'Key and value are required' });
    }

    const config = await AppConfig.findOneAndUpdate(
      { key },
      { key, value, description, category },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: config
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete config (admin only)
export const deleteConfig = async (req, res) => {
  try {
    const { key } = req.params;

    const config = await AppConfig.findOneAndDelete({ key });
    if (!config) {
      return res.status(404).json({ success: false, message: 'Config not found' });
    }

    res.json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Initialize default configs
export const initializeDefaultConfigs = async () => {
  try {
    const defaults = [
      { key: 'commissionRate', value: 5, description: 'Game commission rate in percentage', category: 'game' },
      { key: 'referralBonus', value: 50, description: 'Referral bonus amount in rupees', category: 'referral' },
      { key: 'signupBonus', value: 50, description: 'Signup bonus amount in rupees for new users', category: 'referral' },
      { key: 'noticeBoard', value: '⚡ 5% Commission • 3% Referral • 24/7 Withdrawal • WhatsApp Support 📞', description: 'Notice board text displayed on home page', category: 'general' }
    ];

    for (const config of defaults) {
      await AppConfig.findOneAndUpdate(
        { key: config.key },
        config,
        { upsert: true, new: true }
      );
    }

    console.log('Default configurations initialized');
  } catch (error) {
    console.error('Failed to initialize default configs:', error);
  }
};
