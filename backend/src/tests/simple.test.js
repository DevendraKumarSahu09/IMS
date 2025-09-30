// Simple test to verify basic functionality
const request = require('supertest');
const app = require('../index');

describe('Basic API Tests', () => {
  test('should return 404 for non-existent endpoint', async () => {
    const response = await request(app)
      .get('/api/v1/nonexistent')
      .expect(404);
    
    expect(response.body).toBeDefined();
  });

  test('should have CORS enabled', async () => {
    const response = await request(app)
      .get('/api/v1/policies')
      .expect(200);
    
    expect(response.headers['access-control-allow-origin']).toBe('*');
  });

  test('should return policies list', async () => {
    const response = await request(app)
      .get('/api/v1/policies')
      .expect(200);
    
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
