import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

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
  meshulam?: {
    customerId?: string;
    recurringTransactionId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Meshulam API types
export interface MeshulamPaymentRequest {
  pageCode: string; // Provided by Meshulam
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  sum: number;
  description: string;
  paymentType: 'regular' | 'recurring';
  successUrl: string;
  cancelUrl: string;
  maxPayments?: number;
}

export interface MeshulamResponse {
  status: number;
  data: {
    url?: string;
    transactionId?: string;
    customerId?: string;
    recurringTransactionId?: string;
    message?: string;
  }
}

/**
 * Handles creating a new subscription payment flow with Meshulam
 */
export const createSubscriptionPayment = async (
  userId: string,
  email: string,
  plan: SubscriptionPlan,
  billingCycle: BillingCycle,
  userName?: string
): Promise<string> => {
  try {
    // Get price based on plan and cycle
    const price = getPlanPrice(plan, billingCycle);
    
    // Split the name (if provided)
    let firstName = '', lastName = '';
    if (userName) {
      const nameParts = userName.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    
    // Build payment request
    const paymentRequest: MeshulamPaymentRequest = {
      pageCode: process.env.REACT_APP_MESHULAM_PAGE_CODE || '',
      userId,
      email,
      firstName,
      lastName,
      sum: price,
      description: `BlendAr ${plan} plan (${billingCycle})`,
      paymentType: billingCycle === 'monthly' ? 'recurring' : 'regular',
      successUrl: `${window.location.origin}/subscription/success`,
      cancelUrl: `${window.location.origin}/subscription/cancel`,
      maxPayments: billingCycle === 'yearly' ? 12 : 1
    };
    
    // Send request to our backend API
    const response = await fetch('/api/subscription/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(paymentRequest)
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const result: MeshulamResponse = await response.json();
    
    if (result.status !== 1 || !result.data.url) {
      throw new Error(result.data.message || 'Failed to create payment');
    }
    
    // Create a pending subscription record in Firestore
    await createPendingSubscription(userId, plan, billingCycle);
    
    // Return the payment URL for redirection
    return result.data.url;
    
  } catch (error) {
    console.error('Subscription payment creation failed:', error);
    throw error;
  }
};

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
 * Verifies and activates a subscription after successful payment
 */
export const verifySubscriptionPayment = async (
  userId: string,
  transactionId: string
): Promise<boolean> => {
  try {
    // Verify with backend
    const response = await fetch(`/api/subscription/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ userId, transactionId })
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const verificationResult = await response.json();
    
    if (verificationResult.status === 1) {
      // Update the subscription status to active
      const subscriptionRef = doc(db, 'subscriptions', userId);
      await updateDoc(subscriptionRef, {
        status: 'active',
        transactionId,
        updatedAt: new Date().toISOString(),
        ...(verificationResult.data.customerId && {
          'meshulam.customerId': verificationResult.data.customerId
        }),
        ...(verificationResult.data.recurringTransactionId && {
          'meshulam.recurringTransactionId': verificationResult.data.recurringTransactionId
        })
      });
      
      // Also update user's isPremium flag
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isPremium: true,
        updatedAt: new Date().toISOString()
      });
      
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('Payment verification failed:', error);
    return false;
  }
};

/**
 * Cancels an active subscription
 */
export const cancelSubscription = async (userId: string): Promise<boolean> => {
  try {
    // Get current subscription
    const subscriptionRef = doc(db, 'subscriptions', userId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (!subscriptionDoc.exists()) {
      throw new Error('No subscription found');
    }
    
    const subscription = subscriptionDoc.data() as SubscriptionData;
    
    // Call backend to cancel recurring payment if applicable
    if (subscription.meshulam?.recurringTransactionId) {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          userId,
          recurringTransactionId: subscription.meshulam.recurringTransactionId
        })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
    }
    
    // Update subscription status in Firestore
    await updateDoc(subscriptionRef, {
      status: 'cancelled',
      autoRenew: false,
      updatedAt: new Date().toISOString()
    });
    
    return true;
    
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
    
    // Call backend to update subscription
    const response = await fetch('/api/subscription/change-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        userId,
        currentPlan: subscription.plan,
        currentBillingCycle: subscription.billingCycle,
        newPlan,
        newBillingCycle,
        recurringTransactionId: subscription.meshulam?.recurringTransactionId
      })
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.status === 1) {
      // Update subscription in Firestore
      const subscriptionRef = doc(db, 'subscriptions', userId);
      await updateDoc(subscriptionRef, {
        plan: newPlan,
        billingCycle: newBillingCycle,
        updatedAt: new Date().toISOString(),
        ...(result.data.newEndDate && { endDate: result.data.newEndDate }),
        ...(result.data.recurringTransactionId && {
          'meshulam.recurringTransactionId': result.data.recurringTransactionId
        })
      });
      
      return true;
    }
    
    return false;
    
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
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      return false;
    }
    
    // Check if subscription is active and not expired
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    
    return (
      (subscription.status === 'active' || subscription.status === 'trial') && 
      endDate > now
    );
    
  } catch (error) {
    console.error('Failed to check subscription status:', error);
    return false;
  }
};