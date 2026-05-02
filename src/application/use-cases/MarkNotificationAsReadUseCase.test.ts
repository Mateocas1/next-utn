"use strict";

import { MarkNotificationAsReadUseCase } from './MarkNotificationAsReadUseCase';
import { Notification } from '../../domain/entities/Notification';
import { NotificationRepository } from '../../domain/entities/Notification';

// Mock NotificationRepository
const mockNotificationRepository: jest.Mocked<NotificationRepository> = {
    save: jest.fn(),
    findByUserId: jest.fn(),
    markAsRead: jest.fn(),
    deleteByUserId: jest.fn(),
};

describe('MarkNotificationAsReadUseCase', () => {
    let markNotificationAsReadUseCase: MarkNotificationAsReadUseCase;

    beforeEach(() => {
        markNotificationAsReadUseCase = new MarkNotificationAsReadUseCase(mockNotificationRepository);
        jest.clearAllMocks();
    });

    it('should mark a notification as read', async () => {
        // Arrange
        const mockNotification = new Notification('user-123', 'Test Title', 'Test Message');
        mockNotification.id = 'notification-123';
        mockNotification.read = true;
        mockNotification.readAt = new Date();
        
        mockNotificationRepository.markAsRead.mockResolvedValue(mockNotification);

        // Act
        const result = await markNotificationAsReadUseCase.execute('notification-123', 'user-123');

        // Assert
        expect(mockNotificationRepository.markAsRead).toHaveBeenCalledWith('notification-123');
        expect(result).toEqual(mockNotification);
    });

    it('should return null if notification not found', async () => {
        // Arrange
        mockNotificationRepository.markAsRead.mockResolvedValue(null);

        // Act
        const result = await markNotificationAsReadUseCase.execute('notification-123', 'user-123');

        // Assert
        expect(mockNotificationRepository.markAsRead).toHaveBeenCalledWith('notification-123');
        expect(result).toBeNull();
    });

    it('should throw an error if repository fails', async () => {
        // Arrange
        mockNotificationRepository.markAsRead.mockRejectedValue(new Error('Mark as read failed'));

        // Act & Assert
        await expect(
            markNotificationAsReadUseCase.execute('notification-123', 'user-123')
        ).rejects.toThrow('Mark as read failed');
    });
});
