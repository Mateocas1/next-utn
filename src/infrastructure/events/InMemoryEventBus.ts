import { EventEmitter } from 'events';
import { DomainEvent } from '@domain/events/DomainEvent';
import { EventBus as EventBusPort } from '@application/ports/EventBus';

/***
 * In-memory implementation of EventBus.
 *
 * @class InMemoryEventBus
 * @implements {EventBusPort}
 */
export class InMemoryEventBus implements EventBusPort {
    private readonly emitter = new EventEmitter();
    private readonly handlers = new Map<string, ((event: DomainEvent) => Promise<void>)[]>();

    /**
     * Publishes a domain event and triggers all registered handlers.
     *
     * @param {DomainEvent} event - The domain event to publish.
     * @returns {Promise<void>}
     */
    async publish(event: DomainEvent): Promise<void> {
        // Emit the event for backward compatibility
        this.emitter.emit(event.type, event);
        
        // Execute all registered handlers
        const eventHandlers = this.handlers.get(event.type) || [];
        for (const handler of eventHandlers) {
            await handler(event);
        }
    }

    /**
     * Subscribes a handler to a specific event type.
     *
     * @param {string} eventType - The event type to subscribe to.
     * @param {(event: DomainEvent) => Promise<void>} handler - The handler function.
     */
    subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType)?.push(handler);
    }

    /**
     * Unsubscribes a handler from a specific event type.
     *
     * @param {string} eventType - The event type to unsubscribe from.
     * @param {(event: DomainEvent) => Promise<void>} handler - The handler function.
     */
    unsubscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void {
        const eventHandlers = this.handlers.get(eventType) || [];
        this.handlers.set(
            eventType,
            eventHandlers.filter((h) => h !== handler)
        );
    }

    // Optional: Add subscription method for testing or internal use (legacy)
    subscribeLegacy(eventType: string, handler: (event: DomainEvent) => void): void {
        this.emitter.on(eventType, handler);
    }

    // Optional: Remove subscription (legacy)
    unsubscribeLegacy(eventType: string, handler: (event: DomainEvent) => void): void {
        this.emitter.off(eventType, handler);
    }
}