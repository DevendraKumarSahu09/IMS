const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const UserPolicy = require('../models/UserPolicy');
const Claim = require('../models/Claim');
const Payment = require('../models/Payment');

router.use(authenticateJWT);

// Get dashboard statistics for users
router.get('/stats', authorizeRoles('customer', 'agent', 'admin'), async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let filter = {};
    if (userRole === 'customer') {
      filter.userId = userId;
    }

    // Get user policies
    const userPolicies = await UserPolicy.find(filter)
      .populate('policyProductId')
      .populate('userId', 'name email');

    // Get claims
    const claims = await Claim.find(filter)
      .populate('userPolicyId')
      .populate('policyProductId');

    // Get payments
    const payments = await Payment.find(filter)
      .populate('userPolicyId')
      .populate('userId', 'name email');

    // Calculate statistics
    const activePolicies = userPolicies.filter(policy => 
      policy.status === 'ACTIVE' || policy.status === 'active'
    ).length;

    const totalCoverage = userPolicies
      .filter(policy => policy.status === 'ACTIVE' || policy.status === 'active')
      .reduce((total, policy) => {
        return total + (policy.policyProductId?.coverageAmount || 0);
      }, 0);

    const pendingClaims = claims.filter(claim => 
      claim.status === 'PENDING' || claim.status === 'pending'
    ).length;

    const monthlyPremium = userPolicies
      .filter(policy => policy.status === 'ACTIVE' || policy.status === 'active')
      .reduce((total, policy) => {
        return total + (policy.premiumPaid || 0);
      }, 0);

    const totalPayments = payments.reduce((total, payment) => {
      return total + (payment.amount || 0);
    }, 0);

    const recentClaims = claims
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const recentPolicies = userPolicies
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        stats: {
          activePolicies,
          totalCoverage,
          pendingClaims,
          monthlyPremium,
          totalPayments
        },
        recentClaims,
        recentPolicies,
        userPolicies: userPolicies.slice(0, 10), // Limit for dashboard
        claims: claims.slice(0, 10) // Limit for dashboard
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard statistics' 
    });
  }
});

module.exports = router;
