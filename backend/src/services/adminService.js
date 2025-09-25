const User = require('../models/User');
const UserPolicy = require('../models/UserPolicy');
const Claim = require('../models/Claim');
const Payment = require('../models/Payment');

const getSummaryKPIs = async () => {
  const userCount = await User.countDocuments();
  const policiesSold = await UserPolicy.countDocuments();
  const claimsPending = await Claim.countDocuments({ status: 'PENDING' });
  const totalPayments = await Payment.aggregate([
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  return {
    userCount,
    policiesSold,
    claimsPending,
    totalPayments: totalPayments.length > 0 ? totalPayments[0].total : 0
  };
};

module.exports = {
  getSummaryKPIs
};
