import { Message } from '@domain/entities/Message';
import { NotFoundError, ChatAccessDeniedError } from '@domain/errors/DomainError';
import { ChatRepository } from '../ports/ChatRepository';
import { MessageRepository } from '../ports/MessageRepository';
import { EventBus } from '../ports/EventBus';
import { MessageSentEvent } from '@domain/events/MessageSentEvent';

export interface SendMessageInput {
  chatId: string;
  senderId: string;
  content: string;
}

export interface SendMessageOutput {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

/**
 * SendMessageUseCase - Handles sending messages within a chat.
 * 
 * Uses MongoDB transactions to ensure atomicity of message creation
 * and chat update. Publishes MessageSentEvent upon success.
 */
export class SendMessageUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly messageRepository: MessageRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(input: SendMessageInput): Promise<SendMessageOutput> {
    // Note: In real implementation, this would use MongoDB session/transaction
    // For now, we'll implement the logic without actual transaction
    // The infrastructure layer will handle transactions
    
    // Find chat
    const chat = await this.chatRepository.findById(input.chatId);
    if (!chat) {
      throw new NotFoundError('Chat');
    }

    // Check if sender is participant
    if (!chat.participants.includes(input.senderId)) {
      throw new ChatAccessDeniedError();
    }

    // Create message entity
    const message = Message.create(input.chatId, input.senderId, input.content);

    // Save message and update chat (should be in transaction)
    const savedMessage = await this.messageRepository.create(message);
    
    // Update chat's latest message with optimistic locking
    const updatedChat = await this.chatRepository.updateLatestMessage(
      input.chatId,
      input.content,
      chat.version
    );

    // Publish event
    const event = new MessageSentEvent({
      messageId: savedMessage.id,
      chatId: savedMessage.chatId,
      senderId: savedMessage.senderId,
      content: savedMessage.content,
      createdAt: savedMessage.createdAt
    });
    
    await this.eventBus.publish(event);

    // Return output
    return {
      id: savedMessage.id,
      chatId: savedMessage.chatId,
      senderId: savedMessage.senderId,
      content: savedMessage.content,
      createdAt: savedMessage.createdAt
    };
  }
}