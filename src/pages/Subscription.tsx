
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SubscriptionCard from '@/components/SubscriptionCard';
import { Star, Shield, Zap, BadgeDollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ChatBackground from '@/components/ChatBackground';


const Subscription = () => {
  const [yearlyBilling, setYearlyBilling] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = (plan: string) => {
    toast({
      title: "Subscription Initiated",
      description: `You selected the ${plan} plan. This is a demo - no actual purchase will be made.`,
    });
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
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
                english: "",
                hebrew: "שיעורים מובנים שבועיים",
                arabic: "دروس أسبوعية منظمة"
              },
            ]}
            icon={<BadgeDollarSign className="h-5 w-5" />}
            buttonText="Start Basic"
            buttonTextHebrew="התחל בסיסי"
            buttonTextArabic="ابدأ الأساسي"
            onClick={() => handleSubscribe("Basic")}
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
                english: "",
                hebrew: "כל מה שבבסיסי",
                arabic: "كل ما هو أساسي"
              },
            ]}
            icon={<Star className="h-5 w-5" />}
            popular={true}
            buttonText="Choose Premium"
            buttonTextHebrew="בחר פרימיום"
            buttonTextArabic="اختر بريميوم"
            onClick={() => handleSubscribe("Premium")}
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
        <h2 className="text-2xl text-center text-right" dir="rtl">שאלות נפוצות</h2>

          <div className="mb-8 text-center">
            <p className="text-lg text-center text-right font-arabic" dir="rtl">الأسئلة المتكررة</p>
          </div>
          
          <div className="space-y-6">
            <div className="p-6 rounded-lg bg-white/70 dark:bg-brand-darkGray/50 backdrop-blur-sm border border-white/10 shadow-sm">
              <h3 className="text-lg text-right mb-2" dir="rtl">איך אני מחליף תוכניות?</h3>
              <p className="text-sm text-right font-arabic mb-4" dir="rtl">كيف يمكنني تبديل الخطط؟</p>
              <p className="text-gray-600 dark:text-gray-300 text-right text-sm mt-2" dir="rtl">
                ניתן להחליף תוכניות בכל עת מהגדרות החשבון שלך. הפרש המחירים יחולק באופן יחסי
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-right text-sm mt-2 font-arabic" dir="rtl">
                بتقدر تبدل الخطط بأي وقت من إعدادات حسابك. فرق السعر رح ينحسب بالتناسب
              </p>
            </div>
            
            <div className="p-6 rounded-lg bg-white/70 dark:bg-brand-darkGray/50 backdrop-blur-sm border border-white/10 shadow-sm">
              <h3 className="text-lg text-right mb-2" dir="rtl">האם אני יכול לבטל בכל עת?</h3>
              <p className="text-sm text-right font-arabic mb-4" dir="rtl">هل يمكنني الإلغاء في أي وقت؟</p>
              <p className="text-gray-600 dark:text-gray-300 text-right text-sm mt-2" dir="rtl">
                כן, אתה יכול לבטל את המנוי שלך בכל עת. הגישה שלך תימשך עד לסוף תקופת החיוב
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-right text-sm mt-2 font-arabic" dir="rtl">
                نعم، بتقدر تلغي اشتراكك بأي وقت. رح تضل عندك إمكانية الوصول لآخر فترة الاشتراك
              </p>
              <div className="text-center mt-4">
                <Button onClick={() => handleSubscribe("Cancel")}>
                  Cancel Subscription
                </Button>
              </div>
            </div>
            
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Subscription;
