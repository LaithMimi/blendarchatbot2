
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Card3D from './Card3D';

interface FeatureProps {
  text: string;
  textHebrew?: string;
  textArabic?: string;
}

const Feature: React.FC<FeatureProps> = ({ text, textHebrew, textArabic }) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm">
        <Check className="h-4 w-4 text-brand-bordeaux flex-shrink-0" />
        <span>{text}</span>
      </div>
      {textHebrew && (
        <div className="text-sm text-right pr-6 text-gray-600 dark:text-gray-400" dir="rtl">
          {textHebrew}
        </div>
      )}
      {textArabic && (
        <div className="text-sm text-right pr-6 text-gray-600 dark:text-gray-400 font-arabic" dir="rtl">
          {textArabic}
        </div>
      )}
    </div>
  );
};

interface SubscriptionCardProps {
  title: string;
  titleHebrew?: string;
  titleArabic?: string;
  price: string;
  period: string;
  description?: string;
  descriptionHebrew?: string;
  descriptionArabic?: string;
  features: {
    english: string;
    hebrew?: string;
    arabic?: string;
  }[];
  icon: React.ReactNode;
  popular?: boolean;
  buttonText?: string;
  buttonTextHebrew?: string;
  buttonTextArabic?: string;
  color?: string;
  onClick?: () => void;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  title,
  titleHebrew,
  titleArabic,
  price,
  period,
  description,
  descriptionHebrew,
  descriptionArabic,
  features,
  icon,
  popular = false,
  buttonText = "Subscribe Now",
  buttonTextHebrew = "הירשם עכשיו",
  buttonTextArabic = "اشترك الآن",
  color = "brand-bordeaux",
  onClick,
}) => {
  return (
    <Card3D 
      intensity={8}
      glare={true}
      borderHighlight={true}
      className="h-full"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          "relative flex flex-col p-6 bg-white/80 dark:bg-brand-darkGray/80 rounded-2xl shadow-lg overflow-hidden border h-full",
          popular ? "border-brand-yellow" : "border-white/20 dark:border-white/10",
          `hover:shadow-xl hover:shadow-${color}/20 transition-all duration-300`
        )}
      >
        {popular && (
          <div className="absolute -right-12 top-6 bg-brand-yellow text-brand-darkGray px-12 py-1 transform rotate-45 text-xs font-bold">
            POPULAR
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold">{title}</h3>
            {titleHebrew && <p className="text-sm text-right text-gray-600 dark:text-gray-400" dir="rtl">{titleHebrew}</p>}
            {titleArabic && <p className="text-sm text-right text-gray-600 dark:text-gray-400 font-arabic" dir="rtl">{titleArabic}</p>}
          </div>
          <div className={`p-2 rounded-full bg-${color}/10 text-${color}`}>
            {icon}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-end">
            <span className="text-3xl font-bold">{price}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/{period}</span>
          </div>
          {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{description}</p>}
          {descriptionHebrew && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-right" dir="rtl">
              {descriptionHebrew}
            </p>
          )}
          {descriptionArabic && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-right font-arabic" dir="rtl">
              {descriptionArabic}
            </p>
          )}
        </div>

        <div className="flex-grow space-y-4 mb-6">
          {features.map((feature, index) => (
            <Feature 
              key={index} 
              text={feature.english} 
              textHebrew={feature.hebrew}
              textArabic={feature.arabic}
            />
          ))}
        </div>

        <div className="space-y-2 relative z-10 pointer-events-auto">
          <Button 
            onClick={onClick}
            className={cn(
              "w-full py-6",
              popular ? "bg-brand-yellow hover:bg-brand-yellow/90 text-brand-darkGray font-semibold" : 
              "bg-brand-bordeaux hover:bg-brand-bordeaux/90 text-white"
            )}
          >
            {buttonText}
          </Button>
          
          {(buttonTextHebrew || buttonTextArabic) && (
            <div className="flex flex-col items-center text-xs text-gray-500 dark:text-gray-400">
              {buttonTextHebrew && <span dir="rtl">{buttonTextHebrew}</span>}
              {buttonTextArabic && <span dir="rtl" className="font-arabic">{buttonTextArabic}</span>}
            </div>
          )}
        </div>
      </motion.div>
    </Card3D>
  );
};

export default SubscriptionCard;
