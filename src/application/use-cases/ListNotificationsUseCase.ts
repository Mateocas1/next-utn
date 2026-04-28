"use strict";

import { Notification } from "../../domain/entities/Notification";
import { NotificationRepository } from "../../domain/entities/Notification";

/***
 * Use case for listing notifications for a user.
 *
 * @class ListNotificationsUseCase
 */
export class ListNotificationsUseCase {
    /**
     * Creates an instance of ListNotificationsUseCase.
     *
     * @param {NotificationRepository} notificationRepository - The notification repository.
     */
    constructor(private readonly notificationRepository: NotificationRepository) {}

    /**
     * Executes the use case to list notifications for a user.
     *
     * @param {string} userId - The ID of the user.
     * @returns {Promise<Notification[]>} - List of notifications.
     */
    async execute(userId: string): Promise<Notification[]> {
        return this.notificationRepository.findByUserId(userId);
    }
}