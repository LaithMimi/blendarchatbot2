import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SubscriptionCard from '@/components/SubscriptionCard';
import { Star, Shield, BadgeDollarSign, Loader2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ChatBackground from '@/components/ChatBackground';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUserSubscription, 
  cancelSubscription, 
  getPlanPrice,
  hasActiveSubscription,
  SubscriptionData,
  BillingCycle
} from '@/api/subscriptionApi';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from 'react-router-dom';

const Subscription: React.FC = () => {
  const [yearlyBilling, setYearlyBilling] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState<boolean>(true);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [showCancelDialog, setShowCancelDialog] = useState<boolean>(false);
  
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

  // Updated handleSubscribe function with proper error handling
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
    
    // Check if already subscribed to the same plan
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
      // For basic plan, no payment needed
      if (plan === 'basic') {
        toast({
          title: "Basic Plan Activated",
          description: "You are now on the Basic plan.",
          variant: "default"
        });
        navigate('/chat');
        return;
      }
      
      // For premium, show payment checkout
      const price = getPlanPrice('premium', getBillingCycle());
      
      // Get authentication token from storage
      const token = localStorage.getItem('authToken') || 
                    sessionStorage.getItem('authToken') || 
                    '';
      
      if (!token) {
        throw new Error('No authentication token found');
      }
  
      // Skip API call for now and simulate a redirect
      // This is a temporary workaround until the backend API is fixed
      
      // Instead of actual API call, create a direct URL to the payment gateway
      // In a real application, you should fix the backend API
      const userEmail = email || currentUser || '';
      const userNameParam = userName || email?.split('@')[0] || 'User';
      const dummySessionId = Date.now().toString();
      
      // Redirect to Payment Gateway (example, this would normally come from the API)
      const paymentBaseUrl = "https://meshulam.co.il/purchase";
      const paymentParams = {
        'b': '511448e20886c18a4bab323430775fb8',  // From your code example
        'full_name': userNameParam,
        'email': userEmail,
        'phone': '',
        'price': price,
        'custom1': plan,
        'custom2': getBillingCycle(),
        'custom3': dummySessionId
      };
      
      // Create URL with query parameters
      const sessionUrl = `${paymentBaseUrl}?${Object.entries(paymentParams)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')}`;
      
      // Store subscription data in localStorage for reference
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
      
      // Log info for debugging
      console.log("Redirecting to payment gateway:", sessionUrl);
      console.log("Subscription data:", subscriptionData);
      
      // Redirect to Payment Checkout
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
  
  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const success = await cancelSubscription(currentUser);
      
      if (success) {
        // Update local subscription state
        setSubscription(prev => prev ? {
          ...prev,
          status: 'cancelled',
          autoRenew: false
        } : null);
        
        toast({
          title: "Subscription Cancelled",
          description: "Your subscription has been cancelled. You'll have access until the end of your billing period.",
          variant: "default"
        });
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Cancellation Failed",
        description: "There was an error cancelling your subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
    }
  };
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  // Format subscription end date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Check if subscription is active
  const isActive = subscription?.status === 'active' || subscription?.status === 'trial';
  
  // Calculate remaining days in subscription
  const getRemainingDays = () => {
    if (!subscription?.endDate) return 0;
    
    const endDate = new Date(subscription.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  // Enhanced SubscriptionInfo component with more prominent cancel button
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
        
        {isActive && subscription.plan !== 'basic' && (
          <div className="mt-8 border-t pt-6 border-brand-bordeaux/10">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div>
                <h4 className="font-medium text-lg mb-1">Manage Subscription</h4>
                <p className="text-sm text-muted-foreground">
                  You can cancel your subscription at any time. You'll retain access until {formatDate(subscription.endDate)}.
                </p>
              </div>
              
              <Button 
                variant="outline" 
                className="text-red-600 border-red-600 hover:bg-red-50 hover:border-red-800 px-6 py-2 font-medium flex items-center gap-2"
                onClick={() => setShowCancelDialog(true)}
              >
                <XCircle size={18} />
                Cancel Subscription
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    );
  };
  
  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-brand-background dark:bg-brand-darkGray">
      {/* Decorative background elements */}
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

          {/* Display current subscription info */}
          <SubscriptionInfo />

          {/* Billing toggle */}
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
              {
                english: "Basic learning materials",
                hebrew: "חומרי לימוד בסיסיים",
                arabic: "مواد تعليمية أساسية"
              },
              {
                english: "Access to community forum",
                hebrew: "גישה לפורום הקהילה",
                arabic: "الوصول إلى منتدى المجتمع"
              }
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
              {
                english: "Advanced vocabulary training",
                hebrew: "אימון אוצר מילים מתקדם",
                arabic: "تدريب مفردات متقدم"
              },
              {
                english: "Personalized learning path",
                hebrew: "מסלול למידה מותאם אישית",
                arabic: "مسار تعليمي مخصص"
              },
              {
                english: "Pronunciation feedback",
                hebrew: "משוב על הגייה",
                arabic: "تعليقات على النطق"
              },
              {
                english: "Weekly live sessions",
                hebrew: "שיעורים חיים שבועיים",
                arabic: "جلسات أسبوعية مباشرة"
              }
            ]}
            icon={<Star className="h-5 w-5" />}
            popular={true}
            buttonText={isLoading ? "Processing..." : "Choose Premium"}
            buttonTextHebrew="בחר פרימיום"
            buttonTextArabic="اختر بريميوم"
            onClick={() => handleSubscribe("premium")}
          />
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-white/70 dark:bg-brand-darkGray/50 backdrop-blur-sm border border-white/20 dark:border-white/10 shadow-lg">
            <Shield className="h-10 w-10 mx-auto mb-4 text-brand-bordeaux" />
            <h3 className="text-2xl font-bold mb-2" dir="rtl">שביעות רצון מובטחת</h3>
            
            <div className="flex flex-col gap-3">
              <p className="text-gray-600 dark:text-gray-300 text-right" dir="rtl">
                נסה כל תוכנית ללא סיכון למשך 3 ימים. אם אינך מרוצה לחלוטין, נחזיר לך את התשלום
              </p>
              
              <p className="text-gray-600 dark:text-gray-300 text-right font-arabic" dir="rtl">
                 جرّب أي خطة بدون مخاطرة لمدة 3 ايام. إذا ما كنت راضي، رح نرجعلك المبلغ
              </p>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-16 max-w-3xl mx-auto"
        >
          <h2 className="text-2xl text-center font-bold mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="p-6 rounded-lg bg-white/70 dark:bg-brand-darkGray/50 backdrop-blur-sm border border-white/10 shadow-sm">
              <h3 className="text-lg font-medium mb-2">How do I switch plans?</h3>
              <p className="text-sm text-muted-foreground mb-1">
                You can switch plans at any time from this page. If you upgrade, you'll be charged the prorated difference. If you downgrade, you'll retain premium access until your current billing period ends.
              </p>
              <p className="text-sm text-right text-gray-600 dark:text-gray-300" dir="rtl">
                ניתן להחליף תוכניות בכל עת מהגדרות החשבון שלך. הפרש המחירים יחולק באופן יחסי
              </p>
              <p className="text-sm text-right text-gray-600 dark:text-gray-300 font-arabic" dir="rtl">
                بتقدر تبدل الخطط بأي وقت من إعدادات حسابك. فرق السعر رح ينحسب بالتناسب
              </p>
            </div>
            
            <div className="p-6 rounded-lg bg-white/70 dark:bg-brand-darkGray/50 backdrop-blur-sm border border-white/10 shadow-sm">
              <h3 className="text-lg font-medium mb-2">Can I cancel my subscription at any time?</h3>
              <p className="text-sm text-muted-foreground mb-1">
                Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.
              </p>
              <p className="text-sm text-right text-gray-600 dark:text-gray-300" dir="rtl">
                כן, אתה יכול לבטל את המנוי שלך בכל עת. הגישה שלך תימשך עד לסוף תקופת החיוב
              </p>
              <p className="text-sm text-right text-gray-600 dark:text-gray-300 font-arabic" dir="rtl">
                نعم، بتقدر تلغي اشتراكك بأي وقت. رح تضل عندك إمكانية الوصول لآخر فترة الاشتراك
              </p>
            </div>
            
            <div className="p-6 rounded-lg bg-white/70 dark:bg-brand-darkGray/50 backdrop-blur-sm border border-white/10 shadow-sm">
              <h3 className="text-lg font-medium mb-2">What payment methods do you accept?</h3>
              <p className="text-sm text-muted-foreground mb-1">
                We accept all major credit cards through our secure payment processor, Meshulam.
              </p>
              <p className="text-sm text-right text-gray-600 dark:text-gray-300" dir="rtl">
                אנו מקבלים את כל כרטיסי האשראי העיקריים באמצעות מעבד התשלומים המאובטח שלנו, משולם.
              </p>
              <p className="text-sm text-right text-gray-600 dark:text-gray-300 font-arabic" dir="rtl">
                نقبل جميع بطاقات الائتمان الرئيسية من خلال معالج الدفع الآمن لدينا، مشلم.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Cancellation Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your premium subscription? You'll still have access until {formatDate(subscription?.endDate)}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
              disabled={isCancelling}
            >
              Keep Subscription
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel Subscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subscription;