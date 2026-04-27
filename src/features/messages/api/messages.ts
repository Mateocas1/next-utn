import axiosInstance from '@lib/axios';
import { AxiosResponse } from 'axios';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface MessageListResponse {
  success: boolean;
  data: Message[];
  meta?: {
    nextCursor?: string;
    limit: number;
  };
}

export interface SendMessageRequest {
  chatId: string;
  content: string;
}

export interface SendMessageResponse {
  success: boolean;
  data: Message;
}

/**
 * Get messages with cursor pagination
 * @param chatId - ID of the chat to get messages for
 * @param cursor - Cursor for pagination
 * @param limit - Number of items to fetch
 * @returns Promise with message list response
 */
export async function getMessages(
  chatId: string,
  cursor?: string,
  limit: number = 20
): Promise<MessageListResponse> {
  const params: Record<string, string | number> = { chatId, limit };
  if (cursor) {
    params.cursor = cursor;
  }
  
  const response: AxiosResponse<MessageListResponse> = await axiosInstance.get('/messages', { params });
  return response.data;
}

/**
 * Send a new message
 * @param chatId - ID of the chat to send message to
 * @param content - Content of the message
 * @returns Promise with sent message
 */
export async function sendMessage(chatId: string, content: string): Promise<SendMessageResponse> {
  const response: AxiosResponse<SendMessageResponse> = await axiosInstance.post('/messages', { chatId, content });
  return response.data;
}