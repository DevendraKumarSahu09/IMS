const request = require('supertest');
const app = require('../index');
const Policy = require('../models/Policy');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Policy Tests', () => {
  let authToken;
  let userId;
  let policyId;

  beforeAll(async () => {
    // Create a test user and get auth token
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = new User({
      name: 'Test Customer',
      email: 'customer@test.com',
      passwordHash: hashedPassword,
      role: 'customer'
    });
    await user.save();
    userId = user._id;

    authToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create a test policy
    const policy = new Policy({
      code: 'TEST001',
      title: 'Test Health Insurance',
      description: 'Test policy for unit testing',
      premium: 5000,
      termMonths: 12,
      minSumInsured: 100000
    });
    await policy.save();
    policyId = policy._id;
  });

  describe('GET /api/v1/policies', () => {
    test('should return list of policies (public endpoint)', async () => {
      const response = await request(app)
        .get('/api/v1/policies')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('_id');
      expect(response.body[0]).toHaveProperty('title');
    });

    test('should return specific policy by ID', async () => {
      // Create a fresh policy for this test
      const testPolicy = new Policy({
        code: 'TEST002',
        title: 'Test Health Insurance',
        description: 'Test policy for unit testing',
        premium: 5000,
        termMonths: 12,
        minSumInsured: 100000
      });
      const savedPolicy = await testPolicy.save();

      const response = await request(app)
        .get(`/api/v1/policies/${savedPolicy._id}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id', savedPolicy._id.toString());
      expect(response.body).toHaveProperty('title', 'Test Health Insurance');
    });

    test('should return 404 for non-existent policy', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/v1/policies/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Policy not found');
    });
  });

  describe('POST /api/v1/policies/:id/purchase', () => {
    test('should purchase a policy with valid data', async () => {
      // Create a fresh user and policy for this test
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testUser = new User({
        name: 'Purchase Test User',
        email: 'purchase@test.com',
        passwordHash: hashedPassword,
        role: 'customer'
      });
      await testUser.save();

      const testToken = jwt.sign(
        { id: testUser._id, role: testUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const testPolicy = new Policy({
        code: 'PURCHASE001',
        title: 'Purchase Test Policy',
        description: 'Policy for purchase testing',
        premium: 3000,
        termMonths: 6,
        minSumInsured: 75000
      });
      const savedPolicy = await testPolicy.save();

      const policyData = {
        startDate: '2025-01-01',
        termMonths: 12,
        nominee: {
          name: 'Test Nominee',
          relation: 'spouse'
        }
      };

      const response = await request(app)
        .post(`/api/v1/policies/${savedPolicy._id}/purchase`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(policyData)
        .expect(201);

      expect(response.body).toHaveProperty('userId', testUser._id.toString());
      expect(response.body).toHaveProperty('policyProductId');
      expect(response.body.policyProductId).toHaveProperty('_id', savedPolicy._id.toString());
      expect(response.body).toHaveProperty('status', 'ACTIVE');
      expect(response.body).toHaveProperty('nominee');
    });

    test('should reject invalid policy purchase data', async () => {
      const invalidData = {
        startDate: 'invalid-date',
        termMonths: -1,
        nominee: {
          name: '',
          relation: ''
        }
      };

      const response = await request(app)
        .post(`/api/v1/policies/${policyId}/purchase`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Validation failed');
    });

    test('should reject purchase without authentication', async () => {
      const policyData = {
        startDate: '2025-01-01',
        termMonths: 12,
        nominee: {
          name: 'Test Nominee',
          relation: 'spouse'
        }
      };

      const response = await request(app)
        .post(`/api/v1/policies/${policyId}/purchase`)
        .send(policyData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Authorization header missing');
    });

    test('should reject purchase with invalid token', async () => {
      const policyData = {
        startDate: '2025-01-01',
        termMonths: 12,
        nominee: {
          name: 'Test Nominee',
          relation: 'spouse'
        }
      };

      const response = await request(app)
        .post(`/api/v1/policies/${policyId}/purchase`)
        .set('Authorization', 'Bearer invalid-token')
        .send(policyData)
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Invalid or expired token');
    });
  });

  describe('POST /api/v1/policies (Admin)', () => {
    let adminToken;

    beforeAll(async () => {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        name: 'Test Admin',
        email: 'admin@test.com',
        passwordHash: hashedPassword,
        role: 'admin'
      });
      await admin.save();

      adminToken = jwt.sign(
        { id: admin._id, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    test('should create policy as admin', async () => {
      const policyData = {
        code: 'ADMIN001',
        title: 'Admin Created Policy',
        description: 'Policy created by admin',
        premium: 3000,
        termMonths: 6,
        minSumInsured: 50000
      };

      const response = await request(app)
        .post('/api/v1/policies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(policyData)
        .expect(201);

      expect(response.body).toHaveProperty('code', 'ADMIN001');
      expect(response.body).toHaveProperty('title', 'Admin Created Policy');
    });

    test('should reject policy creation by non-admin', async () => {
      const policyData = {
        code: 'CUSTOMER001',
        title: 'Customer Policy',
        description: 'Policy created by customer',
        premium: 2000,
        termMonths: 3,
        minSumInsured: 25000
      };

      const response = await request(app)
        .post('/api/v1/policies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(policyData)
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Forbidden - Insufficient Role');
    });
  });
});
