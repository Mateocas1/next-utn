import { GetChatDetailsUseCase } from './GetChatDetailsUseCase';
import { Chat } from '@domain/entities/Chat';
import { NotFoundError, ChatAccessDeniedError } from '@domain/errors/DomainError';
import { ChatRepository } from '../ports/ChatRepository';

describe('GetChatDetailsUseCase', () => {
  // Test will fail because GetChatDetailsUseCase doesn't exist yet
  // That's the RED phase
  
  it('should return chat details when user is participant', async () => {
    // Arrange
    const chat = Chat.create('user-123');
    const mockChatRepository: ChatRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(chat),
      findByUserId: jest.fn(),
      updateLatestMessage: jest.fn()
    };
    
    const useCase = new GetChatDetailsUseCase(mockChatRepository);
    const input = {
      chatId: 'chat-123',
      userId: 'user-123' // Same as creator/participant
    };
    
    // Act & Assert
    // This will fail because GetChatDetailsUseCase doesn't exist
    await expect(useCase.execute(input)).resolves.toEqual({
      id: chat.id,
      participants: chat.participants,
      latestMessagePreview: chat.latestMessagePreview,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    });
    
    // Verify repository was called
    expect(mockChatRepository.findById).toHaveBeenCalledWith('chat-123');
  });
  
  it('should throw NotFoundError when chat does not exist', async () => {
    // Arrange
    const mockChatRepository: ChatRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(null),
      findByUserId: jest.fn(),
      updateLatestMessage: jest.fn()
    };
    
    const useCase = new GetChatDetailsUseCase(mockChatRepository);
    const input = {
      chatId: 'non-existent-chat',
      userId: 'user-123'
    };
    
    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });
  
  it('should throw ForbiddenError when user is not participant', async () => {
    // Arrange
    const chat = Chat.create('different-user'); // Created by different user
    const mockChatRepository: ChatRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(chat),
      findByUserId: jest.fn(),
      updateLatestMessage: jest.fn()
    };
    
    const useCase = new GetChatDetailsUseCase(mockChatRepository);
    const input = {
      chatId: 'chat-123',
      userId: 'user-123' // Not a participant
    };
    
    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(ChatAccessDeniedError);
  });
  
  it('should allow access when user is participant (not creator)', async () => {
    // Arrange
    const chat = Chat.create('creator-user');
    // Manually add another participant
    const chatWithParticipants = {
      ...chat,
      participants: ['creator-user', 'user-123'] // user-123 is participant
    };
    
    const mockChatRepository: ChatRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(chatWithParticipants),
      findByUserId: jest.fn(),
      updateLatestMessage: jest.fn()
    };
    
    const useCase = new GetChatDetailsUseCase(mockChatRepository);
    const input = {
      chatId: 'chat-123',
      userId: 'user-123' // Is participant
    };
    
    // Act & Assert
    await expect(useCase.execute(input)).resolves.toBeDefined();
  });
});