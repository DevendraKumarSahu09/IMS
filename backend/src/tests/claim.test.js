const request = require('supertest');
const app = require('../index');
const Claim = require('../models/Claim');
const UserPolicy = require('../models/UserPolicy');
const Policy = require('../models/Policy');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Claim Tests', () => {
  // Note: Each test creates its own fresh data to avoid conflicts

  describe('POST /api/v1/claims', () => {
    test('should create a claim with valid data', async () => {
      // Create fresh test data for this test
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testCustomer = new User({
        name: 'Claim Test Customer',
        email: 'claimcustomer@test.com',
        passwordHash: hashedPassword,
        role: 'customer'
      });
      await testCustomer.save();

      const testToken = jwt.sign(
        { id: testCustomer._id, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const testPolicy = new Policy({
        code: 'CLAIMTEST001',
        title: 'Claim Test Policy',
        description: 'Policy for claim testing',
        premium: 5000,
        termMonths: 12,
        minSumInsured: 100000
      });
      await testPolicy.save();

      const testUserPolicy = new UserPolicy({
        userId: testCustomer._id,
        policyProductId: testPolicy._id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        premiumPaid: 5000,
        status: 'ACTIVE',
        nominee: {
          name: 'Test Nominee',
          relation: 'spouse'
        }
      });
      await testUserPolicy.save();

      const claimData = {
        policyId: testUserPolicy._id,
        incidentDate: '2025-06-15',
        description: 'Car accident on highway',
        amount: 25000
      };

      const response = await request(app)
        .post('/api/v1/claims')
        .set('Authorization', `Bearer ${testToken}`)
        .send(claimData)
        .expect(201);

      expect(response.body).toHaveProperty('userId', testCustomer._id.toString());
      expect(response.body).toHaveProperty('userPolicyId');
      expect(response.body.userPolicyId).toHaveProperty('_id', testUserPolicy._id.toString());
      expect(response.body).toHaveProperty('status', 'PENDING');
      expect(response.body).toHaveProperty('amountClaimed', 25000);
    });

    test('should reject claim creation without authentication', async () => {
      const claimData = {
        policyId: '507f1f77bcf86cd799439011', // Fake ID
        incidentDate: '2025-06-15',
        description: 'Car accident on highway',
        amount: 25000
      };

      const response = await request(app)
        .post('/api/v1/claims')
        .send(claimData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Authorization header missing');
    });

    test('should reject claim with invalid data', async () => {
      // Create a test user for this test
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testCustomer = new User({
        name: 'Invalid Data Customer',
        email: 'invaliddata@test.com',
        passwordHash: hashedPassword,
        role: 'customer'
      });
      await testCustomer.save();

      const testToken = jwt.sign(
        { id: testCustomer._id, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const invalidData = {
        policyId: 'invalid-id',
        incidentDate: 'invalid-date',
        description: '',
        amount: -1000
      };

      const response = await request(app)
        .post('/api/v1/claims')
        .set('Authorization', `Bearer ${testToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Validation failed');
    });

    test('should reject claim for non-existent policy', async () => {
      // Create a test user for this test
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testCustomer = new User({
        name: 'Non-existent Policy Customer',
        email: 'nonexistentpolicy@test.com',
        passwordHash: hashedPassword,
        role: 'customer'
      });
      await testCustomer.save();

      const testToken = jwt.sign(
        { id: testCustomer._id, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const claimData = {
        policyId: '507f1f77bcf86cd799439011', // Non-existent ID
        incidentDate: '2025-06-15',
        description: 'Car accident on highway',
        amount: 25000
      };

      const response = await request(app)
        .post('/api/v1/claims')
        .set('Authorization', `Bearer ${testToken}`)
        .send(claimData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Policy not found or not active');
    });
  });

  describe('GET /api/v1/claims', () => {
    test('should return claims for customer (own claims only)', async () => {
      // Create fresh test data for this test
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testCustomer = new User({
        name: 'Claims List Customer',
        email: 'claimslist@test.com',
        passwordHash: hashedPassword,
        role: 'customer'
      });
      await testCustomer.save();

      const testToken = jwt.sign(
        { id: testCustomer._id, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const testPolicy = new Policy({
        code: 'CLAIMSLIST001',
        title: 'Claims List Policy',
        description: 'Policy for claims list testing',
        premium: 5000,
        termMonths: 12,
        minSumInsured: 100000
      });
      await testPolicy.save();

      const testUserPolicy = new UserPolicy({
        userId: testCustomer._id,
        policyProductId: testPolicy._id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        premiumPaid: 5000,
        status: 'ACTIVE',
        nominee: {
          name: 'Test Nominee',
          relation: 'spouse'
        }
      });
      await testUserPolicy.save();

      // Create a claim for this customer
      const testClaim = new Claim({
        userId: testCustomer._id,
        userPolicyId: testUserPolicy._id,
        incidentDate: new Date('2025-06-15'),
        description: 'Test incident',
        amountClaimed: 15000
      });
      await testClaim.save();

      const response = await request(app)
        .get('/api/v1/claims')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('userId');
      expect(response.body[0].userId._id.toString()).toBe(testCustomer._id.toString());
    });

    test('should return all claims for agent', async () => {
      // Create a test agent for this test
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testAgent = new User({
        name: 'Claims List Agent',
        email: 'claimslistagent@test.com',
        passwordHash: hashedPassword,
        role: 'agent'
      });
      await testAgent.save();

      const testAgentToken = jwt.sign(
        { id: testAgent._id, role: 'agent' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/v1/claims')
        .set('Authorization', `Bearer ${testAgentToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should return all claims for admin', async () => {
      // Create a test admin for this test
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testAdmin = new User({
        name: 'Test Admin',
        email: 'testadmin@test.com',
        passwordHash: hashedPassword,
        role: 'admin'
      });
      await testAdmin.save();

      const testAdminToken = jwt.sign(
        { id: testAdmin._id, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/v1/claims')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should reject access without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/claims')
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Authorization header missing');
    });
  });

  describe('GET /api/v1/claims/:id', () => {
    test('should return specific claim for customer (own claim)', async () => {
      // Create fresh test data for this test
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testCustomer = new User({
        name: 'Claim Detail Customer',
        email: 'claimdetail@test.com',
        passwordHash: hashedPassword,
        role: 'customer'
      });
      await testCustomer.save();

      const testToken = jwt.sign(
        { id: testCustomer._id, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const testPolicy = new Policy({
        code: 'CLAIMDETAIL001',
        title: 'Claim Detail Policy',
        description: 'Policy for claim detail testing',
        premium: 5000,
        termMonths: 12,
        minSumInsured: 100000
      });
      await testPolicy.save();

      const testUserPolicy = new UserPolicy({
        userId: testCustomer._id,
        policyProductId: testPolicy._id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        premiumPaid: 5000,
        status: 'ACTIVE',
        nominee: {
          name: 'Test Nominee',
          relation: 'spouse'
        }
      });
      await testUserPolicy.save();

      // Create a claim for this customer
      const testClaim = new Claim({
        userId: testCustomer._id,
        userPolicyId: testUserPolicy._id,
        incidentDate: new Date('2025-06-15'),
        description: 'Test incident for detail',
        amountClaimed: 20000
      });
      await testClaim.save();

      const response = await request(app)
        .get(`/api/v1/claims/${testClaim._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id', testClaim._id.toString());
      expect(response.body).toHaveProperty('userId');
      expect(response.body.userId._id.toString()).toBe(testCustomer._id.toString());
    });

    test('should return specific claim for agent', async () => {
      // Create fresh test data for this test
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testCustomer = new User({
        name: 'Agent View Customer',
        email: 'agentview@test.com',
        passwordHash: hashedPassword,
        role: 'customer'
      });
      await testCustomer.save();

      const testAgent = new User({
        name: 'Agent View Test Agent',
        email: 'agentviewtest@test.com',
        passwordHash: hashedPassword,
        role: 'agent'
      });
      await testAgent.save();

      const testAgentToken = jwt.sign(
        { id: testAgent._id, role: 'agent' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const testPolicy = new Policy({
        code: 'AGENTVIEW001',
        title: 'Agent View Policy',
        description: 'Policy for agent view testing',
        premium: 5000,
        termMonths: 12,
        minSumInsured: 100000
      });
      await testPolicy.save();

      const testUserPolicy = new UserPolicy({
        userId: testCustomer._id,
        policyProductId: testPolicy._id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        premiumPaid: 5000,
        status: 'ACTIVE',
        nominee: {
          name: 'Test Nominee',
          relation: 'spouse'
        }
      });
      await testUserPolicy.save();

      // Create a claim for this customer
      const testClaim = new Claim({
        userId: testCustomer._id,
        userPolicyId: testUserPolicy._id,
        incidentDate: new Date('2025-06-15'),
        description: 'Test incident for agent view',
        amountClaimed: 25000
      });
      await testClaim.save();

      const response = await request(app)
        .get(`/api/v1/claims/${testClaim._id}`)
        .set('Authorization', `Bearer ${testAgentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id', testClaim._id.toString());
    });

    test('should return 404 for non-existent claim', async () => {
      // Create a test user for this test
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testCustomer = new User({
        name: '404 Test Customer',
        email: '404test@test.com',
        passwordHash: hashedPassword,
        role: 'customer'
      });
      await testCustomer.save();

      const testToken = jwt.sign(
        { id: testCustomer._id, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/v1/claims/${fakeId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Claim not found');
    });
  });

  describe('PUT /api/v1/claims/:id/status', () => {
    test('should update claim status as agent', async () => {
      // Create fresh test data for this test
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testCustomer = new User({
        name: 'Status Update Customer',
        email: 'statusupdate@test.com',
        passwordHash: hashedPassword,
        role: 'customer'
      });
      await testCustomer.save();

      const testAgent = new User({
        name: 'Status Update Agent',
        email: 'statusagent@test.com',
        passwordHash: hashedPassword,
        role: 'agent'
      });
      await testAgent.save();

      const testAgentToken = jwt.sign(
        { id: testAgent._id, role: 'agent' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const testPolicy = new Policy({
        code: 'STATUSUPDATE001',
        title: 'Status Update Policy',
        description: 'Policy for status update testing',
        premium: 5000,
        termMonths: 12,
        minSumInsured: 100000
      });
      await testPolicy.save();

      const testUserPolicy = new UserPolicy({
        userId: testCustomer._id,
        policyProductId: testPolicy._id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        premiumPaid: 5000,
        status: 'ACTIVE',
        nominee: {
          name: 'Test Nominee',
          relation: 'spouse'
        }
      });
      await testUserPolicy.save();

      // Create a claim for this customer
      const testClaim = new Claim({
        userId: testCustomer._id,
        userPolicyId: testUserPolicy._id,
        incidentDate: new Date('2025-06-15'),
        description: 'Test incident for status update',
        amountClaimed: 30000
      });
      await testClaim.save();

      const updateData = {
        status: 'APPROVED',
        notes: 'Claim approved after verification'
      };

      const response = await request(app)
        .put(`/api/v1/claims/${testClaim._id}/status`)
        .set('Authorization', `Bearer ${testAgentToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'APPROVED');
      expect(response.body).toHaveProperty('decisionNotes', 'Claim approved after verification');
      expect(response.body).toHaveProperty('decidedByAgentId');
      expect(response.body.decidedByAgentId).toHaveProperty('_id', testAgent._id.toString());
    });

    test('should update claim status as admin', async () => {
      // Create fresh test data for this test
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testCustomer = new User({
        name: 'Admin Status Customer',
        email: 'adminstatus@test.com',
        passwordHash: hashedPassword,
        role: 'customer'
      });
      await testCustomer.save();

      const testAdmin = new User({
        name: 'Status Update Admin',
        email: 'statusadmin@test.com',
        passwordHash: hashedPassword,
        role: 'admin'
      });
      await testAdmin.save();

      const testAdminToken = jwt.sign(
        { id: testAdmin._id, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const testPolicy = new Policy({
        code: 'ADMINSTATUS001',
        title: 'Admin Status Policy',
        description: 'Policy for admin status testing',
        premium: 5000,
        termMonths: 12,
        minSumInsured: 100000
      });
      await testPolicy.save();

      const testUserPolicy = new UserPolicy({
        userId: testCustomer._id,
        policyProductId: testPolicy._id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        premiumPaid: 5000,
        status: 'ACTIVE',
        nominee: {
          name: 'Test Nominee',
          relation: 'spouse'
        }
      });
      await testUserPolicy.save();

      // Create a claim for this customer
      const testClaim = new Claim({
        userId: testCustomer._id,
        userPolicyId: testUserPolicy._id,
        incidentDate: new Date('2025-08-01'),
        description: 'Test incident for admin status update',
        amountClaimed: 10000
      });
      await testClaim.save();

      const updateData = {
        status: 'REJECTED',
        notes: 'Claim rejected due to insufficient documentation'
      };

      const response = await request(app)
        .put(`/api/v1/claims/${testClaim._id}/status`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'REJECTED');
      expect(response.body).toHaveProperty('decisionNotes', 'Claim rejected due to insufficient documentation');
      expect(response.body).toHaveProperty('decidedByAgentId');
      expect(response.body.decidedByAgentId).toHaveProperty('_id', testAdmin._id.toString());
    });

    test('should reject status update by customer', async () => {
      // Create a test customer for this test
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testCustomer = new User({
        name: 'Status Update Customer',
        email: 'statusupdatecustomer@test.com',
        passwordHash: hashedPassword,
        role: 'customer'
      });
      await testCustomer.save();

      const testToken = jwt.sign(
        { id: testCustomer._id, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const updateData = {
        status: 'APPROVED',
        notes: 'Self approval'
      };

      const fakeClaimId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/v1/claims/${fakeClaimId}/status`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Forbidden - Insufficient Role');
    });

    test('should reject invalid status', async () => {
      // Create a test agent for this test
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testAgent = new User({
        name: 'Invalid Status Agent',
        email: 'invalidstatusagent@test.com',
        passwordHash: hashedPassword,
        role: 'agent'
      });
      await testAgent.save();

      const testAgentToken = jwt.sign(
        { id: testAgent._id, role: 'agent' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const updateData = {
        status: 'INVALID_STATUS',
        notes: 'Invalid status test'
      };

      const fakeClaimId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/v1/claims/${fakeClaimId}/status`)
        .set('Authorization', `Bearer ${testAgentToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Validation failed');
    });

    test('should reject status update without authentication', async () => {
      const updateData = {
        status: 'APPROVED',
        notes: 'No auth test'
      };

      const fakeClaimId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/v1/claims/${fakeClaimId}/status`)
        .send(updateData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Authorization header missing');
    });
  });
});
