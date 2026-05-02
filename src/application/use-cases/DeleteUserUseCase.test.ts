import { DeleteUserUseCase } from './DeleteUserUseCase';
import { UserRepository } from '../ports/UserRepository';
import { NotificationRepository } from '@domain/entities/Notification';
import { MessageRepository } from '../ports/MessageRepository';
import { ChatRepository } from '../ports/ChatRepository';
import { TransactionManager } from '../ports/TransactionManager';
import { User } from '@domain/entities/User';
import { Chat } from '@domain/entities/Chat';
import { Message } from '@domain/entities/Message';
import { NotFoundError } from '@domain/errors/DomainError';

describe('DeleteUserUseCase', () => {
  const session = { id: 'session-1' };

  const makeDeps = () => {
    const userRepository: UserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    const notificationRepository: NotificationRepository = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      markAsRead: jest.fn(),
      deleteByUserId: jest.fn(),
    };

    const messageRepository: MessageRepository = {
      create: jest.fn(),
      findByChatId: jest.fn(),
      deleteByUserId: jest.fn(),
      deleteByChatId: jest.fn(),
      findLatestByChatId: jest.fn(),
    };

    const chatRepository: ChatRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      updateLatestMessage: jest.fn(),
      removeParticipant: jest.fn(),
      delete: jest.fn(),
      findByParticipantId: jest.fn(),
    };

    const transactionManager: TransactionManager = {
      execute: jest.fn(async (operation) => operation(session)),
    };

    return {
      userRepository,
      notificationRepository,
      messageRepository,
      chatRepository,
      transactionManager,
    };
  };

  it('should cascade delete user data in transaction', async () => {
    const deps = makeDeps();
    const user = User.create('delete@example.com', 'Delete', 'hash-delete');
    const chatToDelete = Chat.reconstruct({
      id: 'chat-delete',
      participants: [user.id],
      latestMessagePreview: 'bye',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0,
    });
    const chatTwoParticipants = Chat.reconstruct({
      id: 'chat-two-participants',
      participants: [user.id, 'peer-user'],
      latestMessagePreview: 'stale',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 2,
    });
    const chatToKeep = Chat.reconstruct({
      id: 'chat-keep',
      participants: [user.id, 'p2', 'p3'],
      latestMessagePreview: 'old',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 4,
    });

    (deps.userRepository.findById as jest.Mock).mockResolvedValue(user);
    (deps.chatRepository.findByParticipantId as jest.Mock).mockResolvedValue([
      chatToDelete,
      chatTwoParticipants,
      chatToKeep,
    ]);
    (deps.chatRepository.removeParticipant as jest.Mock).mockResolvedValue(
      Chat.reconstruct({
        id: 'chat-keep',
        participants: ['p2', 'p3'],
        latestMessagePreview: 'old',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 5,
      })
    );
    (deps.chatRepository.removeParticipant as jest.Mock).mockResolvedValueOnce(
      Chat.reconstruct({
        id: 'chat-two-participants',
        participants: ['peer-user'],
        latestMessagePreview: 'stale',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 3,
      })
    );
    (deps.chatRepository.removeParticipant as jest.Mock).mockResolvedValueOnce(
      Chat.reconstruct({
        id: 'chat-keep',
        participants: ['p2', 'p3'],
        latestMessagePreview: 'old',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 5,
      })
    );
    (deps.messageRepository.findLatestByChatId as jest.Mock).mockResolvedValueOnce(
      Message.reconstruct({
        id: 'm-two',
        chatId: 'chat-two-participants',
        senderId: 'peer-user',
        content: 'peer latest',
        createdAt: new Date(),
      })
    );
    (deps.messageRepository.findLatestByChatId as jest.Mock).mockResolvedValue(
      Message.reconstruct({
        id: 'm1',
        chatId: 'chat-keep',
        senderId: 'p2',
        content: 'new latest',
        createdAt: new Date(),
      })
    );

    const useCase = new DeleteUserUseCase(
      deps.userRepository,
      deps.notificationRepository,
      deps.messageRepository,
      deps.chatRepository,
      deps.transactionManager
    );

    await expect(useCase.execute({ userId: user.id })).resolves.toBeUndefined();

    expect(deps.transactionManager.execute).toHaveBeenCalledTimes(1);
    expect(deps.userRepository.findById).toHaveBeenCalledWith(user.id, session);
    expect(deps.notificationRepository.deleteByUserId).toHaveBeenCalledWith(user.id, session);
    expect(deps.messageRepository.deleteByUserId).toHaveBeenCalledWith(user.id, session);

    expect(deps.chatRepository.delete).toHaveBeenCalledWith('chat-delete', session);
    expect(deps.messageRepository.deleteByChatId).toHaveBeenCalledWith('chat-delete', session);
    expect(deps.chatRepository.delete).not.toHaveBeenCalledWith('chat-two-participants', session);
    expect(deps.messageRepository.deleteByChatId).not.toHaveBeenCalledWith('chat-two-participants', session);

    expect(deps.chatRepository.findByParticipantId).toHaveBeenCalledWith(user.id, session);
    expect(deps.chatRepository.removeParticipant).toHaveBeenCalledWith('chat-two-participants', user.id, session);
    expect(deps.chatRepository.removeParticipant).toHaveBeenCalledWith('chat-keep', user.id, session);
    expect(deps.messageRepository.findLatestByChatId).toHaveBeenCalledWith('chat-two-participants', session);
    expect(deps.messageRepository.findLatestByChatId).toHaveBeenCalledWith('chat-keep', session);
    expect(deps.chatRepository.updateLatestMessage).toHaveBeenCalledWith('chat-two-participants', 'peer latest', 3, session);
    expect(deps.chatRepository.updateLatestMessage).toHaveBeenCalledWith('chat-keep', 'new latest', 5, session);

    expect(deps.userRepository.delete).toHaveBeenCalledWith(user.id, session);
  });

  it('should throw NotFoundError when user does not exist', async () => {
    const deps = makeDeps();
    (deps.userRepository.findById as jest.Mock).mockResolvedValue(null);

    const useCase = new DeleteUserUseCase(
      deps.userRepository,
      deps.notificationRepository,
      deps.messageRepository,
      deps.chatRepository,
      deps.transactionManager
    );

    await expect(useCase.execute({ userId: 'missing-user' })).rejects.toThrow(NotFoundError);
    expect(deps.transactionManager.execute).toHaveBeenCalledTimes(1);
    expect(deps.userRepository.findById).toHaveBeenCalledWith('missing-user', session);
  });

  it('should rollback when a cascade step fails', async () => {
    const deps = makeDeps();
    const user = User.create('rollback@example.com', 'Rollback', 'hash-rollback');
    (deps.userRepository.findById as jest.Mock).mockResolvedValue(user);
    (deps.notificationRepository.deleteByUserId as jest.Mock).mockRejectedValue(new Error('db failure'));

    const useCase = new DeleteUserUseCase(
      deps.userRepository,
      deps.notificationRepository,
      deps.messageRepository,
      deps.chatRepository,
      deps.transactionManager
    );

    await expect(useCase.execute({ userId: user.id })).rejects.toThrow('db failure');
    expect(deps.transactionManager.execute).toHaveBeenCalledTimes(1);
    expect(deps.userRepository.delete).not.toHaveBeenCalled();
  });
});
