import { DomainEvent } from './DomainEvent';

export interface UserTypingEventPayload {
  userId: string;
  chatId: string;
}

export class UserTypingEvent implements DomainEvent {
  readonly type = 'USER_TYPING';
  readonly timestamp = new Date();

  constructor(public readonly payload: UserTypingEventPayload) {}
}