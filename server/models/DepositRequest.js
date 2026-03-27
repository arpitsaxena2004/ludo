import mongoose from 'mongoose';

const depositRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'gateway'],
    default: 'gateway'
  },
  orderId: {
    type: String,
    unique: true,
    sparse: true
  },
  gatewayOrderId: {
    type: String,
    default: ''
  },
  paymentUrl: {
    type: String,
    default: ''
  },
  utr: {
    type: String,
    default: ''
  },
  screenshot: {
    type: String,
    default: ''
  },
  upiTransactionId: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processing'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const DepositRequest = mongoose.model('DepositRequest', depositRequestSchema);

export default DepositRequest;
