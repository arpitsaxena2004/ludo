import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
    index: { unique: true, sparse: true }
  },
  username: {
    type: String,
    trim: true,
    sparse: true,
    index: { unique: true, sparse: true }
  },
  avatar: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  referralCode: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
  },
  referredBy: {
    type: String,
    default: null
  },
  depositCash: {
    type: Number,
    default: 0,
    min: 0
  },
  winningCash: {
    type: Number,
    default: 0,
    min: 0
  },
  bonusCash: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCoinsWon: {
    type: Number,
    default: 0
  },
  totalWithdrawal: {
    type: Number,
    default: 0
  },
  totalGamesPlayed: {
    type: Number,
    default: 0
  },
  totalGamesWon: {
    type: Number,
    default: 0
  },
  totalGamesLost: {
    type: Number,
    default: 0
  },
  referralEarnings: {
    type: Number,
    default: 0
  },
  referredUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isKYCVerified: {
    type: Boolean,
    default: false
  },
  kycDetails: {
    fullName: String,
    dateOfBirth: Date,
    address: String,
    documentType: String,
    documentNumber: String,
    documentFront: String,
    documentBack: String,
    selfie: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: String,
    submittedAt: Date,
    verifiedAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  deviceInfo: {
    deviceId: String,
    deviceType: String,
    browser: String,
    os: String
  }
}, {
  timestamps: true
});

// Generate referral code before saving
userSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Generate referral code if not exists
  if (!this.referralCode) {
    let code;
    let isUnique = false;
    
    // Keep generating until we get a unique code
    while (!isUnique) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingUser = await this.constructor.findOne({ referralCode: code });
      if (!existingUser) {
        isUnique = true;
      }
    }
    
    this.referralCode = code;
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to calculate total balance
userSchema.methods.getTotalBalance = function() {
  return this.depositCash + this.winningCash + this.bonusCash;
};

// Method to deduct balance for game entry
userSchema.methods.deductGameEntry = async function(amount) {
  let remaining = amount;
  
  // First deduct from deposit cash
  if (this.depositCash >= remaining) {
    this.depositCash -= remaining;
    remaining = 0;
  } else {
    remaining -= this.depositCash;
    this.depositCash = 0;
  }
  
  // Then deduct from bonus cash
  if (remaining > 0 && this.bonusCash >= remaining) {
    this.bonusCash -= remaining;
    remaining = 0;
  } else if (remaining > 0) {
    remaining -= this.bonusCash;
    this.bonusCash = 0;
  }
  
  // Finally deduct from winning cash
  if (remaining > 0 && this.winningCash >= remaining) {
    this.winningCash -= remaining;
    remaining = 0;
  } else if (remaining > 0) {
    remaining -= this.winningCash;
    this.winningCash = 0;
  }
  
  await this.save();
  return remaining === 0;
};

// Method to add winning amount
userSchema.methods.addWinning = async function(amount) {
  this.winningCash += amount;
  this.totalCoinsWon += amount;
  await this.save();
};

const User = mongoose.model('User', userSchema);

export default User;
