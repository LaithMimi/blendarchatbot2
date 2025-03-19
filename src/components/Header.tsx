
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, User, Settings, LogOut } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import PreferencesPopup, { UserPreferences } from '@/components/PreferencesPopup';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from '@/contexts/AuthContext';

// Admin password (in a real app, this would be handled server-side)
const ADMIN_PASSWORD = "admin1234";

interface HeaderProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const Header: React.FC<HeaderProps> = ({
  toggleTheme,
  isDarkMode
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isChat = location.pathname === '/chat';
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [isPasswordIncorrect, setIsPasswordIncorrect] = React.useState(false);
  const { toast } = useToast();
  const { userName, isAuthenticated, logout } = useAuth();

  const handleOpenPasswordDialog = () => {
    setIsPasswordDialogOpen(true);
    setPassword('');
    setIsPasswordIncorrect(false);
  };

  const handleClosePasswordDialog = () => {
    setIsPasswordDialogOpen(false);
    setPassword('');
    setIsPasswordIncorrect(false);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsPasswordDialogOpen(false);
      window.location.href = '/admin/chat-logs';
      toast({
        title: "Admin Access Granted",
        description: "You now have access to the admin panel.",
        variant: "default"
      });
    } else {
      setIsPasswordIncorrect(true);
      toast({
        title: "Access Denied",
        description: "Incorrect password. Try again.",
        variant: "destructive"
      });
    }
  };

  const handleTogglePreferences = () => {
    setIsPreferencesOpen(!isPreferencesOpen);
  };

  const handleSavePreferences = (preferences: UserPreferences) => {
    setIsPreferencesOpen(false);
    toast({
      title: "Preferences Saved",
      description: "Your preferences have been updated successfully.",
      variant: "default"
    });
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
      variant: "default"
    });
    navigate('/');
  };

  return (
    <header className="w-full py-4 px-4 md:px-8 backdrop-blur-md bg-white/70 dark:bg-black/20 border-b border-border sticky top-0 z-50 animate-fade-in">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-4 transition-transform duration-300 hover:scale-[1.05]">
          <img src="../blendar.jpg" alt="Logo" className="h-10 w-10 rounded-full" />

          <div className="flex flex-col">
            <span className="text-xl font-alef font-bold text-brand-darkGray dark:text-white">
              {isChat ? "The Tutor Laith" : "Blend.Ar"}
            </span>
            {!isChat && <span className="text-xs text-brand-darkGray/80 dark:text-white/80">.שפה. מפגש. קהילה</span>}
          </div>
        </Link>
        
        <div className="flex items-center gap-3">
          
          {isChat && <Link to="/" className="text-sm font-medium text-brand-darkGray hover:text-brand-bordeaux transition-colors dark:text-white dark:hover:text-brand-yellow">
              Home
            </Link>}
          
          <TooltipProvider>
            <div className="flex items-center space-x-2">
              {/* User Settings icon Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={handleTogglePreferences} className="flex items-center justify-center h-9 w-9 rounded-full hover:ring-2 hover:ring-brand-bordeaux/30 transition-all bg-brand-bordeaux text-white overflow-hidden" aria-label="User Preferences">
                    <Settings size={16} className="transition-transform duration-300 hover:rotate-90" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>User Preferences</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Admin Access Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={handleOpenPasswordDialog} className="flex items-center justify-center h-9 w-9 rounded-full hover:ring-2 hover:ring-brand-bordeaux/30 transition-all dark:bg-white/10 bg-brand-darkGray/10 dark:text-white text-brand-darkGray" aria-label="Admin Access">
                    <User size={16} className="transition-transform duration-300 hover:scale-110" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Admin Access</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Logout Button - Only show when authenticated */}
              {isAuthenticated && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={handleLogout} 
                      className="flex items-center justify-center h-9 w-9 rounded-full hover:ring-2 hover:ring-brand-bordeaux/30 transition-all dark:bg-white/10 bg-brand-darkGray/10 dark:text-white text-brand-darkGray"
                      aria-label="Logout"
                    >
                      <LogOut size={16} className="transition-transform duration-300 hover:scale-110" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Logout</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {/* Theme Toggle Button */}
              {/* <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={toggleTheme} className="flex items-center justify-center h-9 w-9 rounded-full hover:ring-2 hover:ring-brand-bordeaux/30 transition-all dark:bg-white/10 bg-brand-darkGray/10 dark:text-white text-brand-darkGray" aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
                    {isDarkMode ? <Sun size={16} className="transition-transform duration-300 hover:rotate-12" /> : <Moon size={16} className="transition-transform duration-300 hover:-rotate-12" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isDarkMode ? "Light Mode" : "Dark Mode"}</p>
                </TooltipContent>
              </Tooltip> */}
            </div>
          </TooltipProvider>
        </div>
      </div>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white/90 dark:bg-brand-darkGray/90 backdrop-blur-lg border border-brand-bordeaux/20">
          <DialogHeader>
            <DialogTitle>Admin Access</DialogTitle>
            <DialogDescription>
              Enter the admin password to access chat logs.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit}>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} className={isPasswordIncorrect ? "border-red-500" : ""} autoComplete="current-password" />
              </div>
              {isPasswordIncorrect && <p className="text-sm text-red-500">
                  Incorrect password. Try again.
                </p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClosePasswordDialog}>
                Cancel
              </Button>
              <Button type="submit" className="bg-brand-bordeaux hover:bg-brand-bordeaux/90 text-white">
                Access Admin Panel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preferences Popup */}
      <PreferencesPopup isOpen={isPreferencesOpen} onSave={handleSavePreferences} />
    </header>
  );
};

export default Header;
