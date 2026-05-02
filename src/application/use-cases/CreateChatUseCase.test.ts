import { CreateChatUseCase } from './CreateChatUseCase';
import { Chat } from '@domain/entities/Chat';
import { ChatRepository } from '../ports/ChatRepository';
import { ValidationError } from '@domain/errors/DomainError';

describe('CreateChatUseCase', () => {
  // Test will fail because CreateChatUseCase doesn't exist yet
  // That's the RED phase
  
  it('should create a new chat with creator and recipient as participants', async () => {
    // Arrange
    const mockChatRepository: ChatRepository = {
      create: jest.fn().mockImplementation(async (chat) => chat),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      updateLatestMessage: jest.fn(),
      removeParticipant: jest.fn(),
      delete: jest.fn(),
      findByParticipantId: jest.fn()
    };
    
    const useCase = new CreateChatUseCase(mockChatRepository);
    const input = {
      userId: 'user-123',
      recipientId: 'user-456'
    };
    
    // Act & Assert
    // This will fail because CreateChatUseCase doesn't exist
    await expect(useCase.execute(input)).resolves.toMatchObject({
      id: expect.any(String),
      participants: ['user-123', 'user-456'],
      createdAt: expect.any(Date)
    });
    
    // Verify chat was created with correct participant
    expect(mockChatRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        participants: ['user-123', 'user-456']
      })
    );
  });
  
  it('should create chat with generated ID and timestamps', async () => {
    // Arrange
    const mockChatRepository: ChatRepository = {
      create: jest.fn().mockImplementation(async (chat) => chat),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      updateLatestMessage: jest.fn(),
      removeParticipant: jest.fn(),
      delete: jest.fn(),
      findByParticipantId: jest.fn()
    };
    
    const useCase = new CreateChatUseCase(mockChatRepository);
    const input = {
      userId: 'user-123',
      recipientId: 'user-456'
    };
    
    // Act
    const result = await useCase.execute(input);
    
    // Assert
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.participants).toEqual(['user-123', 'user-456']);
  });

  it('should reject when recipientId equals userId', async () => {
    const mockChatRepository: ChatRepository = {
      create: jest.fn().mockImplementation(async (chat) => chat),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      updateLatestMessage: jest.fn(),
      removeParticipant: jest.fn(),
      delete: jest.fn(),
      findByParticipantId: jest.fn(),
    };

    const useCase = new CreateChatUseCase(mockChatRepository);

    await expect(
      useCase.execute({
        userId: 'user-123',
        recipientId: 'user-123',
      })
    ).rejects.toThrow(new ValidationError('Cannot create chat with yourself'));

    expect(mockChatRepository.create).not.toHaveBeenCalled();
  });
});
