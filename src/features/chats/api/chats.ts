import axiosInstance from '@lib/axios';
import { AxiosResponse } from 'axios';

export interface Chat {
  id: string;
  participants: string[];
  latestMessagePreview?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatListResponse {
  success: boolean;
  data: Chat[];
  meta?: {
    nextCursor?: string;
    limit: number;
  };
}

export interface CreateChatResponse {
  success: boolean;
  data: Chat;
}

/**
 * Get chats with cursor pagination
 * @param cursor - Cursor for pagination
 * @param limit - Number of items to fetch
 * @returns Promise with chat list response
 */
export async function getChats(cursor?: string, limit: number = 20): Promise<ChatListResponse> {
  const params: Record<string, string | number> = { limit };
  if (cursor) {
    params.cursor = cursor;
  }
  
  const response: AxiosResponse<ChatListResponse> = await axiosInstance.get('/chats', { params });
  return response.data;
}

/**
 * Create a new chat
 * @returns Promise with created chat
 */
export async function createChat(): Promise<CreateChatResponse> {
  const response: AxiosResponse<CreateChatResponse> = await axiosInstance.post('/chats');
  return response.data;
}