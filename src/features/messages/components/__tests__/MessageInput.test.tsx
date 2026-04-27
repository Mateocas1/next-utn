import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import MessageInput from '../MessageInput';
import * as messageApi from '../../api/messages';

// Mock the sendMessage function
jest.mock('../../api/messages', () => ({
  sendMessage: jest.fn(),
}));

describe('MessageInput', () => {
  const queryClient = new QueryClient();
  const mockSendMessage = messageApi.sendMessage as jest.MockedFunction<typeof messageApi.sendMessage>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the input field and send button', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MessageInput chatId="chat1" onMessageSent={jest.fn()} />
      </QueryClientProvider>
    );

    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
  });

  it('should call sendMessage when send button is clicked', async () => {
    mockSendMessage.mockResolvedValue({
      success: true,
      data: {
        id: '1',
        chatId: 'chat1',
        senderId: 'user1',
        content: 'Test message',
        createdAt: new Date().toISOString(),
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MessageInput chatId="chat1" onMessageSent={jest.fn()} />
      </QueryClientProvider>
    );

    const textarea = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByText('Send');

    fireEvent.input(textarea, { target: { value: 'Hello World' } });
    fireEvent.click(sendButton);

    expect(mockSendMessage).toHaveBeenCalledWith('chat1', 'Hello World');
  });

  it('should disable send button when input is empty', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MessageInput chatId="chat1" onMessageSent={jest.fn()} />
      </QueryClientProvider>
    );

    const sendButton = screen.getByText('Send');
    expect(sendButton).toBeDisabled();
  });
});