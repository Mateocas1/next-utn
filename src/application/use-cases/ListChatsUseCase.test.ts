import { ListChatsUseCase } from './ListChatsUseCase';
import { Chat } from '@domain/entities/Chat';
import { ChatRepository } from '../ports/ChatRepository';
import { InvalidCursorError } from '@domain/errors/DomainError';

describe('ListChatsUseCase', () => {
  // Test will fail because ListChatsUseCase doesn't exist yet
  // That's the RED phase
  
  it('should return first page of chats when no cursor provided', async () => {
    // Arrange
    const mockChats = [
      Chat.create('user-123'),
      Chat.create('user-123'),
      Chat.create('user-123') // Third chat to trigger nextCursor
    ];
    
    const mockChatRepository: ChatRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn().mockResolvedValue(mockChats),
      updateLatestMessage: jest.fn()
    };
    
    const useCase = new ListChatsUseCase(mockChatRepository);
    const input = {
      userId: 'user-123',
      limit: 2 // Limit is 2, we have 3 chats, so nextCursor should be generated
    };
    
    // Act & Assert
    // This will fail because ListChatsUseCase doesn't exist
    await expect(useCase.execute(input)).resolves.toEqual({
      data: mockChats.slice(0, 2).map(chat => ({
        id: chat.id,
        participants: chat.participants,
        latestMessagePreview: chat.latestMessagePreview,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      })),
      meta: {
        nextCursor: expect.any(String),
        limit: 2
      }
    });
    
    // Verify repository was called with correct parameters (limit + 1)
    expect(mockChatRepository.findByUserId).toHaveBeenCalledWith(
      'user-123',
      3, // limit + 1
      undefined
    );
  });
  
  it('should return chats with cursor pagination', async () => {
    // Arrange
    const mockChats = [
      Chat.create('user-123'),
      Chat.create('user-123'),
      Chat.create('user-123'),
      Chat.create('user-123'),
      Chat.create('user-123'),
      Chat.create('user-123') // Sixth chat to trigger nextCursor
    ];
    const cursor = 'eyJsYXN0SWQiOiJjaGF0LTEyMyIsImxhc3RTb3J0VmFsdWUiOjE3MDE2MzIwMDAwMDB9'; // Example cursor
    
    const mockChatRepository: ChatRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn().mockResolvedValue(mockChats),
      updateLatestMessage: jest.fn()
    };
    
    const useCase = new ListChatsUseCase(mockChatRepository);
    const input = {
      userId: 'user-123',
      cursor,
      limit: 5
    };
    
    // Act & Assert
    await expect(useCase.execute(input)).resolves.toEqual({
      data: mockChats.slice(0, 5).map(chat => ({
        id: chat.id,
        participants: chat.participants,
        latestMessagePreview: chat.latestMessagePreview,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      })),
      meta: {
        nextCursor: expect.any(String),
        limit: 5
      }
    });
    
    // Verify repository was called with cursor and limit + 1
    expect(mockChatRepository.findByUserId).toHaveBeenCalledWith(
      'user-123',
      6, // limit + 1
      cursor
    );
  });
  
  it('should return empty data array when no more chats', async () => {
    // Arrange
    const mockChatRepository: ChatRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn().mockResolvedValue([]),
      updateLatestMessage: jest.fn()
    };
    
    const useCase = new ListChatsUseCase(mockChatRepository);
    const input = {
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
  
  it('should propagate InvalidCursorError from repository', async () => {
    // Arrange
    const mockChatRepository: ChatRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn().mockRejectedValue(new InvalidCursorError()),
      updateLatestMessage: jest.fn()
    };
    
    const useCase = new ListChatsUseCase(mockChatRepository);
    const input = {
      userId: 'user-123',
      cursor: 'invalid-cursor',
      limit: 10
    };
    
    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(InvalidCursorError);
  });
});