from firebase_functions import https_fn
from firebase_admin import initialize_app, auth, firestore
import json
from firebase_functions import logger
from datetime import datetime, timezone, timedelta


initialize_app()
"""
Payment URL: https://meshulam.co.il/purchase?b=511448e20886c18a4bab323430775fb8
Meshulam documentation: https://grow-il.readme.io/docs/overview-7

Example of a payment webhook from Meshulam:
{
    "webhookKey":"ABC1234",
    "transactionCode":"ABCD1234",
    "transactionType":"אשראי", 
    "paymentSum":8,
    "paymentsNum":0,
    "allPaymentNum":1,
    "firstPaymentSum":0,
    "periodicalPaymentSum":0,
    "paymentType":"הוראת קבע",
    "paymentDate":"14/10/21",
    "asmachta":"123456789",
    "paymentDesc":"שם העמוד",
    "fullName":"Full Name",
    "payerPhone":"0500000000",
    "payerEmail":"test@test.com",
    "cardSuffix":"1234",
    "cardBrand":"Mastercard",
    "cardType":"Local",
    "paymentSource":"עמוד מכירה",
    "purchasePageKey":"ABCD1234",
    "purchasePageTitle":"עמוד תבנית תשלום מהיר",
    "amount":1,
    "purchaseCustomField":{"field1":"נתון1","field2":"נתון2","field3":"נתון3"}
}

Example of a recurring payment webhook from Meshulam:
{ 
  "webhookKey":"ABC1234", 
  "transactionCode":"ABCD1234", 
  "transactionType":"אשראי",  
  "paymentSum":8, 
  "paymentsNum":0, 
  "allPaymentNum":1, 
  "firstPaymentSum":0, 
  "periodicalPaymentSum":0, 
  "paymentType":"הוראת קבע", 
  "paymentDate":"14/10/21",
  "asmachta":"123456789", 
  "paymentDesc":"תיאור עסקה",
  "fullName":"Full Name", 
  "payerPhone":"0500000000", 
  "payerEmail":"test@test.com", 
	"cardSuffix":"1234", 
	"cardBrand":"Mastercard", 
	"cardType":"Local", 
	"paymentSource":"ריצת הוראת קבע", 
	"directDebitId":"123456" (קוד הוראת קבע ולא קוד עסקה) 
}
* If recurring payment failed, the payload will contain: error_message
"""

@https_fn.on_request()
def on_user_purchase(req: https_fn.Request) -> https_fn.Response:
    try:
        logger.info("Payment webhook received")
        
        # Parse the request body
        request_data = req.get_json()
        transaction_code = request_data.get('transactionCode', 'unknown')
        logger.info(f"Processing transaction: {transaction_code}", request_data=request_data)
        
        # Extract payer email from request
        payer_email = request_data.get('payerEmail')
        if not payer_email:
            logger.error("Payment webhook missing payer email")
            return https_fn.Response(json.dumps({'error': 'No payer email provided'}), status=400)
        
        logger.info(f"Processing payment for email: {payer_email}")
        
        # Get Firestore client
        db = firestore.client()
        
        # Try to find user by email
        user_id = None
        try:
            logger.info(f"Looking up user by email: {payer_email}")
            user = auth.get_user_by_email(payer_email)
            user_id = user.uid
            logger.info(f"Existing user found with ID: {user_id}")
        except auth.UserNotFoundError:
            # Create a new user if not found
            logger.info(f"User not found for email: {payer_email}, creating new user")
            username = payer_email.split('@')[0]  # Username is email without the @
            user_record = auth.create_user(
                email=payer_email,
                display_name=username
            )
            user_id = user_record.uid
            logger.info(f"New user created with ID: {user_id}")
        
        # Get payment details
        payment_sum = request_data.get('paymentSum', 0)
        payment_type = request_data.get('paymentType', '')
        payment_description = request_data.get('paymentDesc', '')
        
        # Determine billing cycle based on payment amount or description
        is_yearly = False
        if 'yearly' in payment_description.lower():
            is_yearly = True
        elif payment_sum >= 288:  # If payment is equal to or greater than yearly price
            is_yearly = True
            
        # Calculate subscription end date
        now = datetime.now(timezone.utc)
        if is_yearly:
            end_date = now + timedelta(days=365)
        else:
            end_date = now + timedelta(days=30)
        
        # Store transaction details
        transaction_data = {
            "userId": user_id,
            "userEmail": payer_email,
            "transactionId": transaction_code,
            "status": "completed",
            "amount": payment_sum,
            "plan": "premium",
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat()
        }
        
        db.collection("payments").document(transaction_code).set(transaction_data)
        logger.info(f"Payment record created for transaction: {transaction_code}")
        
        # Update user document
        db.collection('users').document(user_id).set({
            'isPremium': True,
            'userId': user_id,
            'email': payer_email,
            'subscriptionStatus': 'active',
            'subscriptionEndDate': end_date.isoformat(),
            'updatedAt': now.isoformat()
        }, merge=True)
        
        # Create or update subscription record
        subscription_data = {
            "userId": user_id,
            "userEmail": payer_email,
            "plan": "premium",
            "billingCycle": "yearly" if is_yearly else "monthly",
            "status": "active",
            "startDate": now.isoformat(),
            "endDate": end_date.isoformat(),
            "autoRenew": True,
            "transactionId": transaction_code,
            "paymentMethod": "external",
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat()
        }
        
        db.collection("subscriptions").document(user_id).set(subscription_data, merge=True)
        logger.info(f"Subscription updated successfully for user: {user_id}")
        
        return https_fn.Response(json.dumps({
            'success': True,
            'userId': user_id
        }), status=200)
            
    except Exception as e:
        logger.error(f"Error processing payment webhook: {str(e)}")
        return https_fn.Response(json.dumps({'error': str(e)}), status=500)


@https_fn.on_request(cors=True)
def verify_subscription(req: https_fn.Request) -> https_fn.Response:
    """Verify if a user has an active subscription"""
    try:
        # Check request method
        if req.method != 'POST':
            return https_fn.Response(json.dumps({'error': 'Method not allowed'}), status=405)
        
        # Get user ID from request
        request_data = req.get_json()
        user_id = request_data.get('userId')
        
        if not user_id:
            return https_fn.Response(json.dumps({'error': 'No user ID provided'}), status=400)
        
        # Get Firestore client
        db = firestore.client()
        
        # Get user document
        user_doc = db.collection('users').document(user_id).get()
        if not user_doc.exists:
            return https_fn.Response(json.dumps({'isPremium': False}), status=200)
        
        user_data = user_doc.to_dict()
        is_premium = user_data.get('isPremium', False)
        
        # If user is marked as premium, verify with subscription document
        if is_premium:
            subscription_doc = db.collection('subscriptions').document(user_id).get()
            
            if subscription_doc.exists:
                subscription_data = subscription_doc.to_dict()
                
                # Check if subscription is active and not expired
                status = subscription_data.get('status')
                if status not in ['active', 'trial']:
                    is_premium = False
                else:
                    # Check expiration date
                    end_date_str = subscription_data.get('endDate')
                    if end_date_str:
                        end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
                        if end_date <= datetime.now(timezone.utc):
                            # Subscription expired, update status
                            db.collection('subscriptions').document(user_id).update({
                                'status': 'expired',
                                'updatedAt': datetime.now(timezone.utc).isoformat()
                            })
                            
                            db.collection('users').document(user_id).update({
                                'isPremium': False,
                                'updatedAt': datetime.now(timezone.utc).isoformat()
                            })
                            
                            is_premium = False
            else:
                # No subscription record, update user document
                db.collection('users').document(user_id).update({
                    'isPremium': False,
                    'updatedAt': datetime.now(timezone.utc).isoformat()
                })
                
                is_premium = False
        
        return https_fn.Response(json.dumps({'isPremium': is_premium}), status=200)
    
    except Exception as e:
        logger.error(f"Error verifying subscription: {str(e)}")
        return https_fn.Response(json.dumps({'error': str(e)}), status=500)


@https_fn.on_request(cors=True)
def cancel_subscription(req: https_fn.Request) -> https_fn.Response:
    """Cancel a user's subscription"""
    try:
        # Check request method
        if req.method != 'POST':
            return https_fn.Response(json.dumps({'error': 'Method not allowed'}), status=405)
        
        # Get user ID from request
        request_data = req.get_json()
        user_id = request_data.get('userId')
        
        if not user_id:
            return https_fn.Response(json.dumps({'error': 'No user ID provided'}), status=400)
        
        # Get Firestore client
        db = firestore.client()
        
        # Update user document
        db.collection('users').document(user_id).update({
            'isPremium': False,
            'subscriptionStatus': 'cancelled',
            'updatedAt': datetime.now(timezone.utc).isoformat()
        })
        
        # Update subscription document
        subscription_ref = db.collection('subscriptions').document(user_id)
        subscription_doc = subscription_ref.get()
        
        if subscription_doc.exists:
            subscription_ref.update({
                'status': 'cancelled',
                'autoRenew': False,
                'updatedAt': datetime.now(timezone.utc).isoformat()
            })
        
        return https_fn.Response(json.dumps({'success': True}), status=200)
    
    except Exception as e:
        logger.error(f"Error cancelling subscription: {str(e)}")
        return https_fn.Response(json.dumps({'error': str(e)}), status=500)


@https_fn.on_request(cors=True)
def change_subscription_plan(req: https_fn.Request) -> https_fn.Response:
    """Change a user's subscription plan"""
    try:
        # Check request method
        if req.method != 'POST':
            return https_fn.Response(json.dumps({'error': 'Method not allowed'}), status=405)
        
        # Get user ID and plan details from request
        request_data = req.get_json()
        user_id = request_data.get('userId')
        new_plan = request_data.get('newPlan')
        new_billing_cycle = request_data.get('newBillingCycle')
        
        if not user_id or not new_plan or not new_billing_cycle:
            return https_fn.Response(json.dumps({'error': 'Missing required parameters'}), status=400)
        
        # Get Firestore client
        db = firestore.client()
        
        # If downgrading to free plan
        if new_plan == 'basic':
            # Update user document
            db.collection('users').document(user_id).update({
                'isPremium': False,
                'subscriptionStatus': 'cancelled',
                'updatedAt': datetime.now(timezone.utc).isoformat()
            })
            
            # Update subscription document
            db.collection('subscriptions').document(user_id).update({
                'plan': 'basic',
                'status': 'cancelled',
                'billingCycle': new_billing_cycle,
                'autoRenew': False,
                'updatedAt': datetime.now(timezone.utc).isoformat()
            })
            
            return https_fn.Response(json.dumps({
                'success': True,
                'message': 'Plan downgraded to basic'
            }), status=200)
        
        # For plan upgrades or cycle changes
        now = datetime.now(timezone.utc)
        if new_billing_cycle == 'yearly':
            end_date = now + timedelta(days=365)
        else:
            end_date = now + timedelta(days=30)
        
        # Update subscription
        db.collection('subscriptions').document(user_id).update({
            'plan': new_plan,
            'billingCycle': new_billing_cycle,
            'status': 'active',
            'endDate': end_date.isoformat(),
            'autoRenew': True,
            'updatedAt': now.isoformat()
        })
        
        # Update user document
        db.collection('users').document(user_id).update({
            'isPremium': True,
            'subscriptionStatus': 'active',
            'subscriptionEndDate': end_date.isoformat(),
            'updatedAt': now.isoformat()
        })
        
        return https_fn.Response(json.dumps({
            'success': True,
            'message': 'Plan changed successfully',
            'data': {
                'newEndDate': end_date.isoformat()
            }
        }), status=200)
    
    except Exception as e:
        logger.error(f"Error changing subscription plan: {str(e)}")
        return https_fn.Response(json.dumps({'error': str(e)}), status=500)