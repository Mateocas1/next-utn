"use strict";

/**
 * Notification entity representing a user notification.
 *
 * @class Notification
 */
export class Notification {
    /**
     * Unique identifier for the notification.
     * @type {string}
     */
    id: string;

    /**
     * ID of the user who receives the notification.
     * @type {string}
     */
    userId: string;

    /**
     * Title or summary of the notification.
     * @type {string}
     */
    title: string;

    /**
     * Detailed message of the notification.
     * @type {string}
     */
    message: string;

    /**
     * Indicates if the notification has been read.
     * @type {boolean}
     */
    read: boolean;

    /**
     * Optional metadata associated with the notification.
     * @type {Record<string, unknown>}
     */
    metadata?: Record<string, unknown>;

    /**
     * Timestamp of when the notification was created.
     * @type {Date}
     */
    createdAt: Date;

    /**
     * Timestamp of when the notification was read. Null if not read.
     * @type {Date | null}
     */
    readAt: Date | null;

    /**
     * Creates an instance of Notification.
     *
     * @param {string} userId - ID of the user who receives the notification.
     * @param {string} title - Title or summary of the notification.
     * @param {string} message - Detailed message of the notification.
     * @param {Record<string, unknown>} [metadata] - Optional metadata.
     */
    constructor(
        userId: string,
        title: string,
        message: string,
        metadata?: Record<string, unknown>
    ) {
        this.id = ""; // Will be set by the repository
        this.userId = userId;
        this.title = title;
        this.message = message;
        this.read = false;
        this.metadata = metadata;
        this.createdAt = new Date();
        this.readAt = null;
    }
}

/**
 * Interface for Notification repository.
 *
 * @interface NotificationRepository
 */
export interface NotificationRepository {
    /**
     * Saves a notification.
     *
     * @param {Notification} notification - The notification to save.
     * @returns {Promise<Notification>} - The saved notification.
     */
    save(notification: Notification): Promise<Notification>;

    /**
     * Finds notifications by user ID.
     *
     * @param {string} userId - The user ID to filter notifications.
     * @returns {Promise<Notification[]>} - List of notifications for the user.
     */
    findByUserId(userId: string): Promise<Notification[]>;

    /**
     * Marks a notification as read.
     *
     * @param {string} id - The notification ID.
     * @returns {Promise<Notification | null>} - The updated notification, or null if not found.
     */
    markAsRead(id: string): Promise<Notification | null>;
}