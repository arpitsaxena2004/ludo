import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  heading: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    default: ''
  }
}, { _id: false });

const policySchema = new mongoose.Schema({
  policyKey: {
    type: String,
    required: true,
    unique: true,
    enum: ['privacy-policy', 'terms-conditions', 'responsible-gaming', 'tds-policy', 'refund-policy', 'about-us']
  },
  title: {
    type: String,
    required: true
  },
  sections: [sectionSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

const Policy = mongoose.model('Policy', policySchema);

export default Policy;
