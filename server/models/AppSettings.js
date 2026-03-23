import mongoose from 'mongoose';

const appSettingsSchema = new mongoose.Schema({
  settingKey: {
    type: String,
    unique: true,
    required: true
  },
  settingValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['general', 'payment', 'game', 'referral', 'kyc', 'support'],
    default: 'general'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

const AppSettings = mongoose.model('AppSettings', appSettingsSchema);

export default AppSettings;
