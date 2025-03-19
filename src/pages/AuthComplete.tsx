import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Check, AlertCircle } from 'lucide-react';

const AuthComplete: React.FC = () => {
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const { completeEmailSignIn, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const completeAuth = async () => {
      try {
        // Get the email from localStorage
        const email = localStorage.getItem('emailForSignIn');
        
        if (!email) {
          // Email not found in storage
          setVerifying(false);
          setSuccess(false);
          toast({
            title: "התחברות נכשלה",
            description: "לא נמצאה כתובת אימייל. נא לנסות להתחבר שוב.",
            variant: "destructive"
          });
          return;
        }
        
        // Complete the sign-in process
        const result = await completeEmailSignIn(email);
        
        setVerifying(false);
        setSuccess(result);
        
        if (result) {
          toast({
            title: "התחברות הצליחה",
            description: "אימות האימייל הושלם בהצלחה",
            variant: "default"
          });
          
          // Remove the email from storage
          localStorage.removeItem('emailForSignIn');
          
          // Short delay before redirecting
          setTimeout(() => {
            navigate('/chat');
          }, 1500);
        } else {
          toast({
            title: "אימות נכשל",
            description: "לא ניתן היה להשלים את תהליך האימות. נא לנסות שוב.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error completing email sign-in:", error);
        setVerifying(false);
        setSuccess(false);
        toast({
          title: "שגיאת התחברות",
          description: "אירעה שגיאה בתהליך האימות. נא לנסות שוב."
        });
      }
    };

    // Only attempt to complete auth if not already authenticated
    if (!isAuthenticated) {
      completeAuth();
    } else {
      // User is already authenticated, redirect to chat
      navigate('/chat');
    }
  }, [completeEmailSignIn, isAuthenticated, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-background to-white dark:from-brand-darkGray/90 dark:to-black/80 p-4">
      <Card className="w-full max-w-md backdrop-blur-md bg-white/90 dark:bg-brand-darkGray/60 border border-white/20 dark:border-white/10 shadow-xl">
        <CardHeader className="text-center">
          <h2 className="text-2xl font-semibold" dir="rtl">אימות התחברות</h2>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center justify-center p-6">
          {verifying ? (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-16 w-16 text-brand-bordeaux animate-spin" />
              <p className="text-lg" dir="rtl">מאמת את הקישור שלך...</p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-lg text-green-700 dark:text-green-300" dir="rtl">התחברות הצליחה!</p>
              <p className="text-sm text-muted-foreground text-center" dir="rtl">
                מעביר אותך לאפליקציה...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-lg text-red-700 dark:text-red-300" dir="rtl">אימות נכשל</p>
              <p className="text-sm text-muted-foreground text-center" dir="rtl">
                הקישור אינו תקין או שפג תוקפו. נא לנסות להתחבר שוב.
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="justify-center pb-6">
          {!verifying && !success && (
            <button 
              onClick={() => navigate('/auth')}
              className="px-4 py-2 bg-brand-bordeaux text-white rounded-md hover:bg-brand-bordeaux/90 transition-colors"
              dir="rtl"
            >
              חזור למסך ההתחברות
            </button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthComplete;