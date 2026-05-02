import request from 'supertest';
import { setupTestApp, cleanupTestApp } from './test-utils';

describe('Messages API - E2E', () => {
  let testApp: Awaited<ReturnType<typeof setupTestApp>>;
  let server: any;
  let authToken: string;
  let userId: string;
  let chatId: string;

  const createRecipient = async (): Promise<string> => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `message-recipient-${unique}@example.com`;

    const registerResponse = await request(server)
      .post('/users/register')
      .send({
        email,
        displayName: 'Message Recipient',
        password: 'SecurePass123!',
      });

    return registerResponse.body.data.id;
  };

  const bootstrapAuthAndChat = async () => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `message-user-${unique}@example.com`;

    const registerResponse = await request(server)
      .post('/users/register')
      .send({
        email,
        displayName: 'Message User',
        password: 'SecurePass123!',
      });

    userId = registerResponse.body.data.id;

    const loginResponse = await request(server)
      .post('/users/login')
      .send({
        email,
        password: 'SecurePass123!',
      });

    authToken = loginResponse.body.data.token;

    const recipientId = await createRecipient();
    const chatResponse = await request(server)
      .post('/chats')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ recipientId });

    chatId = chatResponse.body.data.id;
  };

  beforeAll(async () => {
    testApp = await setupTestApp();
    server = testApp.app;

    await bootstrapAuthAndChat();
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

    await bootstrapAuthAndChat();
  });

  describe('POST /messages', () => {
    it('should return 201 with created message data', async () => {
      const response = await request(server)
        .post('/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatId,
          content: 'Hello, world!',
        });
      
      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        id: expect.any(String),
        chatId,
        senderId: userId,
        content: 'Hello, world!',
        createdAt: expect.any(String),
      });
    });

    it('should return 404 for non-existent chat', async () => {
      const response = await request(server)
        .post('/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatId: '00000000-0000-0000-0000-000000000000',
          content: 'Hello, world!',
        });
      
      expect(response.status).toBe(404);
      expect(response.body.errorCode).toBe('NOT_FOUND');
    });

    it('should return 403 when user is not a chat participant', async () => {
      // Create another user
      const otherRegisterResponse = await request(server)
        .post('/users/register')
        .send({
          email: 'other-message-user@example.com',
          displayName: 'Other Message User',
          password: 'SecurePass123!',
        });
      
      const otherLoginResponse = await request(server)
        .post('/users/login')
        .send({
          email: 'other-message-user@example.com',
          password: 'SecurePass123!',
        });
      
      const otherToken = otherLoginResponse.body.data.token;

      const response = await request(server)
        .post('/messages')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          chatId,
          content: 'Hello from outsider!',
        });
      
      expect(response.status).toBe(403);
      expect(response.body.errorCode).toBe('CHAT_ACCESS_DENIED');
    });

    it('should return 400 for invalid content (empty)', async () => {
      const response = await request(server)
        .post('/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatId,
          content: '',
        });
      
      expect(response.status).toBe(400);
      expect(response.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid content (too long)', async () => {
      const longContent = 'a'.repeat(2001);
      const response = await request(server)
        .post('/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatId,
          content: longContent,
        });
      
      expect(response.status).toBe(400);
      expect(response.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should be idempotent with same idempotency key', async () => {
      const idempotencyKey = 'test-idempotency-key';
      
      const firstResponse = await request(server)
        .post('/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          chatId,
          content: 'Idempotent message',
        });
      
      expect(firstResponse.status).toBe(201);
      const firstMessageId = firstResponse.body.data.id;
      
      const secondResponse = await request(server)
        .post('/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          chatId,
          content: 'Idempotent message',
        });
      
      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body.data.id).toBe(firstMessageId);
    });
  });

  describe('GET /messages', () => {
    beforeEach(async () => {
      // Create some messages for testing
      for (let i = 0; i < 5; i++) {
        await request(server)
          .post('/messages')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            chatId,
            content: `Message ${i + 1}`,
          });
      }
    });

    it('should return 200 with message history', async () => {
      const response = await request(server)
        .get('/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ chatId });
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.data[0]).toMatchObject({
        id: expect.any(String),
        chatId,
        senderId: userId,
        content: expect.any(String),
        createdAt: expect.any(String),
      });
      // Messages should be sorted newest first
      expect(response.body.data[0].content).toBe('Message 5');
      expect(response.body.data[4].content).toBe('Message 1');
    });

    it('should paginate correctly with limit', async () => {
      const response = await request(server)
        .get('/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          chatId,
          limit: 2 
        });
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.nextCursor).toBeTruthy();
      expect(response.body.meta.limit).toBe(2);
    });

    it('should paginate correctly with cursor', async () => {
      // First page
      const firstPage = await request(server)
        .get('/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          chatId,
          limit: 2 
        });
      
      expect(firstPage.status).toBe(200);
      expect(firstPage.body.data).toHaveLength(2);
      expect(firstPage.body.meta.nextCursor).toBeTruthy();

      // Second page
      const secondPage = await request(server)
        .get('/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          chatId,
          limit: 2,
          cursor: firstPage.body.meta.nextCursor 
        });
      
      expect(secondPage.status).toBe(200);
      expect(secondPage.body.data).toHaveLength(2);
      expect(secondPage.body.meta.nextCursor).toBeTruthy();

      // Third page (should be last)
      const thirdPage = await request(server)
        .get('/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          chatId,
          limit: 2,
          cursor: secondPage.body.meta.nextCursor 
        });
      
      expect(thirdPage.status).toBe(200);
      expect(thirdPage.body.data).toHaveLength(1); // 5 total - 2 - 2 = 1
      expect(thirdPage.body.meta.nextCursor).toBeNull();
    });

    it('should return 400 for invalid cursor', async () => {
      const response = await request(server)
        .get('/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          chatId,
          cursor: 'invalid-base64'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.errorCode).toBe('INVALID_CURSOR');
    });

    it('should return 404 for non-existent chat', async () => {
      const response = await request(server)
        .get('/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          chatId: '00000000-0000-0000-0000-000000000000'
        });
      
      expect(response.status).toBe(404);
      expect(response.body.errorCode).toBe('NOT_FOUND');
    });

    it('should return 403 when user is not a chat participant', async () => {
      // Create another user
      const otherRegisterResponse = await request(server)
        .post('/users/register')
        .send({
          email: 'other-message-user2@example.com',
          displayName: 'Other Message User 2',
          password: 'SecurePass123!',
        });
      
      const otherLoginResponse = await request(server)
        .post('/users/login')
        .send({
          email: 'other-message-user2@example.com',
          password: 'SecurePass123!',
        });
      
      const otherToken = otherLoginResponse.body.data.token;

      const response = await request(server)
        .get('/messages')
        .set('Authorization', `Bearer ${otherToken}`)
        .query({ chatId });
      
      expect(response.status).toBe(403);
      expect(response.body.errorCode).toBe('CHAT_ACCESS_DENIED');
    });
  });

  describe('POST /messages/typing', () => {
    it('should return 400 when isTyping is missing', async () => {
      const response = await request(server)
        .post('/messages/typing')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatId,
        });

      expect(response.status).toBe(400);
      expect(response.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when isTyping is not boolean', async () => {
      const response = await request(server)
        .post('/messages/typing')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatId,
          isTyping: 'true',
        });

      expect(response.status).toBe(400);
      expect(response.body.errorCode).toBe('VALIDATION_ERROR');
    });
  });
});
