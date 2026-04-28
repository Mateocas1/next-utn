"use strict";

import { Request, Response } from 'express';
import { ListNotificationsUseCase } from '@application/use-cases/ListNotificationsUseCase';
import { MarkNotificationAsReadUseCase } from '@application/use-cases/MarkNotificationAsReadUseCase';
import { successResponse } from '../utils/response';

/***
 * Controller for notification-related endpoints.
 *
 * @class NotificationController
 */
export class NotificationController {
    /**
     * Creates an instance of NotificationController.
     *
     * @param {ListNotificationsUseCase} listNotificationsUseCase - Use case for listing notifications.
     * @param {MarkNotificationAsReadUseCase} markNotificationAsReadUseCase - Use case for marking notifications as read.
     */
    constructor(
        private readonly listNotificationsUseCase: ListNotificationsUseCase,
        private readonly markNotificationAsReadUseCase: MarkNotificationAsReadUseCase
    ) {}

    /**
     * Lists notifications for the authenticated user.
     *
     * @param {Request} req - Express request.
     * @param {Response} res - Express response.
     * @returns {Promise<void>}
     */
    async list(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!; // From auth middleware
            const notifications = await this.listNotificationsUseCase.execute(userId);
            res.status(200).json(successResponse(notifications));
        } catch (error) {
            throw error;
        }
    }

    /**
     * Marks a notification as read.
     *
     * @param {Request} req - Express request.
     * @param {Response} res - Express response.
     * @returns {Promise<void>}
     */
    async markAsRead(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!; // From auth middleware
            const notificationId = req.params.id as string;
            const notification = await this.markNotificationAsReadUseCase.execute(
                notificationId,
                userId
            );
            
            if (!notification) {
                res.status(404).json(successResponse(null, { message: 'Notification not found' }));
                return;
            }
            
            res.status(200).json(successResponse(notification));
        } catch (error) {
            throw error;
        }
    }
}