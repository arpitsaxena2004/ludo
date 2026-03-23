import mongoose from 'mongoose';

const supportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ticketId: {
    type: String,
    unique: true,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['payment', 'game', 'kyc', 'account', 'technical', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  messages: [{
    sender: {
      type: String,
      enum: ['user', 'admin'],
      required: true
    },
    senderName: String,
    message: {
      type: String,
      required: true
    },
    attachments: [String],
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  resolvedAt: Date,
  closedAt: Date
}, {
  timestamps: true
});

// Generate ticket ID before saving
supportSchema.pre('save', async function(next) {
  if (!this.ticketId) {
    this.ticketId = `TICKET${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }
  next();
});

const Support = mongoose.model('Support', supportSchema);

export default Support;
