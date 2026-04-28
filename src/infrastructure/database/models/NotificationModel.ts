"use strict";

import { Schema, model, Document } from "mongoose";

/**
 * Interface for Notification document in MongoDB.
 *
 * @interface NotificationDocument
 * @extends {Document}
 */
export interface NotificationDocument extends Document {
    userId: string;
    title: string;
    message: string;
    read: boolean;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    readAt: Date | null;
}

/**
 * Mongoose schema for Notification.
 */
const NotificationSchema = new Schema<NotificationDocument>(
    {
        userId: { type: String, required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        read: { type: Boolean, default: false },
        metadata: { type: Schema.Types.Mixed },
        createdAt: { type: Date, default: Date.now },
        readAt: { type: Date, default: null },
    },
    { timestamps: false }
);

/**
 * Mongoose model for Notification.
 */
export const NotificationModel = model<NotificationDocument>("Notification", NotificationSchema);