import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import Card3D from './Card3D';

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ content, isUser, timestamp }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Detect Arabic/Hebrew characters for RTL support
  const containsArabic = /[\u0600-\u06FF]/.test(content);
  const containsHebrew = /[\u0590-\u05FF]/.test(content);
  const isRtl = containsArabic || containsHebrew;

  // Function to format text with inline styles and insert horizontal rules between paragraphs.
  const formatText = (text: string) => {
    let formatted = text
      // Bold Arabic words
      .replace(/([\u0600-\u06FF]+)/g, '<strong>$1</strong>')
      .replace(/"([^"]+)\?"/g, '"$1?"<br/>')
      .replace(/\(([^)]+)\?\)/g, '($1?)<br/>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-size: larger;">$1</strong>')
      .replace(/__(.*?)__/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<u>$1</u>')
      .replace(/`(.*?)`/g, '<span style="color: #ff6347;">$1</span>');

    // Split the formatted text into paragraphs using double newlines as delimiters.
    const paragraphs = formatted.split(/\n\s*\n/);
    // Wrap each paragraph in <p> tags and join them with an <hr> to add separation.
    return paragraphs
      .map(paragraph => `<p>${paragraph.trim()}</p>`)
      .join('<hr style="margin: 1rem 0; border: none; border-top: 1px solid #ccc;">');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={cn(
        "flex w-full max-w-[80%] transition-opacity duration-300 ease-in-out",
        isUser ? "ml-auto justify-end" : "mr-auto justify-start",
        isVisible ? "opacity-100 animate-fade-in" : "opacity-0"
      )}
    >
      <Card3D
        intensity={isUser ? 5 : 2}
        className={cn(
          "rounded-2xl overflow-hidden shadow-lg",
          isUser ? "rounded-tr-none" : "rounded-tl-none"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-md text-sm leading-relaxed",
            isUser
              ? "bg-brand-yellow text-brand-darkGray rounded-tr-none"
              : "bg-brand-darkGray text-white rounded-tl-none"
          )}
        >
          {/* Render formatted message content with horizontal rules between paragraphs */}
          <div
            className={cn("whitespace-pre-wrap break-words", isRtl ? "text-right" : "text-left")}
            dir={isRtl ? "rtl" : "ltr"}
            lang={containsArabic ? "ar" : containsHebrew ? "he" : "en"}
            dangerouslySetInnerHTML={{ __html: formatText(content) }}
          />
          {/* Timestamp */}
          <div
            className={cn(
              "text-xs mt-2 opacity-70",
              isRtl ? "text-left" : "text-right",
              isUser ? "text-brand-darkGray/70" : "text-white/70"
            )}
          >
            {formatTime(timestamp)}
          </div>
        </div>
      </Card3D>
    </div>
  );
};

export default ChatMessage;
