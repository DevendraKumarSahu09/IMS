#!/usr/bin/env node

/**
 * Backend Testing Script
 * This script helps you test your backend implementation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Insurance Management System - Backend Testing\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('❌ .env file not found!');
  console.log('📝 Please copy env.example to .env and configure your environment variables:');
  console.log('   cp env.example .env');
  console.log('   # Edit .env with your MongoDB URI and JWT secret\n');
  process.exit(1);
}

// Check if MongoDB is running
console.log('🔍 Checking MongoDB connection...');
try {
  execSync('mongosh --eval "db.runCommand({ping: 1})" --quiet', { stdio: 'pipe' });
  console.log('✅ MongoDB is running\n');
} catch (error) {
  console.log('❌ MongoDB is not running or not accessible');
  console.log('📝 Please start MongoDB and ensure it\'s accessible\n');
  process.exit(1);
}

// Check if dependencies are installed
console.log('📦 Checking dependencies...');
if (!fs.existsSync('node_modules')) {
  console.log('📥 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed\n');
  } catch (error) {
    console.log('❌ Failed to install dependencies');
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies are installed\n');
}

// Run linting
console.log('🔍 Running ESLint...');
try {
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('✅ Code linting passed\n');
} catch (error) {
  console.log('❌ Code linting failed');
  console.log('📝 Please fix the linting errors before running tests\n');
  process.exit(1);
}

// Run tests
console.log('🧪 Running unit tests...');
try {
  execSync('npm test', { stdio: 'inherit' });
  console.log('✅ All tests passed!\n');
} catch (error) {
  console.log('❌ Some tests failed');
  console.log('📝 Please check the test output above for details\n');
  process.exit(1);
}

// Run test coverage
console.log('📊 Running test coverage...');
try {
  execSync('npm run test:coverage', { stdio: 'inherit' });
  console.log('✅ Test coverage generated\n');
} catch (error) {
  console.log('❌ Test coverage failed');
  console.log('📝 Please check the coverage output above for details\n');
}

console.log('🎉 Backend testing completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Start the backend server: npm run dev');
console.log('2. Import the Postman collection for manual testing');
console.log('3. Check the TESTING_GUIDE.md for detailed instructions');
console.log('4. Review the coverage report in coverage/ directory');
console.log('\n🚀 Your backend is ready for frontend development!');
