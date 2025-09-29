const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./src/models/User');
const Policy = require('./src/models/Policy');
const UserPolicy = require('./src/models/UserPolicy');
const Claim = require('./src/models/Claim');

async function setupCompleteProject() {
  try {
    console.log('🚀 Setting up complete Insurance Management System...');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/insurance_management');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Policy.deleteMany({});
    await UserPolicy.deleteMany({});
    await Claim.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'Admin User',
      email: 'admin@insurance.com',
      passwordHash: adminPassword,
      role: 'admin'
    });
    await admin.save();
    console.log('✅ Created admin user:', admin.email);

    // Create agent user
    const agentPassword = await bcrypt.hash('agent123', 10);
    const agent = new User({
      name: 'Agent User',
      email: 'agent@insurance.com',
      passwordHash: agentPassword,
      role: 'agent'
    });
    await agent.save();
    console.log('✅ Created agent user:', agent.email);

    // Create customer user
    const customerPassword = await bcrypt.hash('customer123', 10);
    const customer = new User({
      name: 'John Doe',
      email: 'customer@insurance.com',
      passwordHash: customerPassword,
      role: 'customer'
    });
    await customer.save();
    console.log('✅ Created customer user:', customer.email);

    // Create sample policies
    const policies = [
      {
        code: 'HEALTH-001',
        title: 'Health Insurance Premium',
        description: 'Comprehensive health coverage for individuals and families',
        premium: 5000,
        termMonths: 12,
        minSumInsured: 500000
      },
      {
        code: 'AUTO-001',
        title: 'Auto Insurance',
        description: 'Complete auto insurance coverage including collision and comprehensive',
        premium: 3000,
        termMonths: 12,
        minSumInsured: 300000
      },
      {
        code: 'LIFE-001',
        title: 'Life Insurance',
        description: 'Term life insurance with flexible coverage options',
        premium: 2000,
        termMonths: 12,
        minSumInsured: 1000000
      }
    ];

    const createdPolicies = [];
    for (const policyData of policies) {
      const policy = new Policy(policyData);
      await policy.save();
      createdPolicies.push(policy);
      console.log(`✅ Created policy: ${policy.title}`);
    }

    // Create user policies for customer
    const userPolicies = [
      {
        userId: customer._id,
        policyProductId: createdPolicies[0]._id,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-01-01'),
        premiumPaid: 5000,
        status: 'ACTIVE',
        nominee: {
          name: 'Jane Doe',
          relation: 'spouse'
        }
      },
      {
        userId: customer._id,
        policyProductId: createdPolicies[1]._id,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2025-06-01'),
        premiumPaid: 3000,
        status: 'ACTIVE',
        nominee: {
          name: 'John Doe Jr',
          relation: 'son'
        }
      }
    ];

    const createdUserPolicies = [];
    for (const userPolicyData of userPolicies) {
      const userPolicy = new UserPolicy(userPolicyData);
      await userPolicy.save();
      createdUserPolicies.push(userPolicy);
      console.log(`✅ Created user policy: ${userPolicyData.policyProductId}`);
    }

    // Create sample claims
    const claims = [
      {
        userId: customer._id,
        userPolicyId: createdUserPolicies[0]._id,
        incidentDate: new Date('2024-08-15'),
        description: 'Medical emergency - hospitalization',
        amountClaimed: 25000,
        status: 'PENDING'
      },
      {
        userId: customer._id,
        userPolicyId: createdUserPolicies[1]._id,
        incidentDate: new Date('2024-09-10'),
        description: 'Car accident - minor damage',
        amountClaimed: 15000,
        status: 'APPROVED'
      }
    ];

    for (const claimData of claims) {
      const claim = new Claim(claimData);
      await claim.save();
      console.log(`✅ Created claim: ${claim.description}`);
    }

    console.log('\n🎉 Complete setup finished successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@insurance.com / admin123');
    console.log('Agent: agent@insurance.com / agent123');
    console.log('Customer: customer@insurance.com / customer123');
    console.log('\n📊 Created:');
    console.log('- 3 Users (admin, agent, customer)');
    console.log('- 3 Policies');
    console.log('- 2 User Policies (active)');
    console.log('- 2 Sample Claims');
    console.log('\n✅ Your capstone project is ready!');

    process.exit(0);

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupCompleteProject();
