import { ChatRepository } from '../ports/ChatRepository';
import { EventBus } from '../ports/EventBus';
import { UserTypingEvent } from '@domain/events/UserTypingEvent';
import { NotFoundError, ChatAccessDeniedError } from '@domain/errors/DomainError';

export interface NotifyUserTypingInput {
  chatId: string;
  userId: string;
}

/**
 * NotifyUserTypingUseCase - Handles the "user typing" event.
 * Publishes UserTypingEvent to notify other participants in the chat.
 */
export class NotifyUserTypingUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(input: NotifyUserTypingInput): Promise<void> {
    // Find chat
    const chat = await this.chatRepository.findById(input.chatId);
    if (!chat) {
      throw new NotFoundError('Chat');
    }

    // Check if user is participant
    if (!chat.participants.includes(input.userId)) {
      throw new ChatAccessDeniedError();
    }

    // Publish UserTypingEvent
    const event = new UserTypingEvent({
      userId: input.userId,
      chatId: input.chatId,
    });

    await this.eventBus.publish(event);
  }
}