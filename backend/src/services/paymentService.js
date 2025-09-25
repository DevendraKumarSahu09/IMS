const Payment = require('../models/Payment');
const UserPolicy = require('../models/UserPolicy');

/**
 * Payment Service - Business logic for payment operations
 * This service handles all business logic related to payments
 */

class PaymentService {
  /**
   * Get payments with role-based filtering
   * @param {string} userId - The user ID
   * @param {string} userRole - The user role
   * @returns {Promise<Array>} Array of payments
   */
  async getPayments(userId, userRole) {
    try {
      const filter = {};
      if (userRole === 'customer') {
        filter.userId = userId;
      }

      return await Payment.find(filter)
        .populate('userPolicyId')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to fetch payments: ${error.message}`);
    }
  }

  /**
   * Get payments for a specific user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} Array of user payments
   */
  async getUserPayments(userId) {
    try {
      return await Payment.find({ userId })
        .populate('userPolicyId')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to fetch user payments: ${error.message}`);
    }
  }

  /**
   * Get a specific payment by ID with authorization check
   * @param {string} paymentId - The payment ID
   * @param {string} userId - The user ID
   * @param {string} userRole - The user role
   * @returns {Promise<Object>} Payment object
   */
  async getPaymentById(paymentId, userId, userRole) {
    try {
      const payment = await Payment.findById(paymentId)
        .populate('userPolicyId')
        .populate('userId', 'name email');

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Check authorization
      if (userRole === 'customer' && payment.userId._id.toString() !== userId) {
        throw new Error('Access denied');
      }

      return payment;
    } catch (error) {
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }
  }

  /**
   * Create a new payment
   * @param {string} userId - The user ID
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Created payment
   */
  async createPayment(userId, paymentData) {
    try {
      const { policyId, amount, method, reference } = paymentData;

      // Validate that the user owns the policy
      const userPolicy = await UserPolicy.findOne({
        _id: policyId,
        userId: userId
      });

      if (!userPolicy) {
        throw new Error('Policy not found or access denied');
      }

      // Validate payment amount
      if (amount <= 0) {
        throw new Error('Payment amount must be positive');
      }

      // Validate payment method
      const validMethods = ['CARD', 'NETBANKING', 'OFFLINE', 'SIMULATED'];
      if (!validMethods.includes(method)) {
        throw new Error('Invalid payment method');
      }

      // Simulate payment processing (as per requirements)
      const paymentResult = await this.simulatePaymentProcessing(amount, method, reference);

      if (!paymentResult.success) {
        throw new Error(`Payment failed: ${paymentResult.reason}`);
      }

      const payment = new Payment({
        userId,
        userPolicyId: policyId,
        amount,
        method,
        reference
      });

      const saved = await payment.save();
      await saved.populate('userPolicyId');

      return saved;
    } catch (error) {
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  /**
   * Simulate payment processing (as per requirements)
   * @param {number} amount - Payment amount
   * @param {string} method - Payment method
   * @param {string} reference - Payment reference
   * @returns {Promise<Object>} Payment result
   */
  async simulatePaymentProcessing(amount, method, reference) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate different success rates based on method
    const successRates = {
      'CARD': 0.95,
      'NETBANKING': 0.90,
      'OFFLINE': 0.85,
      'SIMULATED': 1.0
    };

    const successRate = successRates[method] || 0.8;
    const isSuccess = Math.random() < successRate;

    if (isSuccess) {
      return {
        success: true,
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: 'Payment processed successfully'
      };
    } else {
      return {
        success: false,
        reason: 'Payment gateway timeout or insufficient funds'
      };
    }
  }

  /**
   * Get payment statistics for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} Payment statistics
   */
  async getPaymentStats(userId) {
    try {
      const stats = await Payment.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            averageAmount: { $avg: '$amount' }
          }
        }
      ]);

      return stats[0] || {
        totalPayments: 0,
        totalAmount: 0,
        averageAmount: 0
      };
    } catch (error) {
      throw new Error(`Failed to fetch payment stats: ${error.message}`);
    }
  }
}

module.exports = new PaymentService();
