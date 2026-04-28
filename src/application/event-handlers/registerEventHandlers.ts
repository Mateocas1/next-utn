"use strict";

import { EventBus } from "../ports/EventBus";
import { MessageSentNotificationHandler } from "./MessageSentNotificationHandler";
import { SendNotificationUseCase } from "../use-cases/SendNotificationUseCase";

/***
 * Registers all event handlers in the EventBus.
 *
 * @param {EventBus} eventBus - The EventBus instance.
 * @param {any} notificationRepository - The notification repository.
 */
export function registerEventHandlers(
    eventBus: EventBus,
    notificationRepository: any
): void {
    // Create use cases
    const sendNotificationUseCase = new SendNotificationUseCase(
        notificationRepository,
        eventBus
    );
    
    // Create handlers
    const messageSentNotificationHandler = new MessageSentNotificationHandler(
        sendNotificationUseCase
    );
    
    // Register handlers
    eventBus.subscribe("MESSAGE_SENT", (event) => messageSentNotificationHandler.handle(event as any));
}