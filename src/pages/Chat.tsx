import React from 'react';
import Footer from '@/components/Footer';
import PreferencesPopup from '@/components/PreferencesPopup';
import ChatBackground from '@/components/ChatBackground';
import ChatContainer from '@/components/ChatContainer';
import { useChat } from '@/hooks/useChat';

const Chat: React.FC = () => {
  const {
    messages,
    isTyping,
    showPreferences,
    userPreferences,
    handleSavePreferences,
    handleSendMessage
  } = useChat();

  return (
    <div className="min-h-screen flex flex-col bg-brand-background dark:bg-brand-darkGray/90 relative overflow-hidden">
      {/* Decorative background elements */}
      <ChatBackground />

      {showPreferences && (
        <PreferencesPopup 
          isOpen={showPreferences} 
          onSave={handleSavePreferences} 
        />
      )}
      
      <main className="flex-1 page-container relative z-[1]">
        <ChatContainer 
          messages={messages} 
          isTyping={isTyping} 
          onSendMessage={handleSendMessage} 
        />
      </main>
      <Footer />
    </div>
  );
};

export default Chat;
