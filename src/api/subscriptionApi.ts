import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Subscription types
export type SubscriptionPlan = 'basic' | 'premium';
export type BillingCycle = 'monthly' | 'yearly';

export interface SubscriptionData {
  userId: string;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a pending subscription in Firestore
 */
const createPendingSubscription = async (
  userId: string, 
  plan: SubscriptionPlan,
  billingCycle: BillingCycle
): Promise<void> => {
  try {
    const now = new Date();
    const thirtyDaysLater = new Date(now);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    
    const yearLater = new Date(now);
    yearLater.setFullYear(yearLater.getFullYear() + 1);
    
    // End date based on billing cycle
    const endDate = billingCycle === 'monthly' ? 
      thirtyDaysLater.toISOString() : 
      yearLater.toISOString();
    
    const subscription: SubscriptionData = {
      userId,
      plan,
      billingCycle,
      status: 'trial', // Will be updated when payment is confirmed
      startDate: now.toISOString(),
      endDate,
      autoRenew: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    
    // Store in Firestore
    const subscriptionRef = doc(db, 'subscriptions', userId);
    await setDoc(subscriptionRef, subscription);
    
  } catch (error) {
    console.error('Failed to create pending subscription:', error);
    throw error;
  }
};

/**
 * Verifies subscription status
 */
export const verifySubscriptionStatus = async (userId: string): Promise<boolean> => {
  try {
    // Call the Cloud Function
    const functions = getFunctions();
    const verifySubscriptionFn = httpsCallable(functions, 'verify_subscription');
    const result = await verifySubscriptionFn({ userId });
    
    // @ts-ignore - The result data structure
    return result.data.isPremium === true;
  } catch (error) {
    console.error('Failed to verify subscription status:', error);
    return false;
  }
};

/**
 * Cancels an active subscription
 */
export const cancelSubscription = async (userId: string): Promise<boolean> => {
  try {
    // Call the Cloud Function
    const functions = getFunctions();
    const cancelSubscriptionFn = httpsCallable(functions, 'cancel_subscription');
    const result = await cancelSubscriptionFn({ userId });
    
    // Update local state if needed
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isPremium: false,
      updatedAt: new Date().toISOString()
    });
    
    // @ts-ignore - The result data structure
    return result.data.success === true;
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    return false;
  }
};

/**
 * Get current subscription for a user
 */
export const getUserSubscription = async (userId: string): Promise<SubscriptionData | null> => {
  try {
    // First, check if userId is an email, and if so, encode it properly
    if (userId.includes('@')) {
      userId = encodeEmail(userId);
    }
    
    const subscriptionRef = doc(db, 'subscriptions', userId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (!subscriptionDoc.exists()) {
      console.log("No subscription found for user:", userId);
      return null;
    }
    
    return subscriptionDoc.data() as SubscriptionData;
    
  } catch (error) {
    console.error('Failed to get subscription:', error);
    
    // If there's a permission error, try to get subscription through the API
    try {
      const response = await fetch('/api/subscription/info', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.subscription) {
          return data.subscription as SubscriptionData;
        }
      }
    } catch (apiError) {
      console.error('Failed to get subscription via API:', apiError);
    }
    
    return null;
  }
};
// Add a helper function to encode email properly for Firestore IDs
export const encodeEmail = (email: string): string => {
  try {
    return btoa(email)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (e) {
    console.error("Encoding error:", e);
    return email;
  }
};
/**
 * Upgrade or downgrade a subscription
 */
export const changeSubscriptionPlan = async (
  userId: string,
  newPlan: SubscriptionPlan,
  newBillingCycle: BillingCycle
): Promise<boolean> => {
  try {
    // Get current subscription
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      throw new Error('No subscription found');
    }
    
    // If already on the requested plan and cycle, no need to change
    if (subscription.plan === newPlan && subscription.billingCycle === newBillingCycle) {
      return true;
    }
    
    // Call the Cloud Function
    const functions = getFunctions();
    const changeSubscriptionPlanFn = httpsCallable(functions, 'change_subscription_plan');
    const result = await changeSubscriptionPlanFn({
      userId,
      currentPlan: subscription.plan,
      currentBillingCycle: subscription.billingCycle,
      newPlan,
      newBillingCycle
    });
    
    // @ts-ignore - The result data structure
    return result.data.success === true;
    
  } catch (error) {
    console.error('Failed to change subscription plan:', error);
    return false;
  }
};

/**
 * Get pricing for subscription plans
 */
export const getPlanPrice = (plan: SubscriptionPlan, billingCycle: BillingCycle): number => {
  const prices = {
    basic: {
      monthly: 0,
      yearly: 0
    },
    premium: {
      monthly: 30,
      yearly: 288 // 20% discount for annual
    }
  };
  
  return prices[plan][billingCycle];
};

/**
 * Check if user has an active subscription
 */
export const hasActiveSubscription = async (userId: string): Promise<boolean> => {
  try {
    // First try direct verification through the subscription status API endpoint
    const functions = getFunctions();
    const verifySubscriptionFn = httpsCallable(functions, 'verify_subscription');
    const result = await verifySubscriptionFn({ userId });
    
    // @ts-ignore - The result data structure
    return result.data.isPremium === true;
  } catch (error) {
    console.error('Error calling verify_subscription function:', error);
    
    // Fallback: try to get the subscription directly
    try {
      const subscription = await getUserSubscription(userId);
      if (!subscription) return false;
      
      const isActive = subscription.status === 'active' || subscription.status === 'trial';
      if (!isActive) return false;
      
      // Check if subscription is expired
      const endDate = new Date(subscription.endDate);
      const now = new Date();
      return endDate > now;
    } catch (subError) {
      console.error('Error in fallback subscription check:', subError);
      return false;
    }
  }
};