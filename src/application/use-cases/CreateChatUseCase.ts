import { Chat } from '@domain/entities/Chat';
import { ChatRepository } from '../ports/ChatRepository';

export interface CreateChatInput {
  userId: string;
}

export interface CreateChatOutput {
  id: string;
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CreateChatUseCase - Handles chat creation.
 * 
 * Creates a new chat with the authenticated user as the first participant.
 */
export class CreateChatUseCase {
  constructor(
    private readonly chatRepository: ChatRepository
  ) {}

  async execute(input: CreateChatInput): Promise<CreateChatOutput> {
    // Create chat entity
    const chat = Chat.create(input.userId);

    // Save chat
    const savedChat = await this.chatRepository.create(chat);

    // Return output
    return {
      id: savedChat.id,
      participants: savedChat.participants,
      createdAt: savedChat.createdAt,
      updatedAt: savedChat.updatedAt
    };
  }
}