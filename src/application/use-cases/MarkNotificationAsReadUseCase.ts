"use strict";

import { Notification } from "../../domain/entities/Notification";
import { NotificationRepository } from "../../domain/entities/Notification";

/***
 * Use case for marking a notification as read.
 *
 * @class MarkNotificationAsReadUseCase
 */
export class MarkNotificationAsReadUseCase {
    /**
     * Creates an instance of MarkNotificationAsReadUseCase.
     *
     * @param {NotificationRepository} notificationRepository - The notification repository.
     */
    constructor(private readonly notificationRepository: NotificationRepository) {}

    /**
     * Executes the use case to mark a notification as read.
     *
     * @param {string} notificationId - The ID of the notification.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<Notification | null>} - The updated notification, or null if not found.
     */
    async execute(notificationId: string, userId: string): Promise<Notification | null> {
        // En un caso real, aquí podrías verificar que la notificación pertenece al usuario
        return this.notificationRepository.markAsRead(notificationId);
    }
}