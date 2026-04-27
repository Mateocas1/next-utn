import { getEnv } from './config/env';
import { createApp } from './presentation/app';
import { mongoDBConnection } from './infrastructure/database/connection';
import { redisConnection } from './infrastructure/redis/connection';
import { JWTService } from './infrastructure/auth/JWTService';
import { BcryptPasswordHasher } from './infrastructure/auth/BcryptPasswordHasher';
import { MongooseUserRepository } from './infrastructure/database/repositories/MongooseUserRepository';
import { MongooseChatRepository } from './infrastructure/database/repositories/MongooseChatRepository';
import { MongooseMessageRepository } from './infrastructure/database/repositories/MongooseMessageRepository';
import { RegisterUserUseCase } from './application/use-cases/RegisterUserUseCase';
import { LoginUserUseCase } from './application/use-cases/LoginUserUseCase';
import { CreateChatUseCase } from './application/use-cases/CreateChatUseCase';
import { ListChatsUseCase } from './application/use-cases/ListChatsUseCase';
import { GetChatDetailsUseCase } from './application/use-cases/GetChatDetailsUseCase';
import { SendMessageUseCase } from './application/use-cases/SendMessageUseCase';
import { GetMessageHistoryUseCase } from './application/use-cases/GetMessageHistoryUseCase';
import { InMemoryEventBus } from './infrastructure/events/InMemoryEventBus';
import { RedisRateLimiter } from './infrastructure/redis/RedisRateLimiter';
import { RedisIdempotencyStore } from './infrastructure/redis/RedisIdempotencyStore';

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

  // Create Express app
  const app = createApp(
    registerUserUseCase,
    loginUserUseCase,
    createChatUseCase,
    listChatsUseCase,
    getChatDetailsUseCase,
    sendMessageUseCase,
    getMessageHistoryUseCase,
    jwtService,
    rateLimiter,
    idempotencyStore
  );

  // Start server
  const port = config.PORT;
  app.listen(port, () => {
    console.log(`Chat API listening on port ${port}`);
    console.log(`Environment: ${config.NODE_ENV}`);
    console.log(`Health check: http://localhost:${port}/health`);
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