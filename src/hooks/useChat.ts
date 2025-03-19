// src/hooks/useChat.ts
import { useState, useEffect } from 'react';
import { askQuestion, getChatSession, normalizeMessage } from '@/api/askApi';
import { useToast } from '@/hooks/use-toast';
import { UserPreferences } from '@/components/PreferencesPopup';
import { useAuth } from '@/contexts/AuthContext';
import { Message } from '@/api/askApi';

// Helper function to safely encode strings with non-Latin1 characters
export const safeEncode = (str: string): string => {
  try {
    // First URL-encode the string to handle UTF-8, then use btoa
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, 
      (_, p1) => String.fromCharCode(parseInt(p1, 16))));
  } catch (e) {
    console.error("Encoding error:", e);
    // Return a fallback value if encoding fails
    return btoa("user_" + Date.now());
  }
};

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    name: '',
    level: 'beginner',
    week: 'week01',
    gender: 'male',
    language: 'english'
  });
  
  // Maximum messages for free plan
  const maxMessages = 50;
  
  const { toast } = useToast();
  const { userName, currentUser, isPremium } = useAuth();
  
  useEffect(() => {
    // Check if preferences are already saved
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      const parsedPreferences = JSON.parse(savedPreferences);
      
      // If we have a userName from auth but not in preferences, use that
      if (userName && !parsedPreferences.name) {
        parsedPreferences.name = userName;
      }
      
      setUserPreferences(parsedPreferences);
      
      // Add welcome message if we have a user name
      if (parsedPreferences.name) {
        // If we have a session ID in local storage, try to load it
        const storedSessionId = localStorage.getItem('currentSessionId');
        if (storedSessionId) {
          setSessionId(storedSessionId);
          loadExistingSession(storedSessionId);
        } else {
          addWelcomeMessage(parsedPreferences);
        }
      } else {
        // Only show the preferences popup if no preferences are saved
        setShowPreferences(true);
      }
    } else {
      // If no preferences, create default ones with userName if available
      const newPreferences = {
        ...userPreferences,
        name: userName || '',
      };
      
      if (userName) {
        setUserPreferences(newPreferences);
        addWelcomeMessage(newPreferences);
        // Save these preferences
        localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
      } else {
        // If no userName, show the prompt
        setShowPreferences(true);
      }
    }
    
    // Load message count from local storage
    const localCount = localStorage.getItem('messageCount');
    if (localCount) {
      setMessageCount(parseInt(localCount, 10));
    }
  }, [userName]);
  
  // Load an existing chat session from Firestore or API
  const loadExistingSession = async (sessionId: string) => {
    try {
      const session = await getChatSession(sessionId);
      if (session && session.messages && session.messages.length > 0) {
        // Convert messages to the expected format
        const normalizedMessages = session.messages.map(msg => normalizeMessage(msg));
        setMessages(normalizedMessages);
      } else {
        // If session couldn't be loaded, create a new welcome message
        addWelcomeMessage(userPreferences);
      }
    } catch (error) {
      console.error("Failed to load existing session:", error);
      // If session couldn't be loaded, create a new welcome message
      addWelcomeMessage(userPreferences);
    }
  };
  
  const addWelcomeMessage = (preferences: UserPreferences) => {
    let welcomeMessage = '';
    
    if (preferences.language === 'arabic') {
      welcomeMessage = `مرحباً ${preferences.name}! أنا مساعدك لتعلم اللغة العربية. كيف بقدر اساعدك اليوم؟`;
    } else if (preferences.language === 'hebrew') {
      welcomeMessage = `שלום ${preferences.name}! אני העוזר שלך ללימוד השפה הערבית. איך אני יכול לעזור לך היום?`;
    } else {
      welcomeMessage = `Hello ${preferences.name}! I'm your assistant for learning Arabic. How can I help you today?`;
    }
    
    const welcomeMsg: Message = {
      id: Date.now().toString(),
      content: welcomeMessage,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      isUser: false
    };
    
    setMessages([welcomeMsg]);
  };
  
  const handleSavePreferences = (preferences: UserPreferences) => {
    setUserPreferences(preferences);
    setShowPreferences(false);
    
    // Add welcome message with the user's name
    addWelcomeMessage(preferences);
    
    // Save preferences to localStorage
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  };

  // Add a limit reached message to the chat
  const addLimitReachedMessage = () => {
    const limitMessage: Message = {
      id: Date.now().toString(),
      content: "You've reached the limit of free messages for today. Upgrade to Premium for unlimited messages and additional features. Click the button below to upgrade and continue your Arabic learning journey without interruptions.",
      sender: 'bot',
      timestamp: new Date().toISOString(),
      isUser: false
    };
    
    setMessages(prev => [...prev, limitMessage]);
  };
  
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    console.log('Sending message:', content);
    
    // Check if we're at the message limit and not premium
    if (messageCount >= maxMessages && !isPremium) {
      toast({
        title: "Message limit reached",
        description: "You've reached the maximum messages for the free plan. Please upgrade to premium for unlimited messages.",
        variant: "destructive"
      });
      
      // Add a message in the chat about the limit
      addLimitReachedMessage();
      return;
    }
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date().toISOString(),
      isUser: true
    };
    
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(true);
    
    try {
      console.log('Calling API with params:', {
        message: content,
        level: userPreferences.level,
        week: userPreferences.week,
        gender: userPreferences.gender,
        language: userPreferences.language,
        sessionId
      });
      
      const response = await askQuestion(
        content, 
        userPreferences.week,
        userPreferences.level, 
        userPreferences.gender, 
        userPreferences.language,
        sessionId || undefined
      );
      
      console.log('Received API response:', response);
      
      if (!response || !response.answer) {
        throw new Error('Invalid response from server');
      }
      
      // If this is the first message, save the session ID
      if (!sessionId && response.sessionId) {
        setSessionId(response.sessionId);
        localStorage.setItem('currentSessionId', response.sessionId);
      }
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: response.answer,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isUser: false
      };
      
      // Update messages with the complete chat history if available
      if (response.chatSession && response.chatSession.messages) {
        const normalizedMessages = response.chatSession.messages.map(msg => normalizeMessage(msg));
        setMessages(normalizedMessages);
      } else {
        // Fallback to just adding the new message
        setMessages(prev => [...prev, aiMessage]);
      }
      
      // Increment and save message count for non-premium users
      if (!isPremium) {
        const newCount = messageCount + 1;
        setMessageCount(newCount);
        localStorage.setItem('messageCount', newCount.toString());
        
        // Check if user is approaching the limit
        if (newCount === Math.floor(maxMessages * 0.8)) {
          // Add a warning message about approaching the limit
          toast({
            title: "Message limit approaching",
            description: `You're approaching your free message limit (${newCount}/${maxMessages}). Consider upgrading to Premium for unlimited messages.`,
            variant: "default"
          });
        }
      }
    } catch (error) {
      console.error('Error getting response from backend:', error);
      
      // Create a fallback bot response for auth errors
      if (error.toString().includes('401') || error.toString().includes('UNAUTHORIZED')) {
        // Authentication error - provide a helpful message
        const authErrorMessage: Message = {
          id: Date.now().toString(),
          content: "I'm having trouble authenticating your session. Please try logging in again or refreshing the page. If this error persists, check that your session hasn't expired.",
          sender: 'bot',
          timestamp: new Date().toISOString(),
          isUser: false
        };
        setMessages(prev => [...prev, authErrorMessage]);
        
        toast({
          title: "Authentication Error",
          description: "Your session may have expired. Please log in again.",
          variant: "destructive"
        });
      } else {
        // General API error
        toast({
          title: "API Error",
          description: "Could not get a response. Please check the console for details.",
          variant: "destructive"
        });
      }
    } finally {
      setIsTyping(false);
    }
  };
  
  return {
    messages,
    isTyping,
    showPreferences,
    userPreferences,
    handleSavePreferences,
    handleSendMessage: (content: string) => {
      if (!userPreferences.name && userName) {
        // If we have userName but no preferences name, update it
        const updatedPreferences = {
          ...userPreferences,
          name: userName
        };
        setUserPreferences(updatedPreferences);
        localStorage.setItem('userPreferences', JSON.stringify(updatedPreferences));
      }
      
      // Now call the existing message handler
      handleSendMessage(content);
    },
    messageCount,
    maxMessages
  };
};