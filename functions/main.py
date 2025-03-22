from firebase_functions import https_fn
from firebase_admin import initialize_app, auth, firestore
import json
from firebase_functions import logger


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
        
        # Update user's subscription in Firestore
        if user_id:
            logger.info(f"Updating subscription for user: {user_id}")
            db.collection('users').document(user_id).set({
                'isPremium': True,
                'userId': user_id
            }, merge=True)
            
            logger.info(f"Subscription updated successfully for user: {user_id}")
            return https_fn.Response(json.dumps({
                'success': True,
                'userId': user_id
            }), status=200)
        else:
            logger.error("Failed to process user: No user ID available")
            return https_fn.Response(json.dumps({'error': 'Failed to process user'}), status=500)
            
    except Exception as e:
        logger.error(f"Error processing payment webhook: {str(e)}")
        return https_fn.Response(json.dumps({'error': str(e)}), status=500)
