import React, { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Card3DProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  borderHighlight?: boolean;
  glare?: boolean;
}

const Card3D: React.FC<Card3DProps> = ({ 
  children, 
  className, 
  intensity = 10, 
  borderHighlight = true,
  glare = true
}) => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateY = ((x - centerX) / centerX) * intensity;
    const rotateX = -((y - centerY) / centerY) * intensity;
    
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div
      className={cn(
        "transition-all duration-200 ease-out transform-gpu perspective-1000",
        isHovering ? "z-10" : "z-0",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovering ? `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)` : "none",
      }}
    >
      <div 
        className={cn(
          "relative h-full w-full",
          borderHighlight && isHovering ? "after:absolute after:inset-0 after:rounded-inherit after:border after:border-white/30 after:opacity-100" : "",
          borderHighlight && !isHovering ? "after:absolute after:inset-0 after:rounded-inherit after:border after:border-transparent after:opacity-0" : ""
        )}
      >
        {glare && isHovering && (
          <div 
            className="absolute inset-0 rounded-inherit bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 pointer-events-none"
            style={{
              opacity: isHovering ? 0.1 : 0,
              transform: `rotate(${rotate.y * 2}deg)`,
            }}
          />
        )}
        {children}
      </div>
    </div>
  );
};

export default Card3D;
