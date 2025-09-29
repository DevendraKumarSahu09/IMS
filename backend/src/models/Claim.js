const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userPolicyId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPolicy', required: true },
  incidentDate: { type: Date, required: true },
  description: { type: String, required: true },
  amountClaimed: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  decisionNotes: String,
  assignedAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Agent assigned to handle the claim
  decidedByAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Agent who made the final decision
}, { timestamps: true });

// Add indexes for performance optimization
claimSchema.index({ userId: 1 }); // For user-specific queries
claimSchema.index({ userPolicyId: 1 }); // For policy-specific queries
claimSchema.index({ status: 1 }); // For status-based queries
claimSchema.index({ assignedAgentId: 1 }); // For agent assignment queries
claimSchema.index({ decidedByAgentId: 1 }); // For agent decision queries
claimSchema.index({ createdAt: -1 }); // For sorting by creation date
claimSchema.index({ userId: 1, status: 1 }); // Compound index for user's claims by status
claimSchema.index({ assignedAgentId: 1, status: 1 }); // Compound index for agent's assigned claims by status

module.exports = mongoose.model('Claim', claimSchema);
