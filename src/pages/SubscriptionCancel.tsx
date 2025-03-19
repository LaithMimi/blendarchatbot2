import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';

const SubscriptionCancel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4 bg-brand-background dark:bg-brand-darkGray/90">
        <div className="max-w-md w-full bg-white/80 dark:bg-brand-darkGray/70 backdrop-blur-md border border-brand-bordeaux/20 rounded-xl p-8 shadow-xl">
          <div className="text-center py-8">
            <div className="h-20 w-20 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-12 w-12 text-amber-600 dark:text-amber-400" />
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Subscription Cancelled</h2>
            
            <p className="mb-6 text-muted-foreground">
              Your subscription payment was cancelled. No charges have been made to your account.
            </p>
            
            <div className="text-right" dir="rtl">
              <p className="mb-3 text-gray-600 dark:text-gray-300">
                תשלום המנוי שלך בוטל. לא בוצעו חיובים בחשבונך.
              </p>
              
              <p className="font-arabic text-gray-600 dark:text-gray-300">
                تم إلغاء دفع اشتراكك. لم يتم إجراء أي رسوم على حسابك.
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubscriptionCancel;