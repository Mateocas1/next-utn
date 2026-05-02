import { UserRepository } from '@application/ports/UserRepository';
import { MessageRepository } from '@application/ports/MessageRepository';
import { ChatRepository } from '@application/ports/ChatRepository';
import { NotificationRepository } from '@domain/entities/Notification';
import { TransactionManager } from '@application/ports/TransactionManager';
import { NotFoundError } from '@domain/errors/DomainError';

export interface DeleteUserInput {
  userId: string;
}

export class DeleteUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly messageRepository: MessageRepository,
    private readonly chatRepository: ChatRepository,
    private readonly transactionManager: TransactionManager
  ) {}

  async execute(input: DeleteUserInput): Promise<void> {
    await this.transactionManager.execute(async (session) => {
      const user = await this.userRepository.findById(input.userId, session);
      if (!user) {
        throw new NotFoundError('User');
      }

      await this.notificationRepository.deleteByUserId(input.userId, session);
      await this.messageRepository.deleteByUserId(input.userId, session);

      const chats = await this.chatRepository.findByParticipantId(input.userId, session);

      for (const chat of chats) {
        if (chat.participants.length <= 1) {
          await this.chatRepository.delete(chat.id, session);
          await this.messageRepository.deleteByChatId(chat.id, session);
          continue;
        }

        const updatedChat = await this.chatRepository.removeParticipant(chat.id, input.userId, session);
        const latestMessage = await this.messageRepository.findLatestByChatId(chat.id, session);
        await this.chatRepository.updateLatestMessage(
          chat.id,
          latestMessage?.content ?? '',
          updatedChat.version,
          session
        );
      }

      await this.userRepository.delete(input.userId, session);
    });
  }
}
