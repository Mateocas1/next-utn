"use strict";

import { MessageSentEvent } from "../../domain/events/MessageSentEvent";
import { SendNotificationUseCase } from "../use-cases/SendNotificationUseCase";

/***
 * Handles MessageSentEvent and sends a notification to the recipient.
 *
 * @class MessageSentNotificationHandler
 */
export class MessageSentNotificationHandler {
    private sendNotificationUseCase: SendNotificationUseCase;

    /**
     * Creates an instance of MessageSentNotificationHandler.
     *
     * @param {SendNotificationUseCase} sendNotificationUseCase - The use case for sending notifications.
     */
    constructor(sendNotificationUseCase: SendNotificationUseCase) {
        this.sendNotificationUseCase = sendNotificationUseCase;
    }

    /**
     * Handles the MessageSentEvent and sends a notification.
     *
     * @param {MessageSentEvent} event - The MessageSentEvent.
     * @returns {Promise<void>}
     */
    async handle(event: MessageSentEvent): Promise<void> {
        const { chatId, senderId, content } = event.payload;
        
        // Enviar notificación al destinatario (lógica simplificada)
        // En un caso real, aquí se buscaría el destinatario del chat
        const recipientId = this.getRecipientId(chatId, senderId);
        if (!recipientId) return;
        
        await this.sendNotificationUseCase.execute(
            recipientId,
            "Nuevo mensaje",
            `Tienes un nuevo mensaje: ${content.substring(0, 50)}...`,
            { chatId, senderId }
        );
    }

    /**
     * Simula la obtención del ID del destinatario.
     *
     * @private
     * @param {string} chatId - The chat ID.
     * @param {string} senderId - The sender ID.
     * @returns {string | null} - The recipient ID or null if not found.
     */
    private getRecipientId(chatId: string, senderId: string): string | null {
        // Lógica simplificada: en un caso real, aquí se buscaría el destinatario del chat
        // Por ejemplo, podrías tener un servicio que consulte los participantes del chat
        // y excluya al remitente.
        return "recipient-id-placeholder"; // Reemplazar con lógica real
    }
}