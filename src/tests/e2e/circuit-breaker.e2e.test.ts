import request from 'supertest';
import { setupTestApp, cleanupTestApp, createTestUser } from './test-utils';

describe('Circuit Breaker E2E Tests', () => {
  let testApp: any;
  let server: any;

  beforeAll(async () => {
    testApp = await setupTestApp();
    server = testApp.app;
  });

  afterAll(async () => {
    await cleanupTestApp(testApp);
  });

  describe('Circuit Breaker', () => {
    it('should allow requests when services are available', async () => {
      // Create test user
      const { token } = await createTestUser(testApp, 'test3@example.com');

      // Make a request that should be allowed
      const res = await request(server)
        .get('/health')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Check that the response is successful
      expect(res.body.status).toEqual('OK');
    });

    it('should return 503 when MongoDB circuit breaker is OPEN', async () => {
      // Create test user
      const { token } = await createTestUser(testApp, 'test4@example.com');

      // Mock the MongoDB connection to simulate circuit breaker OPEN state
      const originalMongoGetMetrics = (testApp as any).mongoDBConnection.getMetrics;
      (testApp as any).mongoDBConnection.getMetrics = () => ({ state: 'OPEN' });
      
      // Make a request that should be blocked by circuit breaker
      const res = await request(server)
        .get('/chats')
        .set('Authorization', `Bearer ${token}`)
        .expect(503);

      expect(res.body).toEqual({
        success: false,
        data: null,
        message: 'Service unavailable',
        errorCode: 'SERVICE_UNAVAILABLE',
      });
      
      // Restore the original getMetrics function
      (testApp as any).mongoDBConnection.getMetrics = originalMongoGetMetrics;
    });

    it('should return 503 when Redis circuit breaker is OPEN', async () => {
      // Create test user
      const { token } = await createTestUser(testApp, 'test5@example.com');

      // Mock the Redis connection to simulate circuit breaker OPEN state
      const originalRedisGetMetrics = (testApp as any).redisConnection.getMetrics;
      (testApp as any).redisConnection.getMetrics = () => ({ state: 'OPEN' });
      
      // Make a request that should be blocked by circuit breaker
      const res = await request(server)
        .get('/chats')
        .set('Authorization', `Bearer ${token}`)
        .expect(503);

      expect(res.body).toEqual({
        success: false,
        data: null,
        message: 'Service unavailable',
        errorCode: 'SERVICE_UNAVAILABLE',
      });
      
      // Restore the original getMetrics function
      (testApp as any).redisConnection.getMetrics = originalRedisGetMetrics;
    });
  });
});