const mongoose = require('mongoose');

const userPolicySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  policyProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  premiumPaid: { type: Number, required: true },
  status: { type: String, enum: ['ACTIVE', 'CANCELLED', 'EXPIRED'], default: 'ACTIVE' },
  assignedAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  nominee: {
    name: { type: String, required: true },
    relation: { type: String, required: true }
  }
}, { timestamps: true });

// Add indexes for performance optimization
userPolicySchema.index({ userId: 1 }); // For user-specific queries
userPolicySchema.index({ policyProductId: 1 }); // For policy-specific queries
userPolicySchema.index({ status: 1 }); // For status-based queries
userPolicySchema.index({ assignedAgentId: 1 }); // For agent assignment queries
userPolicySchema.index({ createdAt: -1 }); // For sorting by creation date
userPolicySchema.index({ userId: 1, status: 1 }); // Compound index for user's active policies

module.exports = mongoose.model('UserPolicy', userPolicySchema);
