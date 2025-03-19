import { useState, useEffect } from 'react';
import { askQuestion } from '@/api/askApi';
import { useToast } from '@/hooks/use-toast';
import { UserPreferences } from '@/components/PreferencesPopup';
import { useAuth } from '@/contexts/AuthContext';

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

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
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    name: '',
    level: 'beginner',
    week: 'week01',
    gender: 'male',
    language: 'english'
  });
  
  const { toast } = useToast();
  const { userName } = useAuth();
  
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
        addWelcomeMessage(parsedPreferences);
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
  }, [userName]);
  
  const addWelcomeMessage = (preferences: UserPreferences) => {
    let welcomeMessage = '';
    
    if (preferences.language === 'arabic') {
      welcomeMessage = `مرحباً ${preferences.name}! أنا مساعدك لتعلم اللغة العربية. كيف بقدر اساعدك اليوم؟`;
    } else if (preferences.language === 'hebrew') {
      welcomeMessage = `שלום ${preferences.name}! אני העוזר שלך ללימוד השפה הערבית. איך אני יכול לעזור לך היום?`;
    } else {
      welcomeMessage = `Hello ${preferences.name}! I'm your assistant for learning Arabic. How can I help you today?`;
    }
    
    const welcomeMsg = {
      id: '1',
      content: welcomeMessage,
      isUser: false,
      timestamp: new Date()
    };
    
    setMessages([welcomeMsg]);
    
    // Also save welcome message to local storage
    const sessionId = Date.now().toString();
    const localChats = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    
    // Check if we already have a chat for this user
    const existingSessionIndex = localChats.findIndex((chat: any) => 
      chat.userId === safeEncode(preferences.name)
    );
    
    if (existingSessionIndex >= 0) {
      // Add to existing session
      if (!localChats[existingSessionIndex].messages) {
        localChats[existingSessionIndex].messages = [];
      }
      
      localChats[existingSessionIndex].messages.push({
        id: welcomeMsg.id,
        text: welcomeMsg.content,
        sender: 'bot',
        timestamp: welcomeMsg.timestamp
      });
    } else {
      // Create new session
      localChats.push({
        _id: sessionId,
        sessionId: sessionId,
        userId: safeEncode(preferences.name),
        userName: preferences.name,
        messages: [{
          id: welcomeMsg.id,
          text: welcomeMsg.content,
          sender: 'bot',
          timestamp: welcomeMsg.timestamp
        }]
      });
    }
    
    localStorage.setItem('chatHistory', JSON.stringify(localChats));
  };
  
  const handleSavePreferences = (preferences: UserPreferences) => {
    setUserPreferences(preferences);
    setShowPreferences(false);
    
    // Add welcome message with the user's name
    addWelcomeMessage(preferences);
    
    // Save preferences to localStorage
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  };
  
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    console.log('Sending message:', content);
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(true);
    
    try {
      console.log('Calling API with params:', {
        message: content,
        level: userPreferences.level,
        week: userPreferences.week,
        gender: userPreferences.gender,
        language: userPreferences.language
      });
      
      const response = await askQuestion(
        content, 
        userPreferences.week,
        userPreferences.level, 
        userPreferences.gender, 
        userPreferences.language
      );
      
      console.log('Received API response:', response);
      
      if (!response || !response.answer) {
        throw new Error('Invalid response from server');
      }
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: response.answer,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Save messages to local storage in a format compatible with ChatLogs
      const sessionId = Date.now().toString();
      const userIdEncoded = safeEncode(userPreferences.name);
      const localChats = JSON.parse(localStorage.getItem('chatHistory') || '[]');
      
      // Check if we already have a chat for this user
      const existingSessionIndex = localChats.findIndex((chat: any) => 
        chat.userId === userIdEncoded
      );
      
      if (existingSessionIndex >= 0) {
        // Add to existing session
        if (!localChats[existingSessionIndex].messages) {
          localChats[existingSessionIndex].messages = [];
        }
        
        // Add user message
        localChats[existingSessionIndex].messages.push({
          id: newMessage.id,
          text: newMessage.content,
          sender: 'user',
          timestamp: newMessage.timestamp
        });
        
        // Add bot response
        localChats[existingSessionIndex].messages.push({
          id: aiMessage.id,
          text: aiMessage.content,
          sender: 'bot',
          timestamp: aiMessage.timestamp
        });
      } else {
        // Create new session
        localChats.push({
          _id: sessionId,
          sessionId: sessionId,
          userId: userIdEncoded,
          userName: userPreferences.name,
          messages: [
            {
              id: newMessage.id,
              text: newMessage.content,
              sender: 'user',
              timestamp: newMessage.timestamp
            },
            {
              id: aiMessage.id,
              text: aiMessage.content,
              sender: 'bot',
              timestamp: aiMessage.timestamp
            }
          ]
        });
      }
      
      localStorage.setItem('chatHistory', JSON.stringify(localChats));
      
    } catch (error) {
      console.error('Error getting response from backend:', error);
      toast({
        title: "API Error",
        description: "Could not get a response. Please check the console for details.",
        variant: "destructive"
      });
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
    }
  };
};
