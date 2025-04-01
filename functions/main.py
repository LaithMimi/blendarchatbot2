from firebase_functions import https_fn
from firebase_admin import initialize_app, auth, firestore
import json
from firebase_functions import logger
from datetime import datetime, timezone, timedelta
from firebase_functions import logger, options
from firebase_functions.params import SecretParam
from datetime import datetime, timezone
import uuid
from openai import OpenAI

OPENAI_API_KEY = SecretParam("OPENAI_API_KEY")

CORS_ORIGINS = ["https://chat\.blendarabic\.com", "http://localhost:8050"]


MAX_MONTHLY_MESSAGES = 50

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

Function URL: https://on-user-purchase-jfys4ba3ka-uc.a.run.app
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
            current_month = get_current_month()
            logger.info(f"Updating subscription for user: {user_id} for month: {current_month}")
            db.collection('users').document(user_id).set({
                'premium': { 
                    current_month: True,
                 },
                'userId': user_id
            }, merge=True)
            
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


@https_fn.on_request(secrets=[OPENAI_API_KEY], cors=options.CorsOptions(cors_origins=CORS_ORIGINS, cors_methods=["get", "post"]))
def ask_user(req: https_fn.Request) -> https_fn.Response:
    try:
        logger.info("Ask user request received")

        # Parse the request body
        request_data = req.get_json()
        week = request_data.get('week', '01')
        level = request_data.get('level', 'beginner')
        gender = request_data.get('gender', 'male')
        language = request_data.get('language', 'Hebrew')
        question = request_data.get('question', '')
        if not question:
            logger.error("Question is required")
            return https_fn.Response(json.dumps({'error': 'Question is required'}), status=400)

        # Verify authentication, limit the number of messages and increase the message count
        user_id, user_email = verify_auth(req)
        if not user_id or not user_email:
            logger.error("Authentication failed")
            return https_fn.Response(json.dumps({'error': 'Authentication failed'}), status=401)
        if not can_user_ask(user_id):
            logger.error("User has reached the maximum number of messages")
            return https_fn.Response(json.dumps({'error': 'User has reached the maximum number of messages'}), status=403)
        increase_user_message_count(user_id)

        # Load conversation history and create a new message
        session = load_session(user_id, user_email, level, week, gender, language)
        conversation_history = session.get("messages", [])
        materials = get_materials(level, week)
        prompt = create_arabic_teaching_prompt(level, week, question, gender, language, materials, conversation_history)
        bot_message = call_bot(OPENAI_API_KEY.value, prompt, question)

        user_message = {
            "id": f"{user_id}_{str(uuid.uuid4())}",
            "sender": "user",
            "text": question,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "isUser": True
        }
        conversation_history.append(user_message)
        conversation_history.append(bot_message)

        session = add_messages_to_session(session, conversation_history)

        return https_fn.Response(json.dumps({
            "answer": bot_message['text'],
            "language": language,
            "direction": "rtl" if language == 'arabic' else "ltr",
            "_id": session['_id'],
            "sessionId": session['_id'],
            "chatSession": session
        }), status=200)
    except Exception as e:
        logger.error(f"Error processing ask user request", error=e)
        return https_fn.Response(json.dumps({'error': "An error occurred"}), status=500)




def add_messages_to_session(session, messages):
    conversation_history = session.get("messages", [])
    conversation_history.extend(messages)
    session['messages'] = conversation_history
    session['updatedAt'] = datetime.now(timezone.utc).isoformat()

    db = firestore.client()
    session_id = session['_id']
    db.collection('chatLogs').document(session_id).update({
        'messages': firestore.ArrayUnion(messages),
        'updatedAt': session['updatedAt']
    })

    return session


def call_bot(api_key, prompt, question):
    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": question}
        ],
        temperature=0.3,
        max_tokens=1000
    )
    bot_answer = response.choices[0].message.content
    return {
        "id": str(uuid.uuid4()),
        "sender": "bot",
        "text": bot_answer,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "isUser": False
    }


def load_session(user_id: str, user_email: str, level: str, week: str, gender: str, language: str):
    db = firestore.client()
    session_id = user_id
    user_doc = db.collection('chatLogs').document(session_id).get()
    if user_doc.exists:
        return user_doc.to_dict()
    
    userName = user_email.split('@')[0]
    session = {
        "_id": session_id,
        "userId": user_id,
        "userEmail": user_email,
        "userName": userName,
        "messages": [],
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "language": language,
        "week": week,
        "gender": gender
    }
    db.collection('chatLogs').document(session_id).set(session)
    return session


def can_user_ask(user_id: str) -> bool:
    current_month = get_current_month()
    db = firestore.client()
    user_doc = db.collection('users').document(user_id).get()
    if not user_doc.exists:
        db.collection('users').document(user_id).set({
            'totalMessages': {
                current_month: 0
            }
        })
        return True

    user_data = user_doc.to_dict()
    isPremium = user_data.get('premium', {}).get(current_month, False)
    if isPremium:
        return True

    totalMessages = user_data.get('totalMessages', {}).get(current_month, 0)
    return totalMessages < MAX_MONTHLY_MESSAGES


def increase_user_message_count(user_id: str):
    current_month = get_current_month()
    db = firestore.client()
    user_doc = db.collection('users').document(user_id).get()
    if not user_doc.exists:
        return

    user_data = user_doc.to_dict()
    total_messages = user_data.get('totalMessages', {}).get(current_month, 0)
    db.collection('users').document(user_id).set({
        'totalMessages': {
            **user_data.get('totalMessages', {}),
            current_month: total_messages + 1
        }
    }, merge=True)


def verify_auth(req: https_fn.Request) -> tuple[str, str]:
    """
    Verify the JWT token from the Authorization header and return user information.
    Returns empty strings if verification fails.
    
    Args:
        req: The HTTP request object
        
    Returns:
        tuple[str, str]: A tuple containing (user_id, user_email). Both will be empty strings if verification fails.
    """
    try:
        # Get the Authorization header
        auth_header = req.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            logger.warning("No valid Authorization header found")
            return '', ''
            
        # Extract the token
        token = auth_header.split('Bearer ')[1]
        
        # Verify the token
        decoded_token = auth.verify_id_token(token)
        
        # Extract user information
        user_id = decoded_token['uid']
        user_email = decoded_token.get('email', '')
        
        logger.info(f"Successfully verified token for user, user_id = {user_id}, user_email = {user_email}")
        return user_id, user_email
        
    except Exception as e:
        logger.error(f"Error verifying auth token: {str(e)}")
        return '', ''


def get_materials(level, week):
    try:
        # Remove the 'week' prefix if it exists
        clean_week = week.replace('week', '').zfill(2)
        lesson_key = f"{level}_week_{clean_week}"
        logger.info(f"🔍 Searching for materials with lesson key: {lesson_key}")

        # Query for documents where the ID starts with the lesson key
        db = firestore.client()
        docs = db.collection("materials").where("id", ">=", lesson_key).where("id", "<", lesson_key + "_z").stream()

        # Convert to list of dictionaries
        materials = [doc.to_dict() for doc in docs]

        logger.info(f"📚 Retrieved {len(materials)} relevant teaching materials.")

        # Log the retrieved materials for debugging
        for mat in materials:
            logger.info(f"Retrieved material: {mat['id']}")

        return materials
    except Exception as e:
        logger.error(f"❌ Error fetching materials: {e}", exc_info=True)
        return []


def create_arabic_teaching_prompt(level, week, question, gender, language, materials, conversation_history=None):
    """
    Dynamically generates an Arabic teaching prompt to feed into OpenAI
    for specialized Levantine dialect tutoring. Includes context from
    conversation history and user-provided learning materials.
    """
    base_prompt = f"""
    You are 'Laith', an expert Levantine Arabic dialect tutor. Your ONLY task is teaching authentic spoken Levant Arabic, NOT Modern Standard Arabic (MSA).

    STRICT RULES:
    1. ONLY use information from the provided reference materials. Do not introduce vocabulary, phrases or concepts not included in these materials.
    2. NEVER use MSA (فصحى) forms - use EXCLUSIVELY Levantine dialect (لهجة شامية) as spoken in daily conversation.
    3. IGNORE any questions unrelated to Levantine Arabic learning.

    Student profile:
    - Level: {level}
    - Week: {week}
    - Gender: {gender}
    - Language: {language}

    TEACHING APPROACH:
    - AUTHENTICITY: Teach how natives actually speak, not textbook forms
    - PERSONALIZATION: For beginners (level {level}, week {week}), use more {language}. For advanced, use more Arabic
    - EXAMPLES: Every vocabulary item must include realistic usage examples
    - PRONUNCIATION: Include Hebrew transliteration (תעתיק עברי) for all Arabic words
    - GENDER: Use appropriate forms for {gender} students
    - DIALOGUES: Create practice conversations using ONLY vocabulary from materials
    """
    materials_prompt = "\nYOU MUST EXCLUSIVELY USE THESE MATERIALS AS YOUR SOURCE:\n"
    for i, mat in enumerate(materials, 1):
        # Example: incorporate materials as needed
        materials_prompt += f"Material {i}: {mat}\n"

    final_warning = "\nIMPORTANT: If asked about anything not covered in these materials, redirect to content you CAN teach from the materials. ALWAYS use Levantine dialect exclusively.\n"

    # Adjust language usage
    if language == "arabic":
        language_guidance = "\nRespond primarily in Arabic script with minimal explanations in Hebrew.\n"
    elif language == "transliteration-hebrew":
        language_guidance = "\nProvide Arabic responses in Hebrew characters, plus short Hebrew explanations.\n"
    elif language == "transliteration-english":
        language_guidance = "\nProvide Arabic responses with English transliteration, plus Hebrew explanations.\n"
    else:
        language_guidance = "\nProvide main responses in Hebrew, with Arabic phrases in both script and Hebrew transliteration.\n"

    complete_prompt = base_prompt + materials_prompt + final_warning + language_guidance

    if conversation_history and len(conversation_history) > 0:
        recent_messages = conversation_history[-5:]  # only the last 5
        history_prompt = "\nPREVIOUS CONVERSATION CONTEXT:\n"
        for msg in recent_messages:
            role = "Student" if msg.get("isUser", msg.get("sender") == "user") else "You (Laith)"
            content = msg.get("text", msg.get("content", ""))
            history_prompt += f"{role}: {content}\n"
        complete_prompt += history_prompt

    return complete_prompt


@https_fn.on_request()
def get_chat_logs(req: https_fn.Request) -> https_fn.Response:
    try:
        logger.info("📋 Attempting to fetch chat logs from Firestore")
        
        # Get query parameters
        page = int(req.args.get("page", "1"))
        page_size = int(req.args.get("pageSize", "20"))
        search_term = req.args.get("searchTerm", "").lower()
        user_filter = req.args.get("userId", "").lower()
        date_from = req.args.get("dateFrom")
        date_to = req.args.get("dateTo")
        email_filter = req.args.get("userEmail", "").lower()

        # Get Firestore client
        db = firestore.client()
        
        # Get all chat logs
        chat_docs = db.collection("chatLogs").stream()
        chat_logs = [doc.to_dict() for doc in chat_docs]
        logger.info(f"✅ Successfully retrieved {len(chat_logs)} chat logs")

        # Apply filters
        if search_term:
            chat_logs = [
                c for c in chat_logs
                if search_term in c.get("userName", "").lower()
                or search_term in c.get("userId", "").lower()
                or search_term in c.get("userEmail", "").lower()
                or search_term in c.get("_id", "").lower()
            ]

        # Filter by userId
        if user_filter:
            chat_logs = [
                c for c in chat_logs 
                if user_filter in c.get("userId", "").lower()
            ]

        # Filter by userEmail
        if email_filter:
            chat_logs = [
                c for c in chat_logs
                if email_filter in c.get("userEmail", "").lower()
            ]

        # Filter by date range
        if date_from and date_to:
            try:
                from_dt = datetime.fromisoformat(date_from)
                to_dt = datetime.fromisoformat(date_to)

                def in_range(chat):
                    created = chat.get("createdAt")
                    if not created:
                        return False
                    dt = datetime.fromisoformat(created)
                    return from_dt <= dt <= to_dt

                chat_logs = [c for c in chat_logs if in_range(c)]
            except Exception as date_err:
                logger.error(f"Date parsing error: {date_err}")

        # Sort by createdAt descending
        chat_logs.sort(key=lambda x: x.get("createdAt", ""), reverse=True)

        # Pagination
        total = len(chat_logs)
        total_pages = (total + page_size - 1) // page_size
        start = (page - 1) * page_size
        end = start + page_size
        paginated_logs = chat_logs[start:end]

        return https_fn.Response(json.dumps({
            "chats": paginated_logs,
            "totalPages": total_pages
        }), status=200)

    except Exception as e:
        logger.error(f"Error retrieving chat logs: {e}", exc_info=True)
        return https_fn.Response(json.dumps({
            "error": "Failed to retrieve chat logs",
            "message": str(e)
        }), status=500)


def get_current_month():
    now = datetime.now()
    return f"{now.year}-{now.month}"

