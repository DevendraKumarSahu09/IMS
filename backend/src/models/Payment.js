const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userPolicyId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPolicy', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['CARD', 'NETBANKING', 'OFFLINE', 'SIMULATED'], required: true },
  reference: { type: String, required: true }
}, { timestamps: true });

// Add indexes for performance optimization
paymentSchema.index({ userId: 1 }); // For user-specific queries
paymentSchema.index({ userPolicyId: 1 }); // For policy-specific queries
paymentSchema.index({ method: 1 }); // For payment method queries
paymentSchema.index({ createdAt: -1 }); // For sorting by creation date
paymentSchema.index({ userId: 1, createdAt: -1 }); // Compound index for user's payments by date

module.exports = mongoose.model('Payment', paymentSchema);
