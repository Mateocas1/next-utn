import { randomUUID } from 'crypto';

export interface ChatProps {
  id: string;
  participants: string[];
  latestMessagePreview?: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export class Chat {
  private constructor(private props: ChatProps) {}

  get id(): string {
    return this.props.id;
  }

  get participants(): string[] {
    return [...this.props.participants];
  }

  get latestMessagePreview(): string | undefined {
    return this.props.latestMessagePreview;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get version(): number {
    return this.props.version;
  }

  static create(creatorId: string, recipientId: string): Chat {
    return new Chat({
      id: randomUUID(),
      participants: [creatorId, recipientId],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0,
    });
  }

  isParticipant(userId: string): boolean {
    return this.props.participants.includes(userId);
  }

  updateLatestMessage(preview: string): void {
    this.props.latestMessagePreview = preview;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  /**
   * Reconstruct a Chat from persisted data.
   * Used by repositories to hydrate entities from database.
   */
  static reconstruct(props: ChatProps): Chat {
    return new Chat(props);
  }
}
