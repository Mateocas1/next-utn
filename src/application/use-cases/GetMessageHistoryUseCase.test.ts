import { GetMessageHistoryUseCase } from './GetMessageHistoryUseCase';
import { Message } from '@domain/entities/Message';
import { Chat } from '@domain/entities/Chat';
import { NotFoundError, ChatAccessDeniedError } from '@domain/errors/DomainError';
import { ChatRepository } from '../ports/ChatRepository';
import { MessageRepository } from '../ports/MessageRepository';

describe('GetMessageHistoryUseCase', () => {
  // Test will fail because GetMessageHistoryUseCase doesn't exist yet
  // That's the RED phase
  
  it('should return first page of messages when user is participant', async () => {
    // Arrange
    const chat = Chat.create('user-123', 'user-456');
    const mockMessages = [
      Message.create(chat.id, 'user-123', 'Message 1'),
      Message.create(chat.id, 'user-123', 'Message 2'),
      Message.create(chat.id, 'user-123', 'Message 3') // Third to trigger nextCursor
    ];
    
    const mockChatRepository: ChatRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(chat),
      findByUserId: jest.fn(),
      updateLatestMessage: jest.fn(),
      removeParticipant: jest.fn(),
      delete: jest.fn(),
      findByParticipantId: jest.fn()
    };
    
    const mockMessageRepository: MessageRepository = {
      create: jest.fn(),
      findByChatId: jest.fn().mockResolvedValue(mockMessages),
      deleteByUserId: jest.fn(),
      deleteByChatId: jest.fn(),
      findLatestByChatId: jest.fn()
    };
    
    const useCase = new GetMessageHistoryUseCase(mockChatRepository, mockMessageRepository);
    const input = {
      chatId: chat.id,
      userId: 'user-123',
      limit: 2 // Limit is 2, we have 3 messages, so nextCursor should be generated
    };
    
    // Act & Assert
    // This will fail because GetMessageHistoryUseCase doesn't exist
    const result = await useCase.execute(input);

    expect(result.meta).toEqual({
      nextCursor: expect.any(String),
      limit: 2
    });
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toEqual({
      id: mockMessages[0].id,
      chatId: mockMessages[0].chatId,
      senderId: mockMessages[0].senderId,
      content: mockMessages[0].content,
      createdAt: mockMessages[0].createdAt.toISOString()
    });
    expect(result.data[0]).not.toBeInstanceOf(Message);
    expect(typeof result.data[0].createdAt).toBe('string');
    
    // Verify chat existence was checked
    expect(mockChatRepository.findById).toHaveBeenCalledWith(chat.id);
    // Verify messages were fetched
    expect(mockMessageRepository.findByChatId).toHaveBeenCalledWith(
      chat.id,
      3, // limit + 1
      undefined
    );
  });
  
  it('should return messages with cursor pagination', async () => {
    // Arrange
    const chat = Chat.create('user-123', 'user-456');
    const cursor = 'eyJsYXN0SWQiOiJtc2ctMTIzIiwibGFzdFNvcnRWYWx1ZSI6MTcwMTYzMjAwMDAwMH0=';
    
    const mockChatRepository: ChatRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(chat),
      findByUserId: jest.fn(),
      updateLatestMessage: jest.fn(),
      removeParticipant: jest.fn(),
      delete: jest.fn(),
      findByParticipantId: jest.fn()
    };
    
    const mockMessageRepository: MessageRepository = {
      create: jest.fn(),
      findByChatId: jest.fn().mockResolvedValue([
        Message.create(chat.id, 'user-123', 'Message 1'),
        Message.create(chat.id, 'user-123', 'Message 2'),
        Message.create(chat.id, 'user-123', 'Message 3') // Third to trigger nextCursor
      ]),
      deleteByUserId: jest.fn(),
      deleteByChatId: jest.fn(),
      findLatestByChatId: jest.fn()
    };
    
    const useCase = new GetMessageHistoryUseCase(mockChatRepository, mockMessageRepository);
    const input = {
      chatId: chat.id,
      userId: 'user-123',
      cursor,
      limit: 2
    };
    
    // Act & Assert
    const result = await useCase.execute(input);

    expect(result.meta).toEqual({
      nextCursor: expect.any(String),
      limit: 2
    });
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toEqual(
      expect.objectContaining({
        content: 'Message 1',
        createdAt: expect.any(String)
      })
    );
    
    // Verify messages were fetched with cursor
    expect(mockMessageRepository.findByChatId).toHaveBeenCalledWith(
      chat.id,
      3, // limit + 1
      cursor
    );
  });
  
  it('should throw NotFoundError when chat does not exist', async () => {
    // Arrange
    const mockChatRepository: ChatRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(null),
      findByUserId: jest.fn(),
      updateLatestMessage: jest.fn(),
      removeParticipant: jest.fn(),
      delete: jest.fn(),
      findByParticipantId: jest.fn()
    };
    
    const mockMessageRepository: MessageRepository = {
      create: jest.fn(),
      findByChatId: jest.fn(),
      deleteByUserId: jest.fn(),
      deleteByChatId: jest.fn(),
      findLatestByChatId: jest.fn()
    };
    
    const useCase = new GetMessageHistoryUseCase(mockChatRepository, mockMessageRepository);
    const input = {
      chatId: 'non-existent-chat',
      userId: 'user-123',
      limit: 10
    };
    
    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    
    // Verify no messages were fetched
    expect(mockMessageRepository.findByChatId).not.toHaveBeenCalled();
  });
  
  it('should throw ForbiddenError when user is not participant', async () => {
    // Arrange
    const chat = Chat.create('different-user', 'different-user-2'); // Created by different user
    
    const mockChatRepository: ChatRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(chat),
      findByUserId: jest.fn(),
      updateLatestMessage: jest.fn(),
      removeParticipant: jest.fn(),
      delete: jest.fn(),
      findByParticipantId: jest.fn()
    };
    
    const mockMessageRepository: MessageRepository = {
      create: jest.fn(),
      findByChatId: jest.fn(),
      deleteByUserId: jest.fn(),
      deleteByChatId: jest.fn(),
      findLatestByChatId: jest.fn()
    };
    
    const useCase = new GetMessageHistoryUseCase(mockChatRepository, mockMessageRepository);
    const input = {
      chatId: chat.id,
      userId: 'user-123', // Not a participant
      limit: 10
    };
    
    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(ChatAccessDeniedError);
    
    // Verify no messages were fetched
    expect(mockMessageRepository.findByChatId).not.toHaveBeenCalled();
  });
  
  it('should return empty data array when no more messages', async () => {
    // Arrange
    const chat = Chat.create('user-123', 'user-456');
    
    const mockChatRepository: ChatRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(chat),
      findByUserId: jest.fn(),
      updateLatestMessage: jest.fn(),
      removeParticipant: jest.fn(),
      delete: jest.fn(),
      findByParticipantId: jest.fn()
    };
    
    const mockMessageRepository: MessageRepository = {
      create: jest.fn(),
      findByChatId: jest.fn().mockResolvedValue([]),
      deleteByUserId: jest.fn(),
      deleteByChatId: jest.fn(),
      findLatestByChatId: jest.fn()
    };
    
    const useCase = new GetMessageHistoryUseCase(mockChatRepository, mockMessageRepository);
    const input = {
      chatId: chat.id,
      userId: 'user-123',
      limit: 10
    };
    
    // Act & Assert
    await expect(useCase.execute(input)).resolves.toEqual({
      data: [],
      meta: {
        nextCursor: null,
        limit: 10
      }
    });
  });
});
