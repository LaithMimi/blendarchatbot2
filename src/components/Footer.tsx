
import React from 'react';
import { Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 px-4 md:px-6 border-t border-border bg-white/50 dark:bg-black/20 backdrop-blur-sm">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <img src="../blendar.jpg" alt="Logo" className="h-8 w-8 rounded-full" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Blend.Ar. All rights reserved.
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-sm font-medium text-brand-darkGray dark:text-white">צרו איתנו קשר</p>
          <a 
            href="mailto:blendarabic@gmail.com" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Mail className="h-4 w-4" />
            blendarabic@gmail.com
          </a>
        </div>
        
        <div className="flex gap-6">
          <a 
            href="#" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms of Use
          </a>
          <a 
            href="#" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy
          </a>
          <a 
            href="https://www.linkedin.com/in/laith-mimi-0307g/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            target="_blank" 
            rel="noopener noreferrer"
          >
            Developed by LaithMimi
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
