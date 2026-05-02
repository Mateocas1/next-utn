import request from 'supertest';
import { Express } from 'express';
import { setupTestApp, cleanupTestApp } from './test-utils';
import { UserModel } from '@infrastructure/database/models/UserModel';
import { MessageModel } from '@infrastructure/database/models/MessageModel';
import { ChatModel } from '@infrastructure/database/models/ChatModel';
import { NotificationModel } from '@infrastructure/database/models/NotificationModel';

const buildRegistrationPayload = (email: string, displayName: string, password = 'SecurePass123!') => ({
  email,
  displayName,
  password,
});

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

  describe('POST /users', () => {
    it('should return 201 with user data on successful registration', async () => {
      const response = await request(server)
        .post('/users')
        .send(buildRegistrationPayload('test@example.com', 'Test User'));

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
      await request(server)
        .post('/users')
        .send(buildRegistrationPayload('duplicate@example.com', 'First User'));

      const response = await request(server)
        .post('/users')
        .send(buildRegistrationPayload('duplicate@example.com', 'Second User', 'AnotherPass123!'));

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
        .post('/users')
        .send(buildRegistrationPayload('invalid-email', 'Test User'));

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
        .post('/users')
        .send(buildRegistrationPayload('test@example.com', 'Test User', 'short'));

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

  describe('Route normalization', () => {
    it('should return 201 using normalized /users route', async () => {
      const response = await request(server)
        .post('/users')
        .send(buildRegistrationPayload('normalized-register@example.com', 'Normalized Register'));

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('normalized-register@example.com');
    });

    it('should preserve legacy /users/register behavior', async () => {
      const response = await request(server)
        .post('/users/register')
        .send(buildRegistrationPayload('legacy-register@example.com', 'Legacy Register'));

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('legacy-register@example.com');
    });

    it('should not expose /api/users/register', async () => {
      const response = await request(server)
        .post('/api/users/register')
        .send({
          email: 'legacy-prefix@example.com',
          displayName: 'Legacy Prefix',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(404);
    });

    it('should support /notifications without /api and reject /api/notifications', async () => {
      await request(server)
        .post('/users')
        .send(buildRegistrationPayload('normalized-notifications@example.com', 'Normalized Notifications'));

      const loginResponse = await request(server)
        .post('/users/login')
        .send({
          email: 'normalized-notifications@example.com',
          password: 'SecurePass123!',
        });

      const notificationsResponse = await request(server)
        .get('/notifications')
        .set('Authorization', `Bearer ${loginResponse.body.data.token}`);

      expect(notificationsResponse.status).toBe(200);
      expect(notificationsResponse.body.success).toBe(true);
      expect(Array.isArray(notificationsResponse.body.data)).toBe(true);

      const legacyResponse = await request(server)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${loginResponse.body.data.token}`);

      expect(legacyResponse.status).toBe(404);
    });
  });

  describe('GET /users', () => {
    beforeEach(async () => {
      await request(server)
        .post('/users')
        .send(buildRegistrationPayload('list-users-1@example.com', 'List One'));
    });

    it('should return 200 with an array of users', async () => {
      const response = await request(server)
        .get('/users');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          email: expect.any(String),
          displayName: expect.any(String),
          createdAt: expect.any(String),
        })
      );
    });
  });

  describe('DELETE /users/:id', () => {
    it('should return 204 and physically cascade delete dependent data', async () => {
      await request(server)
        .post('/users')
        .send(buildRegistrationPayload('delete-target@example.com', 'Delete Target'));

      await request(server)
        .post('/users')
        .send(buildRegistrationPayload('chat-peer@example.com', 'Chat Peer'));

      await request(server)
        .post('/users')
        .send(buildRegistrationPayload('chat-third@example.com', 'Chat Third'));

      const targetLogin = await request(server)
        .post('/users/login')
        .send({
          email: 'delete-target@example.com',
          password: 'SecurePass123!',
        });

      const peerLogin = await request(server)
        .post('/users/login')
        .send({
          email: 'chat-peer@example.com',
          password: 'SecurePass123!',
        });

      const targetUser = await UserModel.findOne({ email: 'delete-target@example.com' }).lean();
      const peerUser = await UserModel.findOne({ email: 'chat-peer@example.com' }).lean();
      const thirdUser = await UserModel.findOne({ email: 'chat-third@example.com' }).lean();

      expect(targetUser).toBeTruthy();
      expect(peerUser).toBeTruthy();
      expect(thirdUser).toBeTruthy();

      const emptyingChatId = '11111111-1111-4111-8111-111111111111';
      const survivingChatId = '22222222-2222-4222-8222-222222222222';

      await ChatModel.create({
        id: emptyingChatId,
        participants: [targetUser!.id],
        latestMessagePreview: 'target only',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await ChatModel.create({
        id: survivingChatId,
        participants: [targetUser!.id, peerUser!.id, thirdUser!.id],
        latestMessagePreview: 'stale preview',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await MessageModel.create({
        id: '33333333-3333-4333-8333-333333333333',
        chatId: emptyingChatId,
        senderId: targetUser!.id,
        content: 'only message in emptying chat',
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
      });

      await MessageModel.create({
        id: '44444444-4444-4444-8444-444444444444',
        chatId: survivingChatId,
        senderId: targetUser!.id,
        content: 'target message to be removed',
        createdAt: new Date('2026-01-01T11:00:00.000Z'),
      });

      await MessageModel.create({
        id: '55555555-5555-4555-8555-555555555555',
        chatId: survivingChatId,
        senderId: peerUser!.id,
        content: 'peer message should remain',
        createdAt: new Date('2026-01-01T12:00:00.000Z'),
      });

      await NotificationModel.create({
        userId: targetUser!.id,
        title: 'Delete me',
        message: 'Notification should be removed on cascade delete',
        read: false,
        createdAt: new Date(),
        readAt: null,
      });

      const response = await request(server)
        .delete(`/users/${targetUser!.id}`)
        .set('Authorization', `Bearer ${peerLogin.body.data.token}`);

      expect(response.status).toBe(204);
      expect(response.text).toBe('');

      const deletedUser = await UserModel.findOne({ id: targetUser!.id }).lean();
      const deletedMessagesCount = await MessageModel.countDocuments({ senderId: targetUser!.id });
      const deletedNotificationsCount = await NotificationModel.countDocuments({ userId: targetUser!.id });
      const deletedEmptyingChat = await ChatModel.findOne({ id: emptyingChatId }).lean();
      const updatedSurvivingChat = await ChatModel.findOne({ id: survivingChatId }).lean();
      const survivingMessages = await MessageModel.find({ chatId: survivingChatId }).lean();

      expect(deletedUser).toBeNull();
      expect(deletedMessagesCount).toBe(0);
      expect(deletedNotificationsCount).toBe(0);
      expect(deletedEmptyingChat).toBeNull();
      expect(updatedSurvivingChat).toBeTruthy();
      expect(updatedSurvivingChat!.participants).toEqual(expect.arrayContaining([peerUser!.id, thirdUser!.id]));
      expect(updatedSurvivingChat!.participants).not.toContain(targetUser!.id);
      expect(updatedSurvivingChat!.latestMessagePreview).toBe('peer message should remain');
      expect(survivingMessages).toHaveLength(1);
      expect(survivingMessages[0].senderId).toBe(peerUser!.id);
      expect(survivingMessages[0].content).toBe('peer message should remain');

      const targetNotificationsAfterDelete = await request(server)
        .get('/notifications')
        .set('Authorization', `Bearer ${targetLogin.body.data.token}`);

      expect(targetNotificationsAfterDelete.status).toBe(401);
      expect(targetNotificationsAfterDelete.body).toEqual({
        success: false,
        data: null,
        message: 'Invalid token',
        errorCode: 'INVALID_TOKEN',
      });
    });

    it('should return 401 when unauthenticated', async () => {
      const response = await request(server)
        .delete('/users/8f41d674-fa61-4f71-9377-f74f8dc8a622');

      expect(response.status).toBe(401);
      expect(response.body.errorCode).toBe('AUTHENTICATION_REQUIRED');
    });

    it('should return 404 for non-existent user id with auth', async () => {
      await request(server)
        .post('/users')
        .send(buildRegistrationPayload('deleter@example.com', 'Deleter'));

      const loginResponse = await request(server)
        .post('/users/login')
        .send({
          email: 'deleter@example.com',
          password: 'SecurePass123!',
        });

      const response = await request(server)
        .delete('/users/8f41d674-fa61-4f71-9377-f74f8dc8a622')
        .set('Authorization', `Bearer ${loginResponse.body.data.token}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        data: null,
        message: 'User not found',
        errorCode: 'NOT_FOUND',
      });
    });
  });

  describe('POST /users/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await request(server)
        .post('/users')
        .send(buildRegistrationPayload('login@example.com', 'Login User'));
    });

    it('should return 200 with JWT token on successful login', async () => {
      const response = await request(server)
        .post('/users/login')
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
        .post('/users/login')
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
        .post('/users/login')
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
        .post('/users/login')
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
