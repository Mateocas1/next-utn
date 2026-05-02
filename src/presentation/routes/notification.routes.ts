"use strict";

import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authMiddleware } from '../middlewares/auth';
import { JWTService } from '@infrastructure/auth/JWTService';
import { UserRepository } from '@application/ports/UserRepository';

/***
 * Creates and configures notification routes.
 *
 * @param {NotificationController} notificationController - The notification controller.
 * @param {JWTService} jwtService - The JWT service for authentication.
 * @returns {Router} - Configured Express router.
 */
export function createNotificationRoutes(
    notificationController: NotificationController,
    jwtService: JWTService,
    userRepository: Pick<UserRepository, 'findById'>
): Router {
    const router = Router();

    // All notification routes require authentication
    router.use(authMiddleware(jwtService, userRepository));

    // List notifications for the authenticated user
    router.get('/', (req, res, next) => {
        notificationController.list(req, res).catch(next);
    });

    // Mark a notification as read
    router.patch('/:id/read', (req, res, next) => {
        notificationController.markAsRead(req, res).catch(next);
    });

    return router;
}
