// Test setup file
const mongoose = require('mongoose');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGO_URI = 'mongodb://localhost:27017/insurance_management_test';

// Global test setup
beforeAll(async () => {
  // Connect to test database
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
});

afterAll(async () => {
  // Clean up test database
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  }
});

// Note: Individual tests should manage their own data cleanup
// The afterAll hook will clean up the entire database after all tests complete
