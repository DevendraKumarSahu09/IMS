// Working tests to demonstrate backend functionality
const request = require('supertest');
const app = require('../index');

describe('Working Backend Tests', () => {
  test('should start server and respond to basic requests', async () => {
    const response = await request(app)
      .get('/api/v1/policies')
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('should handle CORS properly', async () => {
    const response = await request(app)
      .get('/api/v1/policies')
      .expect(200);
    
    expect(response.headers['access-control-allow-origin']).toBe('*');
  });

  test('should return 404 for non-existent endpoints', async () => {
    const response = await request(app)
      .get('/api/v1/nonexistent')
      .expect(404);
    
    expect(response.body).toBeDefined();
  });

  test('should handle invalid JSON gracefully', async () => {
    const response = await request(app)
      .post('/api/v1/policies')
      .set('Content-Type', 'application/json')
      .send('invalid json')
      .expect(400);
    
    expect(response.body).toBeDefined();
  });

  test('should have proper error handling', async () => {
    const response = await request(app)
      .get('/api/v1/policies/invalid-id')
      .expect(404);
    
    expect(response.body).toHaveProperty('error');
  });
});
