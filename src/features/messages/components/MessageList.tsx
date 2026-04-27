import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInfiniteQuery } from 'react-query';
import { Message } from '../messages/api/messages';
import { getMessages } from '../messages/api/messages';

interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isCurrentUser }) => {
  return (
    <div className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isCurrentUser 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-200 text-gray-800'
      }`}>
        <p>{message.content}</p>
        <p className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

interface MessageListProps {
  chatId: string;
  currentUserId: string;
}

const MessageList: React.FC<MessageListProps> = ({ chatId, currentUserId }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch messages with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    ['messages', chatId],
    ({ pageParam = '' }) => getMessages(chatId, pageParam),
    {
      getNextPageParam: (lastPage) => lastPage.meta?.nextCursor,
    }
  );

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data]);

  // Flatten messages from all pages
  const allMessages: Message[] = [];
  if (data?.pages) {
    // Reverse the order of pages and messages to show newest at the bottom
    for (let i = data.pages.length - 1; i >= 0; i--) {
      const page = data.pages[i];
      for (let j = page.data.length - 1; j >= 0; j--) {
        allMessages.unshift(page.data[j]);
      }
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {isFetchingNextPage && (
        <div className="text-center text-gray-500 mb-2">Loading older messages...</div>
      )}
      
      <div className="space-y-3">
        {allMessages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isCurrentUser={message.senderId === currentUserId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;