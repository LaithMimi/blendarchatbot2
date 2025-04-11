import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Footer from '@/components/Footer';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Mail, User, Loader2, CheckCircle, Send, ArrowRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import Cookies from 'js-cookie';
import { FcGoogle } from "react-icons/fc"; // Google Icon

const Auth: React.FC = () => {
  const [step, setStep] = useState<'email' | 'name' | 'sent'>('email');
  const [loading, setLoading] = useState(false);
  const [localUserName, setLocalUserName] = useState('');
  
  const { 
    email, 
    setEmail, 
    setUserName,
    currentUser, 
    isAuthenticated, 
    googleSignIn, 
    sendEmailLink,
    completeEmailSignIn
  } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Store auth data securely
  const storeAuthData = (data: { email: string; userName: string }) => {
    // Store in cookie
    Cookies.set('authData', JSON.stringify(data), { secure: true, sameSite: 'strict' });
    
    // Also store in sessionStorage as backup
    try {
      sessionStorage.setItem('authData', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to store auth data in sessionStorage:', e);
    }
  };

  // Check if this is a callback from email link
  useEffect(() => {
    if (location.pathname === '/auth/complete') {
      const storedEmail = localStorage.getItem('emailForSignIn');
      if (storedEmail) {
        handleEmailLinkSignIn(storedEmail);
      } else {
        toast({
          title: "שגיאת אימות",
          description: "לא נמצאה כתובת אימייל מאוחסנת. נא להזין אימייל שוב.",
          variant: "destructive"
        });
      }
    }
  }, [location.pathname]);

  // Handle email link sign-in completion
  const handleEmailLinkSignIn = async (emailAddress: string) => {
    setLoading(true);
    try {
      const success = await completeEmailSignIn(emailAddress);
      if (success) {
        toast({
          title: "התחברות הצליחה",
          description: "התחברת בהצלחה באמצעות אימייל",
          variant: "default"
        });
        navigate('/chat');
      } else {
        toast({
          title: "התחברות נכשלה",
          description: "אירעה שגיאה בהתחברות. נסה שוב.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error completing email sign-in:", error);
      toast({
        title: "שגיאת התחברות",
        description: "אירעה שגיאה בהתחברות. נסה שוב.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const success = await googleSignIn();
      if (success) {
        window.location.href = "/chat"; // Redirect after login
      } else {
        toast({ 
          title: "התחברות נכשלה", 
          description: "לא ניתן להשלים את ההתחברות עם Google. אנא נסה שוב.", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error("Error in Google login:", error);
      toast({ 
        title: "שגיאת התחברות", 
        description: "אירעה שגיאה בזמן ההתחברות. אנא נסה שוב מאוחר יותר.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      navigate('/chat');
    }
  }, [isAuthenticated, currentUser, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({ 
        title: "אימייל לא תקין", 
        description: "אנא הכנס כתובת אימייל חוקית", 
        variant: "destructive" 
      });
      return;
    }
    
    // Continue to the name step
    setStep('name');
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localUserName || !localUserName.trim()) {
      toast({ 
        title: "נדרש שם", 
        description: "אנא הכנס את שמך", 
        variant: "destructive" 
      });
      return;
    }
    
    setLoading(true);
    try {
      // Set user name in auth context
      setUserName(localUserName);
      
      // Store auth data with both email and username
      storeAuthData({ email, userName: localUserName });
      
      // Save email for link authentication
      localStorage.setItem('emailForSignIn', email);
      
      // Send the authentication email
      const success = await sendEmailLink(email);
      if (success) {
        setStep('sent');
        toast({ 
          title: "קישור נשלח", 
          description: "קישור להתחברות נשלח לכתובת האימייל שלך", 
          variant: "default" 
        });
      } else {
        toast({ 
          title: "השליחה נכשלה", 
          description: "אירעה שגיאה בשליחת הקישור. אנא נסה שוב.", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error("Error sending email link:", error);
      toast({ 
        title: "שגיאת שליחה", 
        description: "אירעה שגיאה בשליחת הקישור. אנא נסה שוב.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated && currentUser) {
    return null;
  }

  const getHeaderInfo = () => {
    switch (step) {
      case 'email':
        return {
          icon: <Mail className="h-8 w-8 text-brand-bordeaux" />,
          title: "התחברות למערכת",
          description: "התחבר באמצעות אימייל או Google"
        };
      case 'name':
        return {
          icon: <User className="h-8 w-8 text-brand-bordeaux" />,
          title: "הזן את שמך",
          description: "איך לפנות אליך באפליקציה?"
        };
      case 'sent':
        return {
          icon: <CheckCircle className="h-8 w-8 text-brand-bordeaux" />,
          title: "בדוק את האימייל שלך",
          description: "שלחנו קישור התחברות לאימייל שלך"
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-brand-background to-white dark:from-brand-darkGray/90 dark:to-black/80">
      <div className="flex-1 container max-w-md mx-auto py-12 px-4 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-brand-yellow rounded-full mb-4 animate-float-slow shadow-lg">
            <img src="/blendar.jpg" alt="Logo" className="h-20 w-20 rounded-full" />
          </div>
          <h1 className="text-3xl font-bold text-center text-brand-darkGray dark:text-white mb-2" dir="rtl">
            ברוכים הבאים ל-Blend.Ar
          </h1>
          <p className="text-sm text-center text-muted-foreground" dir="rtl">
            התחבר כדי להתחיל ללמוד ערבית
          </p>
        </div>

        <Card className="w-full backdrop-blur-md bg-white/90 dark:bg-brand-darkGray/60 border border-white/20 dark:border-white/10 shadow-xl">
          <CardHeader className="flex flex-row items-center gap-4 p-6">
            <div className="p-2 rounded-full bg-brand-yellow/20">
              {headerInfo.icon}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold" dir="rtl">
                {headerInfo.title}
              </h2>
              <p className="text-sm text-muted-foreground" dir="rtl">
                {headerInfo.description}
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-0">
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4" dir="rtl">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">כתובת אימייל</Label>
                  <div className="relative">
                    <Input
                      type="email"
                      id="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 text-right"
                      required
                      dir="ltr"
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">נשלח קישור התחברות לכתובת זו</p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand-bordeaux hover:bg-brand-bordeaux/90 text-white transition-all duration-300 font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      מתקדם...
                    </>
                  ) : (
                    <>
                      המשך
                      <ArrowRight className="mr-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                <div className="relative w-full text-center my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-brand-darkGray/60 px-2 text-muted-foreground">
                      או
                    </span>
                  </div>
                </div>
                
                <Button
                  onClick={handleGoogleLogin}
                  type="button"
                  className="w-full bg-white text-black border border-gray-300 shadow-md flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <FcGoogle className="h-5 w-5" />
                  <span>התחבר עם Google</span>
                </Button>
              </form>
            )}

            {step === 'name' && (
              <form onSubmit={handleNameSubmit} className="space-y-4" dir="rtl">
                <div className="space-y-2">
                  <Label htmlFor="userName" className="text-sm font-medium">השם שלך</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      id="userName"
                      placeholder="הכנס את שמך"
                      value={localUserName}
                      onChange={(e) => setLocalUserName(e.target.value)}
                      className="pl-10 text-right"
                      required
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">איך נפנה אליך באפליקציה?</p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand-bordeaux hover:bg-brand-bordeaux/90 text-white transition-all duration-300 font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      שולח...
                    </>
                  ) : (
                    <>
                      שלח קישור התחברות
                      <Send className="mr-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => setStep('email')}
                >
                  חזור אחורה
                </Button>
              </form>
            )}

            {step === 'sent' && (
              <div className="space-y-6 text-center" dir="rtl">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900/30">
                  <p className="text-green-800 dark:text-green-300">
                    קישור התחברות נשלח ל-{email}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    אנא בדוק את תיבת הדואר הנכנס שלך ולחץ על הקישור להתחברות
                  </p>
                </div>
                
                <Button
                  onClick={handleNameSubmit}
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      שולח...
                    </>
                  ) : (
                    "שלח קישור שוב"
                  )}
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  <p>לא קיבלת? בדוק את תיקיית הספאם או השתמש בכתובת אימייל אחרת</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground mt-6" dir="rtl">
          על ידי הרשמה, אתה מסכים לתנאי השימוש ומדיניות הפרטיות שלנו.
        </p>
      </div>

      <Footer />
    </div>
  );
};

export default Auth;