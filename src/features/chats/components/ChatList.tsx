import React, { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from 'react-query';
import { Chat } from '../chats/api/chats';
import { getChats } from '../chats/api/chats';

interface ChatItemProps {
  chat: Chat;
  isSelected: boolean;
  onSelect: () => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, isSelected, onSelect }) => {
  return (
    <div 
      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">
            {chat.participants.length > 1 ? `Group Chat (${chat.participants.length} people)` : 'Direct Chat'}
          </h3>
          {chat.latestMessagePreview && (
            <p className="text-gray-600 text-sm truncate max-w-xs">
              {chat.latestMessagePreview}
            </p>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

interface ChatListProps {
  onChatSelect: (chatId: string) => void;
  selectedChatId: string | null;
}

const ChatList: React.FC<ChatListProps> = ({ onChatSelect, selectedChatId }) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    'chats',
    ({ pageParam = '' }) => getChats(pageParam),
    {
      getNextPageParam: (lastPage) => lastPage.meta?.nextCursor,
    }
  );

  // Flatten chats from all pages
  const allChats: Chat[] = [];
  if (data?.pages) {
    data.pages.forEach(page => {
      allChats.push(...page.data);
    });
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold">Chats</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {allChats.map(chat => (
          <ChatItem
            key={chat.id}
            chat={chat}
            isSelected={selectedChatId === chat.id}
            onSelect={() => onChatSelect(chat.id)}
          />
        ))}
        {isFetchingNextPage && (
          <div className="p-4 text-center text-gray-500">Loading more chats...</div>
        )}
        <div className="p-4 text-center">
          <button 
            onClick={() => fetchNextPage()}
            disabled={!hasNextPage || isFetchingNextPage}
            className="text-blue-500 hover:text-blue-700 disabled:text-gray-400"
          >
            {isFetchingNextPage ? 'Loading...' : hasNextPage ? 'Load More' : 'No more chats'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatList;