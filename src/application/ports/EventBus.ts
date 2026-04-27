import { DomainEvent } from '@domain/events/DomainEvent';

/**
 * EventBus port interface.
 * 
 * Defines the contract for event publishing.
 * Implementations are provided by the infrastructure layer.
 */
export interface EventBus {
  /**
   * Publish a domain event.
   * @param event The domain event to publish
   */
  publish(event: DomainEvent): Promise<void>;
}