import mongoose from 'mongoose';

const appConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['game', 'payment', 'general', 'referral'],
    default: 'general'
  }
}, {
  timestamps: true
});

const AppConfig = mongoose.model('AppConfig', appConfigSchema);

export default AppConfig;
