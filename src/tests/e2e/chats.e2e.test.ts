import request from 'supertest';
import { setupTestApp, cleanupTestApp } from './test-utils';

describe('Chats API - E2E', () => {
  let testApp: Awaited<ReturnType<typeof setupTestApp>>;
  let server: any;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    testApp = await setupTestApp();
    server = testApp.app;
    
    // Create a test user and get token
    const registerResponse = await request(server)
      .post('/auth/register')
      .send({
        email: 'chat-user@example.com',
        displayName: 'Chat User',
        password: 'SecurePass123!',
      });
    
    userId = registerResponse.body.data.id;
    
    const loginResponse = await request(server)
      .post('/auth/login')
      .send({
        email: 'chat-user@example.com',
        password: 'SecurePass123!',
      });
    
    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await cleanupTestApp(testApp);
  });

  beforeEach(async () => {
    // Clear collections between tests
    const mongoose = require('mongoose');
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('POST /chats', () => {
    it('should return 201 with created chat data', async () => {
      const response = await request(server)
        .post('/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: {
          id: expect.any(String),
          participants: [userId],
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(server)
        .post('/chats')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        data: null,
        message: expect.any(String),
        errorCode: 'AUTHENTICATION_REQUIRED',
      });
    });

    it('should support idempotency with same key and body', async () => {
      const idempotencyKey = 'idempotent-chat-123';
      
      const firstResponse = await request(server)
        .post('/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({});

      const secondResponse = await request(server)
        .post('/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({});

      expect(firstResponse.status).toBe(201);
      expect(secondResponse.status).toBe(200); // Should return cached response
      expect(firstResponse.body.data.id).toBe(secondResponse.body.data.id);
    });

    it('should return 409 for idempotency key conflict with different body', async () => {
      const idempotencyKey = 'conflict-key-123';
      
      // First request with empty body
      await request(server)
        .post('/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({});

      // Second request with different body (though body doesn't matter for /chats)
      const response = await request(server)
        .post('/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({ some: 'different', body: 'structure' });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        success: false,
        data: null,
        message: expect.any(String),
        errorCode: 'IDEMPOTENCY_KEY_CONFLICT',
      });
    });
  });

  describe('GET /chats', () => {
    beforeEach(async () => {
      // Create some test chats
      for (let i = 0; i < 5; i++) {
        await request(server)
          .post('/chats')
          .set('Authorization', `Bearer ${authToken}`)
          .send({});
      }
    });

    it('should return first page of chats with cursor pagination', async () => {
      const response = await request(server)
        .get('/chats?limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.any(Array),
        meta: {
          nextCursor: expect.any(String),
          limit: 2,
        },
      });
      expect(response.body.data).toHaveLength(2);
    });

    it('should return second page using cursor', async () => {
      const firstPage = await request(server)
        .get('/chats?limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      const cursor = firstPage.body.meta.nextCursor;
      
      const secondPage = await request(server)
        .get(`/chats?limit=2&cursor=${cursor}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.data).toHaveLength(2);
      expect(secondPage.body.data[0].id).not.toBe(firstPage.body.data[0].id);
    });

    it('should return 400 for invalid cursor format', async () => {
      const response = await request(server)
        .get('/chats?cursor=invalid-base64')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        data: null,
        message: expect.any(String),
        errorCode: 'INVALID_CURSOR',
      });
    });

it('should paginate correctly and return null cursor on last page', async () => {
      // Create 5 chats
      const chatIds = [];
      for (let i = 0; i < 5; i++) {
        const response = await request(server)
          .post('/chats')
          .set('Authorization', `Bearer ${authToken}`)
          .send({});
        expect(response.status).toBe(201);
        chatIds.push(response.body.data.id);
      }

      // First page: limit=2
      const firstPage = await request(server)
        .get('/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 2 });
      
      expect(firstPage.status).toBe(200);
      expect(firstPage.body.data).toHaveLength(2);
      expect(firstPage.body.meta.nextCursor).toBeTruthy();

      // Second page
      const secondPage = await request(server)
        .get('/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          limit: 2,
          cursor: firstPage.body.meta.nextCursor 
        });
      
      expect(secondPage.status).toBe(200);
      expect(secondPage.body.data).toHaveLength(2);
      expect(secondPage.body.meta.nextCursor).toBeTruthy();

      // Third page (should be last)
      const thirdPage = await request(server)
        .get('/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          limit: 2,
          cursor: secondPage.body.meta.nextCursor 
        });
      
      expect(thirdPage.status).toBe(200);
      // We should have some chats on the third page
      expect(thirdPage.body.data.length).toBeGreaterThan(0);
      
      // Now keep paginating until we reach null cursor
      let currentCursor = thirdPage.body.meta.nextCursor;
      let pageCount = 3;
      
      while (currentCursor) {
        const nextPage = await request(server)
          .get('/chats')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ 
            limit: 2,
            cursor: currentCursor 
          });
        
        expect(nextPage.status).toBe(200);
        pageCount++;
        currentCursor = nextPage.body.meta.nextCursor;
        
        // Safety check: don't loop forever
        if (pageCount > 10) {
          break;
        }
      }
      
      // We should eventually reach null cursor
      expect(currentCursor).toBeNull();
    });
  });

  describe('GET /chats/:chatId', () => {
    let chatId: string;

    beforeEach(async () => {
      const response = await request(server)
        .post('/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      
      chatId = response.body.data.id;
    });

    it('should return chat details for participant', async () => {
      const response = await request(server)
        .get(`/chats/${chatId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          id: chatId,
          participants: [userId],
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });
    });

    it('should return 403 for non-participant', async () => {
      // Create another user
      const otherUserResponse = await request(server)
        .post('/auth/register')
        .send({
          email: 'other@example.com',
          displayName: 'Other User',
          password: 'SecurePass123!',
        });
      
      const otherLogin = await request(server)
        .post('/auth/login')
        .send({
          email: 'other@example.com',
          password: 'SecurePass123!',
        });
      
      const otherToken = otherLogin.body.data.token;

      const response = await request(server)
        .get(`/chats/${chatId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        data: null,
        message: expect.any(String),
        errorCode: 'CHAT_ACCESS_DENIED',
      });
    });

    it('should return 404 for non-existent chat', async () => {
      const response = await request(server)
        .get('/chats/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        data: null,
        message: expect.any(String),
        errorCode: 'NOT_FOUND',
      });
    });
  });
});