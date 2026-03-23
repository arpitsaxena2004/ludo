import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  entryFee: {
    type: Number,
    required: true,
    min: 10
  },
  prizePool: {
    type: Number,
    required: true
  },
  maxPlayers: {
    type: Number,
    default: 2
  },
  currentPlayers: {
    type: Number,
    default: 1
  },
  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    winScreenshot: {
      type: String,
      default: null
    },
    uploadedAt: {
      type: Date,
      default: null
    },
    result: {
      type: String,
      enum: ['won', 'lost', null],
      default: null
    },
    resultSubmittedAt: {
      type: Date,
      default: null
    }
  }],
  status: {
    type: String,
    enum: ['waiting', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'],
    default: 'waiting'
  },
  gameRoomCode: {
    type: String,
    default: null
  },
  gameRoomCodeSetAt: {
    type: Date,
    default: null
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  commissionRate: {
    type: Number,
    default: 5
  }
}, {
  timestamps: true
});

// Index for faster queries
gameSchema.index({ status: 1, createdAt: -1 });
gameSchema.index({ roomCode: 1 });

const Game = mongoose.model('Game', gameSchema);

export default Game;
