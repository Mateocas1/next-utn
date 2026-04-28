"use strict";

import { Notification } from "../../domain/entities/Notification";
import { NotificationRepository } from "../../domain/entities/Notification";
import { EventBus } from "../ports/EventBus";
import { NotificationSentEvent } from "../../domain/events/NotificationSentEvent";

/***
 * Use case for sending a notification.
 *
 * @class SendNotificationUseCase
 */
export class SendNotificationUseCase {
    private notificationRepository: NotificationRepository;
    private eventBus: EventBus;

    /**
     * Creates an instance of SendNotificationUseCase.
     *
     * @param {NotificationRepository} notificationRepository - The notification repository.
     * @param {EventBus} eventBus - The event bus.
     */
    constructor(notificationRepository: NotificationRepository, eventBus: EventBus) {
        this.notificationRepository = notificationRepository;
        this.eventBus = eventBus;
    }

    /**
     * Executes the use case to send a notification.
     *
     * @param {string} userId - The ID of the user to notify.
     * @param {string} title - The title of the notification.
     * @param {string} message - The message of the notification.
     * @param {Record<string, unknown>} [metadata] - Optional metadata.
     * @returns {Promise<Notification>} - The created notification.
     */
    async execute(
        userId: string,
        title: string,
        message: string,
        metadata?: Record<string, unknown>
    ): Promise<Notification> {
        const notification = new Notification(userId, title, message, metadata);
        const savedNotification = await this.notificationRepository.save(notification);

        // Publish event
        const event = new NotificationSentEvent(savedNotification);
        await this.eventBus.publish(event);

        return savedNotification;
    }
}