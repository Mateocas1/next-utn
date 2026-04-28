"use strict";

import { ListNotificationsUseCase } from './ListNotificationsUseCase';
import { Notification } from '../../domain/entities/Notification';
import { NotificationRepository } from '../../domain/entities/Notification';

// Mock NotificationRepository
const mockNotificationRepository: jest.Mocked<NotificationRepository> = {
    save: jest.fn(),
    findByUserId: jest.fn(),
    markAsRead: jest.fn(),
};

describe('ListNotificationsUseCase', () => {
    let listNotificationsUseCase: ListNotificationsUseCase;

    beforeEach(() => {
        listNotificationsUseCase = new ListNotificationsUseCase(mockNotificationRepository);
        jest.clearAllMocks();
    });

    it('should return notifications for a user', async () => {
        // Arrange
        const mockNotifications = [
            new Notification('user-123', 'Title 1', 'Message 1'),
            new Notification('user-123', 'Title 2', 'Message 2'),
        ];
        mockNotifications[0].id = 'notification-1';
        mockNotifications[1].id = 'notification-2';
        
        mockNotificationRepository.findByUserId.mockResolvedValue(mockNotifications);

        // Act
        const result = await listNotificationsUseCase.execute('user-123');

        // Assert
        expect(mockNotificationRepository.findByUserId).toHaveBeenCalledWith('user-123');
        expect(result).toEqual(mockNotifications);
    });

    it('should return an empty array if no notifications exist', async () => {
        // Arrange
        mockNotificationRepository.findByUserId.mockResolvedValue([]);

        // Act
        const result = await listNotificationsUseCase.execute('user-123');

        // Assert
        expect(mockNotificationRepository.findByUserId).toHaveBeenCalledWith('user-123');
        expect(result).toEqual([]);
    });

    it('should throw an error if repository fails', async () => {
        // Arrange
        mockNotificationRepository.findByUserId.mockRejectedValue(new Error('Find failed'));

        // Act & Assert
        await expect(listNotificationsUseCase.execute('user-123')).rejects.toThrow('Find failed');
    });
});