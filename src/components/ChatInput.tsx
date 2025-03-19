import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Send, CrownIcon, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isRtl, setIsRtl] = useState(false);
  const navigate = useNavigate();
  
  // Check if text contains RTL script (Arabic or Hebrew)
  useEffect(() => {
    // Hebrew characters range: \u0590-\u05FF
    // Arabic characters range: \u0600-\u06FF
    const rtlPattern = /[\u0590-\u05FF\u0600-\u06FF]/;
    setIsRtl(rtlPattern.test(message));
  }, [message]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      setIsRtl(false);
    }
  };
  
  const handleUpgrade = () => {
    navigate('/subscription');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="flex-1 relative">
        <input
          type="text"
          id="message-input"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={disabled ? "Upgrade to premium to send more messages" : "Type your message here..."}
          className={`w-full py-3 px-4 rounded-full bg-white/80 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-brand-yellow/30 focus:outline-none transition-all duration-300 ${
            isRtl ? 'text-right' : 'text-left'
          } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
          dir={isRtl ? "rtl" : "ltr"}
          lang={isRtl ? (message.match(/[\u0600-\u06FF]/) ? "ar" : "he") : "en"}
          autoComplete="off"
          disabled={disabled}
        />
      </div>
      
      {disabled ? (
        <Button
          type="button"
          onClick={handleUpgrade}
          className="py-3 px-4 rounded-full bg-brand-yellow text-brand-darkGray transition-all duration-300 hover:shadow-md hover:scale-[1.02] flex items-center gap-2"
          aria-label="Upgrade to premium"
        >
          <Crown size={18} />
          <span className="hidden sm:inline-block">Upgrade to Premium</span>
          <span className="inline-block sm:hidden">Upgrade</span>
        </Button>
      ) : (
        <button
          type="submit"
          disabled={!message.trim()}
          className={`p-3 rounded-full bg-brand-bordeaux text-white transition-all duration-300 ${
            message.trim()
              ? 'opacity-100 hover:shadow-md hover:scale-[1.02]' 
              : 'opacity-50 cursor-not-allowed'
          }`}
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      )}
    </form>
  );
};

export default ChatInput;