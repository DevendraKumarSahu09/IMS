const mongoose = require('mongoose');

// Test script to check payments in database
async function testPayments() {
  try {
    // Connect to MongoDB (you'll need to set MONGO_URI environment variable)
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://devendra:devendra123@cluster0.8qjqj.mongodb.net/insurance_management?retryWrites=true&w=majority';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Import Payment model
    const Payment = require('./src/models/Payment');
    
    // Find all payments
    console.log('Fetching all payments...');
    const payments = await Payment.find({}).populate('userPolicyId');
    
    console.log(`Found ${payments.length} payments:`);
    console.log(JSON.stringify(payments, null, 2));
    
    // Find payments for specific user
    const userId = '68d63f3014baaf58854c27d0'; // Customer ID from your database record
    console.log(`\nFetching payments for user ${userId}...`);
    const userPayments = await Payment.find({ userId }).populate('userPolicyId');
    
    console.log(`Found ${userPayments.length} payments for user:`);
    console.log(JSON.stringify(userPayments, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPayments();
