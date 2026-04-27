import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import MessageList from '../MessageList';

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
                chatId: 'chat1',
                senderId: 'user1',
                content: 'Hello there!',
                createdAt: new Date().toISOString(),
              },
              {
                id: '2',
                chatId: 'chat1',
                senderId: 'user2',
                content: 'Hi there!',
                createdAt: new Date().toISOString(),
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

describe('MessageList', () => {
  const queryClient = new QueryClient();

  it('should render messages', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MessageList chatId="chat1" currentUserId="user1" />
      </QueryClientProvider>
    );

    expect(screen.getByText('Hello there!')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });
});