import mongoose from 'mongoose';

const paymentSettingsSchema = new mongoose.Schema({
  upiId: {
    type: String,
    default: ''
  },
  upiNumber: {
    type: String,
    default: ''
  },
  qrCode: {
    type: String,
    default: ''
  },
  minDeposit: {
    type: Number,
    default: 50
  },
  maxDeposit: {
    type: Number,
    default: 100000
  },
  minWithdrawal: {
    type: Number,
    default: 100
  },
  maxWithdrawal: {
    type: Number,
    default: 50000
  },
  isDepositEnabled: {
    type: Boolean,
    default: true
  },
  isWithdrawalEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const PaymentSettings = mongoose.model('PaymentSettings', paymentSettingsSchema);

export default PaymentSettings;
