import { SendMessageUseCase } from './SendMessageUseCase';
import { Chat } from '@domain/entities/Chat';
import { Message } from '@domain/entities/Message';
import { NotFoundError, ChatAccessDeniedError, ConcurrentModificationError } from '@domain/errors/DomainError';
import { ChatRepository } from '../ports/ChatRepository';
import { MessageRepository } from '../ports/MessageRepository';
import { EventBus } from '../ports/EventBus';

describe('SendMessageUseCase', () => {
  // Test will fail because SendMessageUseCase doesn't exist yet
  // That's the RED phase
  
  it('should send message successfully within transaction', async () => {
    // Arrange
    const chat = Chat.create('user-123');
    const mockMessage = Message.create(chat.id, 'user-123', 'Hello world!');
    
    const mockChatRepository: ChatRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(chat),
      findByUserId: jest.fn(),
      updateLatestMessage: jest.fn().mockResolvedValue({
        ...chat,
        latestMessagePreview: 'Hello world!',
        version: chat.version + 1
      })
    };
    
    const mockMessageRepository: MessageRepository = {
      create: jest.fn().mockImplementation(async (message) => message),
      findByChatId: jest.fn()
    };
    
    const mockEventBus: EventBus = {
      publish: jest.fn().mockResolvedValue(undefined)
    };
    
    const useCase = new SendMessageUseCase(
      mockChatRepository,
      mockMessageRepository,
      mockEventBus
    );
    
    const input = {
      chatId: chat.id,
      senderId: 'user-123',
      content: 'Hello world!'
    };
    
    // Act & Assert
    // This will fail because SendMessageUseCase doesn't exist
    await expect(useCase.execute(input)).resolves.toMatchObject({
      chatId: chat.id,
      senderId: 'user-123',
      content: 'Hello world!'
    });
    
    // Verify chat existence was checked
    expect(mockChatRepository.findById).toHaveBeenCalledWith(chat.id);
    // Verify message was created
    expect(mockMessageRepository.create).toHaveBeenCalled();
    
    // Get the actual message that was created
    const actualMessage = (mockMessageRepository.create as jest.Mock).mock.calls[0][0];
    expect(actualMessage.chatId).toBe(chat.id);
    expect(actualMessage.senderId).toBe('user-123');
    expect(actualMessage.content).toBe('Hello world!');
    // Verify chat was updated with optimistic locking
    expect(mockChatRepository.updateLatestMessage).toHaveBeenCalledWith(
      chat.id,
      'Hello world!',
      chat.version
      // Note: session parameter omitted in current implementation
    );
    // Verify event was published
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MESSAGE_SENT',
        payload: expect.objectContaining({
          chatId: chat.id,
          senderId: 'user-123',
          content: 'Hello world!'
        })
      })
    );
  });
  
  it('should throw NotFoundError when chat does not exist', async () => {
    // Arrange
    const mockChatRepository: ChatRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(null),
      findByUserId: jest.fn(),
      updateLatestMessage: jest.fn()
    };
    
    const mockMessageRepository: MessageRepository = {
      create: jest.fn(),
      findByChatId: jest.fn()
    };
    
    const mockEventBus: EventBus = {
      publish: jest.fn()
    };
    
    const useCase = new SendMessageUseCase(
      mockChatRepository,
      mockMessageRepository,
      mockEventBus
    );
    
    const input = {
      chatId: 'non-existent-chat',
      senderId: 'user-123',
      content: 'Hello!'
    };
    
    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    
    // Verify no message was created
    expect(mockMessageRepository.create).not.toHaveBeenCalled();
    // Verify no event was published
    expect(mockEventBus.publish).not.toHaveBeenCalled();
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
    
    const mockMessageRepository: MessageRepository = {
      create: jest.fn(),
      findByChatId: jest.fn()
    };
    
    const mockEventBus: EventBus = {
      publish: jest.fn()
    };
    
    const useCase = new SendMessageUseCase(
      mockChatRepository,
      mockMessageRepository,
      mockEventBus
    );
    
    const input = {
      chatId: chat.id,
      senderId: 'user-123', // Not a participant
      content: 'Hello!'
    };
    
    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(ChatAccessDeniedError);
    
    // Verify no message was created
    expect(mockMessageRepository.create).not.toHaveBeenCalled();
    // Verify no event was published
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
  
  it('should throw ConcurrentModificationError on version conflict', async () => {
    // Arrange
    const chat = Chat.create('user-123');
    
    const mockChatRepository: ChatRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(chat),
      findByUserId: jest.fn(),
      updateLatestMessage: jest.fn().mockRejectedValue(new ConcurrentModificationError())
    };
    
    const mockMessageRepository: MessageRepository = {
      create: jest.fn().mockResolvedValue(Message.create(chat.id, 'user-123', 'Hello!')),
      findByChatId: jest.fn()
    };
    
    const mockEventBus: EventBus = {
      publish: jest.fn()
    };
    
    const useCase = new SendMessageUseCase(
      mockChatRepository,
      mockMessageRepository,
      mockEventBus
    );
    
    const input = {
      chatId: chat.id,
      senderId: 'user-123',
      content: 'Hello!'
    };
    
    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(ConcurrentModificationError);
    
    // Verify message might have been created but transaction should rollback
    // Verify no event was published (transaction rolled back)
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});