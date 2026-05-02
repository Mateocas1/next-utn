"use strict";

import { Notification, NotificationRepository } from "@domain/entities/Notification";
import { Model } from "mongoose";
import { NotificationDocument, NotificationModel } from "../models/NotificationModel";

/**
 * Mongoose implementation of the NotificationRepository.
 *
 * @class MongooseNotificationRepository
 * @implements {NotificationRepository}
 */
export class MongooseNotificationRepository implements NotificationRepository {
    private model: Model<NotificationDocument>;

    /**
     * Creates an instance of MongooseNotificationRepository.
     *
     * @param {Model<NotificationDocument>} model - Mongoose model for Notification.
     */
    constructor(model: Model<NotificationDocument>) {
        this.model = model;
    }

    /**
     * Saves a notification.
     *
     * @param {Notification} notification - The notification to save.
     * @returns {Promise<Notification>} - The saved notification.
     */
    async save(notification: Notification): Promise<Notification> {
        const doc = new this.model({
            userId: notification.userId,
            title: notification.title,
            message: notification.message,
            read: notification.read,
            metadata: notification.metadata,
            createdAt: notification.createdAt,
            readAt: notification.readAt,
        });
        const savedDoc = await doc.save();
        return this.toEntity(savedDoc);
    }

    /**
     * Finds notifications by user ID.
     *
     * @param {string} userId - The user ID to filter notifications.
     * @returns {Promise<Notification[]>} - List of notifications for the user.
     */
    async findByUserId(userId: string): Promise<Notification[]> {
        const docs = await this.model.find({ userId }).sort({ createdAt: -1 }).exec();
        return docs.map((doc) => this.toEntity(doc));
    }

    /**
     * Marks a notification as read.
     *
     * @param {string} id - The notification ID.
     * @returns {Promise<Notification | null>} - The updated notification, or null if not found.
     */
    async markAsRead(id: string): Promise<Notification | null> {
        const doc = await this.model
            .findByIdAndUpdate(id, { read: true, readAt: new Date() }, { new: true })
            .exec();
        return doc ? this.toEntity(doc) : null;
    }

    async deleteByUserId(userId: string, session?: any): Promise<void> {
        await this.model.deleteMany({ userId }, { session }).exec();
    }

    /**
     * Converts a Mongoose document to a Notification entity.
     *
     * @private
     * @param {NotificationDocument} doc - The Mongoose document.
     * @returns {Notification} - The Notification entity.
     */
    private toEntity(doc: NotificationDocument): Notification {
        const notification = new Notification(
            doc.userId,
            doc.title,
            doc.message,
            doc.metadata
        );
        notification.id = doc._id.toString();
        notification.read = doc.read;
        notification.createdAt = doc.createdAt;
        notification.readAt = doc.readAt;
        return notification;
    }
}
