import { randomUUID } from 'crypto';

export interface MessageProps {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

export class Message {
  private constructor(private props: MessageProps) {}

  get id(): string {
    return this.props.id;
  }

  get chatId(): string {
    return this.props.chatId;
  }

  get senderId(): string {
    return this.props.senderId;
  }

  get content(): string {
    return this.props.content;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(chatId: string, senderId: string, content: string): Message {
    if (content.length < 1 || content.length > 2000) {
      throw new Error('Content must be between 1 and 2000 characters');
    }

    return new Message({
      id: randomUUID(),
      chatId,
      senderId,
      content,
      createdAt: new Date(),
    });
  }

  /**
   * Reconstruct a Message from persisted data.
   * Used by repositories to hydrate entities from database.
   */
  static reconstruct(props: MessageProps): Message {
    return new Message(props);
  }
}