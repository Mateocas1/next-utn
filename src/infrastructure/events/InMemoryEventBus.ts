import { EventEmitter } from 'events';
import { DomainEvent } from '@domain/events/DomainEvent';
import { EventBus as EventBusPort } from '@application/ports/EventBus';

export class InMemoryEventBus implements EventBusPort {
  private readonly emitter = new EventEmitter();

  async publish(event: DomainEvent): Promise<void> {
    // Emit the event synchronously for now
    // In production, this could be async with queue/worker
    this.emitter.emit(event.type, event);
  }

  // Optional: Add subscription method for testing or internal use
  subscribe(eventType: string, handler: (event: DomainEvent) => void): void {
    this.emitter.on(eventType, handler);
  }

  // Optional: Remove subscription
  unsubscribe(eventType: string, handler: (event: DomainEvent) => void): void {
    this.emitter.off(eventType, handler);
  }
}