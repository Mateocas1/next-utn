import request from 'supertest';
import { Express } from 'express';
import { setupTestApp, cleanupTestApp } from './test-utils';

describe('Auth API - E2E', () => {
  let testApp: Awaited<ReturnType<typeof setupTestApp>>;
  let server: any;

  beforeAll(async () => {
    testApp = await setupTestApp();
    // Use the app directly with supertest
    server = testApp.app;
  });

  afterAll(async () => {
    await cleanupTestApp(testApp);
  });

  describe('POST /auth/register', () => {
    it('should return 201 with user data on successful registration', async () => {
      // RED: Write failing test first
      const response = await request(server)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          displayName: 'Test User',
          password: 'SecurePass123!',
        });

      // This will fail because we haven't implemented the test setup properly yet
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: {
          id: expect.any(String),
          email: 'test@example.com',
          displayName: 'Test User',
          createdAt: expect.any(String),
        },
      });
    });

    it('should return 409 when email already exists', async () => {
      // First create a user
      await request(server)
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          displayName: 'First User',
          password: 'SecurePass123!',
        });

      // Try to create another user with same email
      const response = await request(server)
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          displayName: 'Second User',
          password: 'AnotherPass123!',
        });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        success: false,
        data: null,
        message: 'Email already registered',
        errorCode: 'EMAIL_ALREADY_EXISTS',
      });
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(server)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          displayName: 'Test User',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        data: null,
        message: expect.any(String),
        errorCode: 'VALIDATION_ERROR',
        details: expect.any(Array),
      });
    });

    it('should return 400 for password below minimum length', async () => {
      const response = await request(server)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          displayName: 'Test User',
          password: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        data: null,
        message: expect.any(String),
        errorCode: 'VALIDATION_ERROR',
        details: expect.any(Array),
      });
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await request(server)
        .post('/auth/register')
        .send({
          email: 'login@example.com',
          displayName: 'Login User',
          password: 'SecurePass123!',
        });
    });

    it('should return 200 with JWT token on successful login', async () => {
      const response = await request(server)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          token: expect.any(String),
          type: 'Bearer',
          expiresIn: '1h',
        },
      });
    });

    it('should return 401 with generic error for invalid credentials', async () => {
      const response = await request(server)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        data: null,
        message: 'Invalid email or password',
        errorCode: 'AUTHENTICATION_FAILED',
      });
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(server)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        data: null,
        message: 'Invalid email or password',
        errorCode: 'AUTHENTICATION_FAILED',
      });
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(server)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        data: null,
        message: expect.any(String),
        errorCode: 'VALIDATION_ERROR',
        details: expect.any(Array),
      });
    });
  });
});