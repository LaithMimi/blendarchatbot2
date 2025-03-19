import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// Admin password (in a real app, this would be handled server-side)
const ADMIN_PASSWORD = "admin1234";

const AdminHeader: React.FC = () => {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isPasswordIncorrect, setIsPasswordIncorrect] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
      navigate('/admin/chat-logs');
      toast({
        title: "Admin Access Granted",
        description: "You now have access to the admin panel.",
        variant: "default",
      });
    } else {
      setIsPasswordIncorrect(true);
      toast({
        title: "Access Denied",
        description: "Incorrect password. Try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenPasswordDialog}
            className="p-3 bg-brand-bordeaux text-white rounded-full shadow-lg hover:bg-brand-bordeaux/90 transition-colors"
            title="Admin Access"
          >
            <User size={20} />
          </Button>
        </div>
      </div>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Access</DialogTitle>
            <DialogDescription>
              Enter the admin password to access chat logs.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit}>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={isPasswordIncorrect ? "border-red-500" : ""}
                  autoComplete="current-password"
                />
              </div>
              {isPasswordIncorrect && (
                <p className="text-sm text-red-500">
                  Incorrect password. Try again.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClosePasswordDialog}>
                Cancel
              </Button>
              <Button type="submit">Access Admin Panel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminHeader;
