import 'dotenv/config';
import { getEnv } from './config/env';
import { createApp } from './presentation/app';
import { mongoDBConnection } from './infrastructure/database/connection';
import { redisConnection } from './infrastructure/redis/connection';
import { JWTService } from './infrastructure/auth/JWTService';
import { BcryptPasswordHasher } from './infrastructure/auth/BcryptPasswordHasher';
import { MongooseUserRepository } from './infrastructure/database/repositories/MongooseUserRepository';
import { MongooseChatRepository } from './infrastructure/database/repositories/MongooseChatRepository';
import { MongooseMessageRepository } from './infrastructure/database/repositories/MongooseMessageRepository';
import { MongooseNotificationRepository } from './infrastructure/database/repositories/MongooseNotificationRepository';
import { RegisterUserUseCase } from './application/use-cases/RegisterUserUseCase';
import { LoginUserUseCase } from './application/use-cases/LoginUserUseCase';
import { CreateChatUseCase } from './application/use-cases/CreateChatUseCase';
import { ListChatsUseCase } from './application/use-cases/ListChatsUseCase';
import { GetChatDetailsUseCase } from './application/use-cases/GetChatDetailsUseCase';
import { SendMessageUseCase } from './application/use-cases/SendMessageUseCase';
import { GetMessageHistoryUseCase } from './application/use-cases/GetMessageHistoryUseCase';
import { ListNotificationsUseCase } from './application/use-cases/ListNotificationsUseCase';
import { MarkNotificationAsReadUseCase } from './application/use-cases/MarkNotificationAsReadUseCase';
import { NotifyUserTypingUseCase } from './application/use-cases/NotifyUserTypingUseCase';
import { SendNotificationUseCase } from './application/use-cases/SendNotificationUseCase';
import { ListUsersUseCase } from './application/use-cases/ListUsersUseCase';
import { DeleteUserUseCase } from './application/use-cases/DeleteUserUseCase';
import { registerEventHandlers } from './application/event-handlers/registerEventHandlers';
import { NotificationModel } from './infrastructure/database/models/NotificationModel';
import { InMemoryEventBus } from './infrastructure/events/InMemoryEventBus';
import { RedisRateLimiter } from './infrastructure/redis/RedisRateLimiter';
import { RedisIdempotencyStore } from './infrastructure/redis/RedisIdempotencyStore';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocketGateway } from './infrastructure/websocket/gateway';
import { socketIOMiddleware } from './infrastructure/websocket/middleware';
import { MongooseTransactionManager } from './infrastructure/database/MongooseTransactionManager';
import { setupSocketRedisAdapter } from './infrastructure/websocket/setupRedisAdapter';

async function bootstrap() {
  console.log('Starting Chat API...');
  const config = getEnv();

  // Connect to databases
  console.log('Connecting to MongoDB...');
  await mongoDBConnection.connect();
  console.log('MongoDB connected');

  console.log('Connecting to Redis...');
  await redisConnection.connect();
  console.log('Redis connected');

  // Create infrastructure services
  const jwtService = new JWTService(config.JWT_SECRET, config.JWT_EXPIRES_IN);
  const passwordHasher = new BcryptPasswordHasher();
  const eventBus = new InMemoryEventBus();
  const rateLimiter = new RedisRateLimiter(redisConnection.getClient(), config.RATE_LIMIT_MAX, config.RATE_LIMIT_WINDOW);
  const idempotencyStore = new RedisIdempotencyStore(redisConnection.getClient(), config.IDEMPOTENCY_TTL);

  // Create repositories
  const userRepository = new MongooseUserRepository();
  const chatRepository = new MongooseChatRepository();
  const messageRepository = new MongooseMessageRepository();
  const notificationRepository = new MongooseNotificationRepository(NotificationModel);

  // Create use cases
  const registerUserUseCase = new RegisterUserUseCase(
    userRepository,
    passwordHasher
  );
  const loginUserUseCase = new LoginUserUseCase(
    userRepository,
    passwordHasher,
    jwtService
  );
  const createChatUseCase = new CreateChatUseCase(chatRepository);
  const listChatsUseCase = new ListChatsUseCase(chatRepository);
  const getChatDetailsUseCase = new GetChatDetailsUseCase(chatRepository);
  const sendMessageUseCase = new SendMessageUseCase(
    chatRepository,
    messageRepository,
    eventBus
  );
  const getMessageHistoryUseCase = new GetMessageHistoryUseCase(
    chatRepository,
    messageRepository
  );
  
  // Create notification use cases
  const listNotificationsUseCase = new ListNotificationsUseCase(notificationRepository);
  const markNotificationAsReadUseCase = new MarkNotificationAsReadUseCase(notificationRepository);
  const notifyUserTypingUseCase = new NotifyUserTypingUseCase(chatRepository, eventBus);
  
  // Create notification sender and register event handlers
  const sendNotificationUseCase = new SendNotificationUseCase(notificationRepository, eventBus);
  registerEventHandlers(eventBus, notificationRepository);
  const transactionManager = new MongooseTransactionManager();
  const listUsersUseCase = new ListUsersUseCase(userRepository);
  const deleteUserUseCase = new DeleteUserUseCase(
    userRepository,
    notificationRepository,
    messageRepository,
    chatRepository,
    transactionManager
  );

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
    listUsersUseCase,
    deleteUserUseCase,
    listNotificationsUseCase,
    markNotificationAsReadUseCase,
    jwtService,
    rateLimiter,
    idempotencyStore,
    userRepository
  );

  // Create HTTP server
  const httpServer = app.listen(config.PORT, () => {
    console.log(`Chat API listening on port ${config.PORT}`);
    console.log(`Environment: ${config.NODE_ENV}`);
    console.log(`Health check: http://localhost:${config.PORT}/health`);
  });

  // Initialize Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.CORS_ORIGIN || "*",
      methods: ["GET", "POST"]
    }
  });

  // Configure Redis adapter for Socket.IO
  const redisClient = redisConnection.getClient();
  const adapterSetup = await setupSocketRedisAdapter({
    io,
    redisClient,
    logger: console,
  });

  // Initialize WebSocket middleware
  io.use(socketIOMiddleware(jwtService));

  // Initialize WebSocketGateway
  const webSocketGateway = new WebSocketGateway(io);
  webSocketGateway.subscribe(eventBus);
  io.on('connection', (socket) => {
    webSocketGateway.handleConnection(socket);
  });

  // Handle shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    httpServer.close(() => {
      console.log('HTTP server closed.');
      if (adapterSetup.mode === 'redis') {
        adapterSetup.subscriberClient.quit();
      }
      redisClient.quit();
      process.exit(0);
    });
  });
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
