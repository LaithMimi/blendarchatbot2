import React, { useRef, useEffect } from 'react';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import { Message } from '@/hooks/useChat';

interface ChatContainerProps {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ 
  messages, 
  isTyping, 
  onSendMessage,
  disabled = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-container border-brand-bordeaux/20 backdrop-blur-sm">
      <div className="chat-message-container p-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            content={message.content}
            isUser={message.isUser}
            timestamp={message.timestamp}
          />
        ))}
        {isTyping && (
          <div className="flex w-full max-w-[80%] mr-auto justify-start">
            <div className="bg-brand-darkGray text-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="block h-2 w-2 rounded-full bg-white/50 animate-pulse"></span>
                <span className="block h-2 w-2 rounded-full bg-white/50 animate-pulse delay-150"></span>
                <span className="block h-2 w-2 rounded-full bg-white/50 animate-pulse delay-300"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
       <div className="chat-input-container border-t-brand-bordeaux/20">
        <ChatInput onSendMessage={onSendMessage} disabled={disabled} />
      </div>
    </div>
  );
};

export default ChatContainer;
