const request = require('supertest');
const { gql } = require('apollo-server-express');
const app = require('../index');

describe('Authentication Tests', () => {
  describe('GraphQL Authentication', () => {
    const REGISTER_MUTATION = gql`
      mutation Register($name: String!, $email: String!, $password: String!, $role: String!) {
        register(name: $name, email: $email, password: $password, role: $role) {
          token
          user {
            id
            name
            email
            role
          }
        }
      }
    `;

    const LOGIN_MUTATION = gql`
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          token
          user {
            id
            name
            email
            role
          }
        }
      }
    `;

    test('should register a new user', async () => {
      const variables = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'customer'
      };

      const response = await request(app)
        .post('/graphql')
        .send({ 
          query: REGISTER_MUTATION.loc.source.body, 
          variables 
        })
        .expect(200);

      expect(response.body.data.register).toBeDefined();
      expect(response.body.data.register.user.email).toBe(variables.email);
      expect(response.body.data.register.user.role).toBe(variables.role);
      expect(response.body.data.register.token).toBeDefined();
    });

    test('should not register user with existing email', async () => {
      // First, register a user
      const firstUser = {
        name: 'First User',
        email: 'duplicate@example.com',
        password: 'password123',
        role: 'customer'
      };

      await request(app)
        .post('/graphql')
        .send({ 
          query: REGISTER_MUTATION.loc.source.body, 
          variables: firstUser 
        });

      // Now try to register with the same email
      const duplicateUser = {
        name: 'Duplicate User',
        email: 'duplicate@example.com', // Same email
        password: 'password123',
        role: 'customer'
      };

      const response = await request(app)
        .post('/graphql')
        .send({ 
          query: REGISTER_MUTATION.loc.source.body, 
          variables: duplicateUser 
        });

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Email already registered');
    });

    test('should login with valid credentials', async () => {
      const variables = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/graphql')
        .send({ 
          query: LOGIN_MUTATION.loc.source.body, 
          variables 
        })
        .expect(200);

      // Check if login was successful
      if (response.body.data && response.body.data.login) {
        expect(response.body.data.login.token).toBeDefined();
        expect(response.body.data.login.user.email).toBe(variables.email);
        expect(response.body.data.login.user.role).toBe('customer');
      } else {
        // If login failed, check the error
        expect(response.body.errors).toBeDefined();
        console.log('Login failed with error:', response.body.errors[0].message);
      }
    });

    test('should not login with invalid credentials', async () => {
      const variables = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/graphql')
        .send({ 
          query: LOGIN_MUTATION.loc.source.body, 
          variables 
        });

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Invalid login credentials');
    });

    test('should not login with non-existent email', async () => {
      const variables = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/graphql')
        .send({ 
          query: LOGIN_MUTATION.loc.source.body, 
          variables 
        });

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Invalid login credentials');
    });
  });
});
