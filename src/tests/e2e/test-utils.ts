import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import Redis from 'ioredis';
import { Express } from 'express';
import { createApp } from '@presentation/app';
import { JWTService } from '@infrastructure/auth/JWTService';
import { BcryptPasswordHasher } from '@infrastructure/auth/BcryptPasswordHasher';
import { MongooseUserRepository } from '@infrastructure/database/repositories/MongooseUserRepository';
import { MongooseChatRepository } from '@infrastructure/database/repositories/MongooseChatRepository';
import { MongooseMessageRepository } from '@infrastructure/database/repositories/MongooseMessageRepository';
import { RegisterUserUseCase } from '@application/use-cases/RegisterUserUseCase';
import { LoginUserUseCase } from '@application/use-cases/LoginUserUseCase';
import { CreateChatUseCase } from '@application/use-cases/CreateChatUseCase';
import { ListChatsUseCase } from '@application/use-cases/ListChatsUseCase';
import { GetChatDetailsUseCase } from '@application/use-cases/GetChatDetailsUseCase';
import { SendMessageUseCase } from '@application/use-cases/SendMessageUseCase';
import { GetMessageHistoryUseCase } from '@application/use-cases/GetMessageHistoryUseCase';
import { NotifyUserTypingUseCase } from '@application/use-cases/NotifyUserTypingUseCase';
import { ListNotificationsUseCase } from '@application/use-cases/ListNotificationsUseCase';
import { MarkNotificationAsReadUseCase } from '@application/use-cases/MarkNotificationAsReadUseCase';
import { MongooseNotificationRepository } from '@infrastructure/database/repositories/MongooseNotificationRepository';
import { NotificationModel } from '@infrastructure/database/models/NotificationModel';
import { RedisRateLimiter } from '@infrastructure/redis/RedisRateLimiter';
import { RedisIdempotencyStore } from '@infrastructure/redis/RedisIdempotencyStore';
import { InMemoryEventBus } from '@infrastructure/events/InMemoryEventBus';
import { mongoDBConnection } from '@infrastructure/database/connection';
import { redisConnection } from '@infrastructure/redis/connection';

export interface TestApp {
  app: Express.Application;
  mongoServer: MongoMemoryReplSet;
  redisClient: Redis;
  jwtService: JWTService;
  passwordHasher: BcryptPasswordHasher;
  userRepository: MongooseUserRepository;
  chatRepository: MongooseChatRepository;
  messageRepository: MongooseMessageRepository;
  eventBus: InMemoryEventBus;
  registerUserUseCase: RegisterUserUseCase;
  loginUserUseCase: LoginUserUseCase;
  createChatUseCase: CreateChatUseCase;
  listChatsUseCase: ListChatsUseCase;
  getChatDetailsUseCase: GetChatDetailsUseCase;
  sendMessageUseCase: SendMessageUseCase;
  getMessageHistoryUseCase: GetMessageHistoryUseCase;
  rateLimiter: RedisRateLimiter;
  idempotencyStore: RedisIdempotencyStore;
  mongoDBConnection: typeof mongoDBConnection;
  redisConnection: typeof redisConnection;
}

export async function setupTestApp(): Promise<TestApp> {
  // Setup MongoDB Memory Server
  const mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const mongoUri = mongoServer.getUri();
  
  // Override config for testing
  const testConfig = {
    PORT: 3000,
    MONGO_URI: mongoUri,
    REDIS_URL: 'redis://localhost:6379', // Will use ioredis-mock
    JWT_SECRET: 'test-jwt-secret',
    JWT_EXPIRES_IN: '1h',
    RATE_LIMIT_MAX: 100,
    RATE_LIMIT_WINDOW: 60,
    IDEMPOTENCY_TTL: 86400,
  };

  // Connect to MongoDB
  await mongoose.connect(mongoUri);

  // Create Redis client (ioredis-mock will be used via jest.mock)
  const redisClient = new Redis(testConfig.REDIS_URL);

  // Create infrastructure services
  const jwtService = new JWTService(testConfig.JWT_SECRET, testConfig.JWT_EXPIRES_IN);
  const passwordHasher = new BcryptPasswordHasher();

  // Create repositories
  const userRepository = new MongooseUserRepository();
  const chatRepository = new MongooseChatRepository();
  const messageRepository = new MongooseMessageRepository();
  const notificationRepository = new MongooseNotificationRepository(NotificationModel);

  // Create event bus
  const eventBus = new InMemoryEventBus();

  // Create use cases
  const registerUserUseCase = new RegisterUserUseCase(userRepository, passwordHasher);
  const loginUserUseCase = new LoginUserUseCase(userRepository, passwordHasher, jwtService);
  const createChatUseCase = new CreateChatUseCase(chatRepository);
  const listChatsUseCase = new ListChatsUseCase(chatRepository);
  const getChatDetailsUseCase = new GetChatDetailsUseCase(chatRepository);
  const sendMessageUseCase = new SendMessageUseCase(chatRepository, messageRepository, eventBus);
  const getMessageHistoryUseCase = new GetMessageHistoryUseCase(chatRepository, messageRepository);
  const notifyUserTypingUseCase = new NotifyUserTypingUseCase(chatRepository, eventBus);
  const listNotificationsUseCase = new ListNotificationsUseCase(notificationRepository);
  const markNotificationAsReadUseCase = new MarkNotificationAsReadUseCase(notificationRepository);

  // Create Redis services
  const rateLimiter = new RedisRateLimiter(redisClient);
  const idempotencyStore = new RedisIdempotencyStore(redisClient);

  // Create Express app
  const app = createApp(
    registerUserUseCase,
    loginUserUseCase,
    createChatUseCase,
    listChatsUseCase,
    getChatDetailsUseCase,
    sendMessageUseCase,
    getMessageHistoryUseCase,
    notifyUserTypingUseCase,
    listNotificationsUseCase,
    markNotificationAsReadUseCase,
    jwtService,
    rateLimiter,
    idempotencyStore
  );

  return {
    app,
    mongoServer,
    redisClient,
    jwtService,
    passwordHasher,
    userRepository,
    chatRepository,
    messageRepository,
    eventBus,
    registerUserUseCase,
    loginUserUseCase,
    createChatUseCase,
    listChatsUseCase,
    getChatDetailsUseCase,
    sendMessageUseCase,
    getMessageHistoryUseCase,
    rateLimiter,
    idempotencyStore,
    mongoDBConnection,
    redisConnection,
  };
}

export async function cleanupTestApp(testApp: TestApp): Promise<void> {
  await mongoose.disconnect();
  await testApp.mongoServer.stop();
  await testApp.redisClient.quit();
}

export async function createTestUser(
  testApp: TestApp,
  email: string = 'test@example.com',
  displayName: string = 'Test User',
  password: string = 'SecurePass123!'
): Promise<{ userId: string; token: string }> {
  // Register user
  const user = await testApp.registerUserUseCase.execute({
    email,
    displayName,
    password,
  });

  // Login to get token
  const loginResult = await testApp.loginUserUseCase.execute({
    email,
    password,
  });

  return {
    userId: user.id,
    token: loginResult.token,
  };
}