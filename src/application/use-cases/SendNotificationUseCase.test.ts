"use strict";

import { SendNotificationUseCase } from './SendNotificationUseCase';
import { Notification } from '../../domain/entities/Notification';
import { NotificationRepository } from '../../domain/entities/Notification';
import { EventBus } from '../../infrastructure/events/EventBus';
import { NotificationSentEvent } from '../../domain/events/NotificationSentEvent';

// Mock NotificationRepository
const mockNotificationRepository: jest.Mocked<NotificationRepository> = {
    save: jest.fn(),
    findByUserId: jest.fn(),
    markAsRead: jest.fn(),
};

// Mock EventBus
const mockEventBus: jest.Mocked<EventBus> = {
    publish: jest.fn(),
};

describe('SendNotificationUseCase', () => {
    let sendNotificationUseCase: SendNotificationUseCase;

    beforeEach(() => {
        sendNotificationUseCase = new SendNotificationUseCase(
            mockNotificationRepository,
            mockEventBus
        );
        jest.clearAllMocks();
    });

    it('should save a notification and publish an event', async () => {
        // Arrange
        const mockNotification = new Notification(
            'user-123',
            'Test Title',
            'Test Message',
            { key: 'value' }
        );
        mockNotification.id = 'notification-123';
        
        mockNotificationRepository.save.mockResolvedValue(mockNotification);
        mockEventBus.publish.mockResolvedValue(undefined);

        // Act
        const result = await sendNotificationUseCase.execute(
            'user-123',
            'Test Title',
            'Test Message',
            { key: 'value' }
        );

        // Assert
        expect(mockNotificationRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'user-123',
                title: 'Test Title',
                message: 'Test Message',
                metadata: { key: 'value' },
            })
        );
        expect(mockEventBus.publish).toHaveBeenCalledWith(
            expect.any(NotificationSentEvent)
        );
        expect(result).toEqual(mockNotification);
    });

    it('should throw an error if saving fails', async () => {
        // Arrange
        mockNotificationRepository.save.mockRejectedValue(new Error('Save failed'));

        // Act & Assert
        await expect(
            sendNotificationUseCase.execute('user-123', 'Test Title', 'Test Message')
        ).rejects.toThrow('Save failed');
        expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
});