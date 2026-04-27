import React, { useState, useEffect } from 'react';
import { useQueryClient } from 'react-query';
import ChatList from '../chats/components/ChatList';
import MessageList from '../messages/components/MessageList';
import MessageInput from '../messages/components/MessageInput';
import { authStore } from '../auth/store/authStore';

const ChatPage: React.FC = () => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const queryClient = useQueryClient();

  // Get current user ID from auth store
  useEffect(() => {
    const { userId } = authStore.getState();
    if (userId) {
      setCurrentUserId(userId);
    }
  }, []);

  const handleMessageSent = () => {
    // Invalidate messages query to refresh the list
    if (selectedChatId) {
      queryClient.invalidateQueries(['messages', selectedChatId]);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/3 border-r">
        <ChatList 
          onChatSelect={setSelectedChatId} 
          selectedChatId={selectedChatId} 
        />
      </div>
      
      <div className="flex-1 flex flex-col">
        {selectedChatId ? (
          <>
            <MessageList chatId={selectedChatId} currentUserId={currentUserId} />
            <MessageInput chatId={selectedChatId} onMessageSent={handleMessageSent} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;