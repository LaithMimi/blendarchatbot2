import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer';
import PreferencesPopup from '@/components/PreferencesPopup';
import ChatBackground from '@/components/ChatBackground';
import ChatContainer from '@/components/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const Chat: React.FC = () => {
  const {
    messages,
    isTyping,
    showPreferences,
    userPreferences,
    handleSavePreferences,
    handleSendMessage,
    messageCount,
    maxMessages
  } = useChat();
  
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const { isPremium, checkSubscriptionStatus, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Check subscription status
  useEffect(() => {
    const verifySubscription = async () => {
      if (isAuthenticated) {
        try {
          await checkSubscriptionStatus();
        } catch (error) {
          console.error('Error checking subscription:', error);
        } finally {
          setIsCheckingSubscription(false);
        }
      } else {
        setIsCheckingSubscription(false);
      }
    };
    
    verifySubscription();
  }, [isAuthenticated, checkSubscriptionStatus]);

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
        {isCheckingSubscription ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-brand-bordeaux" />
          </div>
        ) : (
          <>
            {!isPremium && messageCount >= maxMessages && (
              <Alert className="mb-4 bg-brand-yellow/20 border-brand-yellow">
                <AlertTitle>Message Limit Reached</AlertTitle>
                <AlertDescription>
                  <p>You've reached the limit of {maxMessages} messages for the free plan.</p>
                  <p className="mt-2">Upgrade to Premium for unlimited messages and more features.</p>
                  <Button 
                    onClick={() => navigate('/subscription')}
                    className="mt-3 bg-brand-bordeaux hover:bg-brand-bordeaux/90 text-white"
                  >
                    Upgrade to Premium
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {!isPremium && messageCount < maxMessages && messageCount > Math.floor(maxMessages * 0.8) && (
              <Alert className="mb-4 bg-brand-yellow/10 border-brand-yellow/70">
                <AlertTitle>Almost at Message Limit</AlertTitle>
                <AlertDescription>
                  <p>You've used {messageCount} of your {maxMessages} free messages.</p>
                  <p className="mt-2">Consider upgrading to Premium for unlimited messages.</p>
                  <Button 
                    onClick={() => navigate('/subscription')}
                    className="mt-3 bg-brand-bordeaux hover:bg-brand-bordeaux/90 text-white"
                    variant="outline"
                  >
                    View Premium Plans
                  </Button>
                </AlertDescription>
              </Alert>
            )}
        
            <ChatContainer 
              messages={messages} 
              isTyping={isTyping} 
              onSendMessage={handleSendMessage} 
              disabled={!isPremium && messageCount >= maxMessages}
            />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Chat;