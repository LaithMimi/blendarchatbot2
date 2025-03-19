
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isRtl, setIsRtl] = useState(false);
  
  // Check if text contains RTL script (Arabic or Hebrew)
  useEffect(() => {
    // Hebrew characters range: \u0590-\u05FF
    // Arabic characters range: \u0600-\u06FF
    const rtlPattern = /[\u0590-\u05FF\u0600-\u06FF]/;
    setIsRtl(rtlPattern.test(message));
  }, [message]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      setIsRtl(false);
    }
  };
  
  // const toggleRecording = () => {
  //   // In a real implementation, this would handle voice recognition
  //   setIsRecording(!isRecording);
  //   if (!isRecording) {
  //     // Simulate voice recording and transcription
  //     setTimeout(() => {
  //       alert('Error: Voice recording is not supported yet');
  //     }, 2000);
  //   } 
  // };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      {/* <button
        type="button"
        onClick={toggleRecording}
        className={`p-3 rounded-full transition-colors ${
          isRecording 
            ? 'bg-brand-bordeaux text-white animate-pulse-slow' 
            : 'bg-brand-darkGray text-white hover:bg-opacity-90'
        }`}
        aria-label={isRecording ? "Stop recording" : "Start voice recording"}
      >
        {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
      </button> */}
      
      <div className="flex-1 relative">
        <input
          type="text"
          id="message-input"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          className={`w-full py-3 px-4 rounded-full bg-white/80 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-brand-yellow/30 focus:outline-none transition-all duration-300 ${
            isRtl ? 'text-right' : 'text-left'
          }`}
          dir={isRtl ? "rtl" : "ltr"}
          lang={isRtl ? (message.match(/[\u0600-\u06FF]/) ? "ar" : "he") : "en"}
          autoComplete="off"
        />
        
        {isRecording && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="block h-2 w-2 rounded-full bg-brand-bordeaux animate-pulse"></span>
            <span className="block h-2 w-2 rounded-full bg-brand-bordeaux animate-pulse delay-100"></span>
            <span className="block h-2 w-2 rounded-full bg-brand-bordeaux animate-pulse delay-200"></span>
          </div>
        )}
      </div>
      
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
    </form>
  );
};

export default ChatInput;
