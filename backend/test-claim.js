const mongoose = require('mongoose');
const Claim = require('./src/models/Claim');
const UserPolicy = require('./src/models/UserPolicy');
const User = require('./src/models/User');

// Test claim creation
async function testClaimCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/insurance_management');
    console.log('Connected to MongoDB');

    // Find a user
    const user = await User.findOne({ role: 'customer' });
    if (!user) {
      console.log('No customer found. Creating one...');
      const newUser = new User({
        name: 'Test Customer',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'customer'
      });
      await newUser.save();
      console.log('Created test user:', newUser._id);
    }

    // Find or create a policy
    const Policy = require('./src/models/Policy');
    let policy = await Policy.findOne();
    if (!policy) {
      policy = new Policy({
        code: 'TEST-001',
        title: 'Test Policy',
        description: 'Test Description',
        premium: 1000,
        termMonths: 12,
        minSumInsured: 100000
      });
      await policy.save();
      console.log('Created test policy:', policy._id);
    }

    // Find or create a user policy
    let userPolicy = await UserPolicy.findOne({ userId: user._id });
    if (!userPolicy) {
      userPolicy = new UserPolicy({
        userId: user._id,
        policyProductId: policy._id,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-01-01'),
        premiumPaid: 1000,
        status: 'ACTIVE',
        nominee: {
          name: 'Test Nominee',
          relation: 'spouse'
        }
      });
      await userPolicy.save();
      console.log('Created test user policy:', userPolicy._id);
    }

    // Test claim creation
    const testClaim = new Claim({
      userId: user._id,
      userPolicyId: userPolicy._id,
      incidentDate: new Date('2024-06-15'),
      description: 'Test claim description',
      amountClaimed: 5000
    });

    const savedClaim = await testClaim.save();
    console.log('✅ Claim created successfully:', savedClaim);

    // Test the claim service
    const claimService = require('./src/services/claimService');
    const serviceClaim = await claimService.createClaim(user._id, {
      userPolicyId: userPolicy._id,
      incidentDate: '2024-06-15',
      description: 'Service test claim',
      amountClaimed: 3000
    });
    console.log('✅ Service claim created successfully:', serviceClaim);

    console.log('🎉 All tests passed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testClaimCreation();
