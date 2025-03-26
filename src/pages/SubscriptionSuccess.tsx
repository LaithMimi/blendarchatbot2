import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { verifySubscriptionStatus } from '@/api/subscriptionApi';
import { useToast } from '@/hooks/use-toast';
import Footer from '@/components/Footer';

const SubscriptionSuccess: React.FC = () => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const verifyPayment = async () => {
      if (!currentUser) {
        setIsVerifying(false);
        setIsSuccess(false);
        toast({
          title: "Authentication Error",
          description: "Please log in again to verify your subscription.",
          variant: "destructive"
        });
        return;
      }
      
      try {
        // Verify subscription status
        const isPremium = await verifySubscriptionStatus(currentUser);
        
        setIsSuccess(isPremium);
        
        if (isPremium) {
          toast({
            title: "Subscription Activated",
            description: "Your premium subscription has been successfully activated!",
            variant: "default"
          });
        } else {
          toast({
            title: "Verification Failed",
            description: "We couldn't verify your payment. Please contact support.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setIsSuccess(false);
        
        toast({
          title: "Verification Error",
          description: "An error occurred while verifying your payment. Please contact support.",
          variant: "destructive"
        });
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyPayment();
  }, [currentUser, toast]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4 bg-brand-background dark:bg-brand-darkGray/90">
        <div className="max-w-md w-full bg-white/80 dark:bg-brand-darkGray/70 backdrop-blur-md border border-brand-bordeaux/20 rounded-xl p-8 shadow-xl">
          {isVerifying ? (
            <div className="text-center py-12">
              <Loader2 className="h-16 w-16 text-brand-bordeaux mx-auto animate-spin" />
              <h2 className="text-2xl font-bold mt-6 mb-2">Verifying Payment</h2>
              <p className="text-muted-foreground">
                Please wait while we verify your subscription payment...
              </p>
            </div>
          ) : isSuccess ? (
            <div className="text-center py-8">
              <div className="h-20 w-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              
              <h2 className="text-2xl font-bold mb-4">Subscription Activated!</h2>
              
              <p className="mb-6 text-muted-foreground">
                Your premium subscription has been successfully activated. Enjoy all the premium features of Blend.Ar!
              </p>
              
              <div className="text-right" dir="rtl">
                <p className="mb-3 text-gray-600 dark:text-gray-300">
                  המנוי שלך הופעל בהצלחה! תיהנה מכל התכונות המתקדמות של Blend.Ar!
                </p>
                
                <p className="font-arabic text-gray-600 dark:text-gray-300">
                  تم تفعيل اشتراكك بنجاح! استمتع بجميع الميزات المتقدمة من Blend.Ar!
                </p>
              </div>
              
              <div className="mt-8">
                <Button 
                  onClick={() => navigate('/chat')}
                  className="bg-brand-bordeaux hover:bg-brand-bordeaux/90 text-white"
                >
                  Go to Chat
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="h-20 w-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
              
              <h2 className="text-2xl font-bold mb-4">Verification Failed</h2>
              
              <p className="mb-6 text-muted-foreground">
                We couldn't verify your subscription payment. This could be due to:
              </p>
              
              <ul className="list-disc text-left mb-6 pl-6 text-muted-foreground">
                <li>Payment was canceled or declined</li>
                <li>Temporary issue with our payment processor</li>
                <li>The transaction has already been processed</li>
              </ul>
              
              <div className="text-right mt-6" dir="rtl">
                <p className="text-gray-600 dark:text-gray-300">
                  לא הצלחנו לאמת את תשלום המנוי שלך. אנא נסה שוב או צור קשר עם התמיכה.
                </p>
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => navigate('/subscription')}
                  className="bg-brand-bordeaux hover:bg-brand-bordeaux/90 text-white"
                >
                  Try Again
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => navigate('/chat')}
                >
                  Go to Chat
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubscriptionSuccess;