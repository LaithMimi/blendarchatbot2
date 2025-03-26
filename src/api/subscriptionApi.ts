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
    const subscriptionRef = doc(db, 'subscriptions', userId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (!subscriptionDoc.exists()) {
      return null;
    }
    
    return subscriptionDoc.data() as SubscriptionData;
    
  } catch (error) {
    console.error('Failed to get subscription:', error);
    return null;
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
  return await verifySubscriptionStatus(userId);
};