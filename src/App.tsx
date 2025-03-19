import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import AuthComplete from "./pages/AuthComplete"; 
import ChatLogs from "./pages/ChatLogs";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";
import Subscription from "./pages/Subscription";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionCancel from "./pages/SubscriptionCancel";
import { useAuth } from "./contexts/AuthContext";
const queryClient = new QueryClient();

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  // Check if there's a guest user in localStorage
  const authData = localStorage.getItem('authData');
  const isGuestUser = authData ? JSON.parse(authData).email === 'guest' : false;
  
  if (!isAuthenticated && !isGuestUser) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const AppContent = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    // We're no longer checking user preference, always default to light mode
    setIsDarkMode(false);
    
    // Make sure document starts in light mode
    document.documentElement.classList.remove('dark');
  }, []);
  
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={
          isAuthenticated ? <Navigate to="/chat" replace /> : <Auth />
        } />
        <Route path="/auth/complete" element={<AuthComplete />} /> {/* Add the new route */}
        <Route path="/chat" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/admin/chat-logs" element={<ChatLogs />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;