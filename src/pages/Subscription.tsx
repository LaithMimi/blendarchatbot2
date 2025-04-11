import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SubscriptionCard from '@/components/SubscriptionCard';
import { Star, BadgeDollarSign, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ChatBackground from '@/components/ChatBackground';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUserSubscription, 
  getPlanPrice,
  SubscriptionData,
  BillingCycle
} from '@/api/subscriptionApi';
import { useNavigate } from 'react-router-dom';

const Subscription: React.FC = () => {
  const [yearlyBilling, setYearlyBilling] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState<boolean>(true);
  
  const { toast } = useToast();
  const { currentUser, email, isAuthenticated, authToken, userName } = useAuth();
  const navigate = useNavigate();

  // Fetch current subscription status
  useEffect(() => {
    const fetchSubscription = async () => {
      if (isAuthenticated && currentUser) {
        try {
          const userSubscription = await getUserSubscription(currentUser);
          setSubscription(userSubscription);
          
          // Set billing cycle based on current subscription
          if (userSubscription?.billingCycle === 'yearly') {
            setYearlyBilling(true);
          }
        } catch (error) {
          console.error('Error fetching subscription:', error);
          toast({
            title: "Error",
            description: "Failed to load subscription information.",
            variant: "destructive"
          });
        } finally {
          setIsLoadingSubscription(false);
        }
      } else {
        setIsLoadingSubscription(false);
      }
    };
    
    fetchSubscription();
  }, [isAuthenticated, currentUser, toast]);

  const getBillingCycle = (): BillingCycle => {
    return yearlyBilling ? 'yearly' : 'monthly';
  };

  const handleSubscribe = async (plan: 'basic' | 'premium') => {
    if (!isAuthenticated) {
      toast({
        title: "Please login",
        description: "You need to be logged in to subscribe.",
        variant: "default"
      });
      navigate('/auth');
      return;
    }
    
    if (subscription?.plan === plan && 
        subscription?.billingCycle === getBillingCycle() &&
        subscription?.status === 'active') {
      toast({
        title: "Already subscribed",
        description: "You are already subscribed to this plan.",
        variant: "default"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (plan === 'basic') {
        toast({
          title: "Basic Plan Activated",
          description: "You are now on the Basic plan.",
          variant: "default"
        });
        navigate('/chat');
        return;
      }
      
      const price = getPlanPrice('premium', getBillingCycle());
      const token = localStorage.getItem('authToken') || 
                    sessionStorage.getItem('authToken') || 
                    '';
      
      if (!token) {
        throw new Error('No authentication token found');
      }
  
      const userEmail = email || currentUser || '';
      const userNameParam = userName || email?.split('@')[0] || 'User';
      const dummySessionId = Date.now().toString();
      
      const paymentBaseUrl = "https://meshulam.co.il/purchase";
      const paymentParams = {
        'b': '511448e20886c18a4bab323430775fb8',
        'full_name': userNameParam,
        'email': userEmail,
        'phone': '',
        'price': price,
        'custom1': plan,
        'custom2': getBillingCycle(),
        'custom3': dummySessionId
      };
      
      const sessionUrl = `${paymentBaseUrl}?${Object.entries(paymentParams)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')}`;
      
      const subscriptionData = {
        userId: currentUser,
        userEmail: userEmail,
        plan: plan,
        billingCycle: getBillingCycle(),
        status: "pending",
        startDate: new Date().toISOString(),
        endDate: getBillingCycle() === 'yearly' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        autoRenew: true,
        paymentMethod: "meshulam",
        sessionId: dummySessionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem('pendingSubscription', JSON.stringify(subscriptionData));
      
      console.log("Redirecting to payment gateway:", sessionUrl);
      console.log("Subscription data:", subscriptionData);
      
      window.location.href = sessionUrl;
      
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Failed",
        description: "There was an error processing your subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const isActive = subscription?.status === 'active' || subscription?.status === 'trial';
  
  const getRemainingDays = () => {
    if (!subscription?.endDate) return 0;
    
    const endDate = new Date(subscription.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const SubscriptionInfo = () => {
    if (isLoadingSubscription) {
      return (
        <div className="flex justify-center items-center my-8 p-6">
          <Loader2 className="h-8 w-8 animate-spin text-brand-bordeaux" />
        </div>
      );
    }
    
    if (!subscription) {
      return null;
    }
    
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="bg-white/80 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl border border-brand-bordeaux/20 mb-12 max-w-2xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-4">
          {subscription.plan === 'premium' ? (
            <Star className="h-6 w-6 text-brand-yellow" />
          ) : (
            <BadgeDollarSign className="h-6 w-6 text-brand-bordeaux" />
          )}
          <h3 className="text-xl font-bold">
            Current Subscription: {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className={`font-medium ${isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Billing Cycle</p>
            <p className="font-medium">
              {subscription.billingCycle.charAt(0).toUpperCase() + subscription.billingCycle.slice(1)}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Started On</p>
            <p className="font-medium">{formatDate(subscription.startDate)}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Expires On</p>
            <p className="font-medium">{formatDate(subscription.endDate)}</p>
          </div>
        </div>
        
        {isActive && (
          <div className="mt-4 p-3 bg-brand-yellow/20 rounded-lg">
            <p className="text-sm text-brand-darkGray">
              {subscription.autoRenew 
                ? `Your subscription will automatically renew ${subscription.billingCycle === 'monthly' ? 'each month' : 'annually'}.` 
                : `Your subscription will expire in ${getRemainingDays()} days.`}
            </p>
          </div>
        )}
      </motion.div>
    );
  };
  
  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-brand-background dark:bg-brand-darkGray">
      <div className="absolute top-0 left-0 w-full h-64 overflow-hidden opacity-40 pointer-events-none">
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-brand-bordeaux/20 blur-3xl"></div>
        <div className="absolute top-20 right-10 w-60 h-60 rounded-full bg-brand-yellow/20 blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
      <ChatBackground />

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-brand-darkGray dark:text-white mb-4">Choose Your <span className="text-brand-bordeaux">Learning Journey</span></h1>
        
          <div className="mt-4 flex flex-col space-y-2 items-center">
            <p className="text-right text-gray-600 dark:text-gray-300 max-w-3xl" dir="rtl">
              בחר/י את התוכנית המושלמת להאצת לימוד השפה הערבית שלך 
            </p>
            <p className="text-right text-gray-600 dark:text-gray-300 max-w-3xl font-arabic" dir="rtl">
              اختار/ي الخطة المثالية لتسريع تجربة تعلم اللغة العربية المحكية
            </p>
          </div>

          <SubscriptionInfo />

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3">
            <span className={`text-sm ${!yearlyBilling ? 'font-bold text-brand-bordeaux' : 'text-gray-500'}`}>
              Monthly / חודשי / شهري
            </span>
            <div className="flex items-center space-x-2">
              <Switch
                id="billing-toggle"
                checked={yearlyBilling}
                onCheckedChange={setYearlyBilling}
              />
              <Label htmlFor="billing-toggle" className="sr-only">Toggle yearly billing</Label>
            </div>
            <span className={`text-sm ${yearlyBilling ? 'font-bold text-brand-bordeaux' : 'text-gray-500'}`}>
              Yearly / שנתי / سنوي
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-brand-yellow text-brand-darkGray">
                Save 20%
              </span>
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-center items-center">
          <SubscriptionCard
            title="Basic"
            titleHebrew="בסיסי"
            titleArabic="أساسي"
            price={yearlyBilling ? "Free" : "Free"}
            period={yearlyBilling ? "year" : "month"}
            descriptionHebrew="מושלם למתחילים המתחילים את המסע בערבית"
            descriptionArabic="مثالي للمبتدئين الذين يبدأون رحلتهم في اللغة العربية"
            features={[
              {
                english: "Limited daily messages",
                hebrew: "מספר מוגבל של הודעות יומיות",
                arabic: "عدد محدود من الرسائل اليومية"
              },
            ]}
            icon={<BadgeDollarSign className="h-5 w-5" />}
            buttonText={isLoading ? "Processing..." : "Start Basic"}
            buttonTextHebrew="התחל בסיסי"
            buttonTextArabic="ابدأ الأساسي"
            onClick={() => handleSubscribe("basic")}
          />

          <SubscriptionCard
            title="Premium"
            titleHebrew="פרימיום"
            titleArabic="بريميوم"
            price={yearlyBilling ? "₪288" : "₪30"}
            period={yearlyBilling ? "year" : "month"}
            descriptionHebrew="למידה מקיפה לתלמידי שפה רציניים"
            descriptionArabic="تعلم شامل لطلاب اللغة الجادين"
            features={[
              {
                english: "Unlimited messages",
                hebrew: "הודעות ללא הגבלה",
                arabic: "رسائل غير محدودة"
              },
            ]}
            icon={<Star className="h-5 w-5" />}
            popular={true}
            buttonText={isLoading ? "Processing..." : "Choose Premium"}
            buttonTextHebrew="בחר פרימיום"
            buttonTextArabic="اختر بريميوم"
            onClick={() => handleSubscribe("premium")}
          />
        </div>
      </div>
    </div>
  );
};

export default Subscription;