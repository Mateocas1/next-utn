import { DomainEvent } from './DomainEvent';

export interface MessageSentEventPayload {
  messageId: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

export class MessageSentEvent implements DomainEvent {
  readonly type = 'MESSAGE_SENT';
  readonly timestamp = new Date();

  constructor(public readonly payload: MessageSentEventPayload) {}
}