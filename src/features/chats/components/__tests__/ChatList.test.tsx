import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import ChatList from '../ChatList';
import * as chatApi from '../../api/chats';

// Mock the react-query useInfiniteQuery hook
jest.mock('react-query', () => {
  const actualReactQuery = jest.requireActual('react-query');
  return {
    ...actualReactQuery,
    useInfiniteQuery: jest.fn(() => ({
      data: {
        pages: [
          {
            data: [
              {
                id: '1',
                participants: ['user1', 'user2'],
                latestMessagePreview: 'Hello there!',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            meta: {
              nextCursor: 'next-cursor',
              limit: 20,
            },
          },
        ],
      },
      fetchNextPage: jest.fn(),
      hasNextPage: true,
      isFetchingNextPage: false,
    })),
  };
});

describe('ChatList', () => {
  const queryClient = new QueryClient();

  it('should render chat list with items', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChatList onChatSelect={jest.fn()} selectedChatId={null} />
      </QueryClientProvider>
    );

    expect(screen.getByText('Chats')).toBeInTheDocument();
    expect(screen.getByText('Direct Chat')).toBeInTheDocument();
  });

  it('should call onChatSelect when a chat is selected', () => {
    const mockOnChatSelect = jest.fn();
    
    render(
      <QueryClientProvider client={queryClient}>
        <ChatList onChatSelect={mockOnChatSelect} selectedChatId={null} />
      </QueryClientProvider>
    );

    const chatItem = screen.getByText('Direct Chat');
    fireEvent.click(chatItem);
    
    expect(mockOnChatSelect).toHaveBeenCalledWith('1');
  });
});