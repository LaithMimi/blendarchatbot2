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
import { Loader2, Crown, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const Chat: React.FC = () => {
  const {
    messages,
    isTyping,
    showPreferences,
    userPreferences,
    handleSavePreferences,
    handleSendMessage,
    messageCount,
    maxMessages,
    limitReached,
    remainingMessages
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

  // Calculate usage percentage for the progress bar
  const usagePercentage = Math.min(100, (messageCount / maxMessages) * 100);
  
  // Determine if approaching limit (80% or more)
  const isApproachingLimit = !isPremium && messageCount >= Math.floor(maxMessages * 0.8) && messageCount < maxMessages;

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
            {/* Limit Reached Banner */}
            {!isPremium && limitReached && (
              <Alert className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-900/30">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <AlertTitle className="text-red-800 dark:text-red-300 font-bold text-lg">
                  Message Limit Reached
                </AlertTitle>
                <AlertDescription className="space-y-4">
                  <p className="text-red-700 dark:text-red-300">
                    You've reached the limit of {maxMessages} messages for the free plan.
                  </p>
                  <p className="text-red-700 dark:text-red-300">
                    Upgrade to Premium for unlimited messages and more features.
                  </p>
                  <Button 
                    onClick={() => navigate('/subscription')}
                    className="mt-3 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-darkGray flex items-center gap-2"
                  >
                    <Crown size={18} />
                    Upgrade to Premium
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Approaching Limit Warning */}
            {!isPremium && isApproachingLimit && !limitReached && (
              <Alert className="mb-4 bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-900/30">
                <AlertTitle className="text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Almost at Message Limit
                </AlertTitle>
                <AlertDescription className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-700 dark:text-amber-300">
                        {messageCount} of {maxMessages} messages used
                      </span>
                      <span className="text-amber-700 dark:text-amber-300">
                        {maxMessages - messageCount} remaining
                      </span>
                    </div>
                    <Progress value={usagePercentage} className="h-2 bg-amber-200 dark:bg-amber-800/30">
                      <div className="h-full bg-amber-500 dark:bg-amber-500/70 rounded-full" style={{ width: `${usagePercentage}%` }} />
                    </Progress>
                  </div>
                  <p className="text-amber-700 dark:text-amber-300">
                    Consider upgrading to Premium for unlimited messages.
                  </p>
                  <Button 
                    onClick={() => navigate('/subscription')}
                    className="bg-brand-bordeaux hover:bg-brand-bordeaux/90 text-white"
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
              disabled={!isPremium && limitReached}
              remainingMessages={remainingMessages !== null ? remainingMessages : (maxMessages - messageCount)}
            />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Chat;