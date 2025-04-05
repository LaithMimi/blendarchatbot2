# pylint: disable=line-too-long
from firebase_functions import https_fn
from firebase_admin import initialize_app, auth, firestore
import json
from firebase_functions import logger
from datetime import datetime, timezone, timedelta
from firebase_functions import logger, options
from firebase_functions.params import SecretParam
import uuid
from openai import OpenAI
from dotenv import load_dotenv
from google.cloud.firestore_v1.base_query import FieldFilter


OPENAI_API_KEY = SecretParam("OPENAI_API_KEY")
# CORS_ORIGINS = ["https://chat\.blendarabic\.com", "http://localhost:8050"]
CORS_ORIGINS = ["https://chat.blendarabic.com", "http://localhost:8050"]
MAX_MONTHLY_MESSAGES = 50
load_dotenv()

DEFAULT_WEEK = "01"
DEFAULT_LEVEL = "beginner"
DEFAULT_GENDER = "male"
DEFAULT_LANGUAGE = "Hebrew"
# Constants

HTTP_STATUS = {
    "OK": 200,
    "BAD_REQUEST": 400,
    "UNAUTHORIZED": 401,
    "FORBIDDEN": 403,
    "NOT_FOUND": 404,
    "SERVER_ERROR": 500
}

# Global variables
_firestore_client = None

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


# Utility functions
def get_utc_timestamp():
    """Generate a consistent UTC timestamp in ISO format"""
    return datetime.now(timezone.utc).isoformat()

def get_firestore_client():
    """Get or create a Firestore client instance (singleton pattern)"""
    global _firestore_client
    if _firestore_client is None:
        _firestore_client = firestore.client()
    return _firestore_client

def get_current_month():
    now = datetime.now()
    return f"{now.year}-{now.month}"

def get_text_direction(language: str) -> str:
    """Determine text direction based on language."""
    rtl_languages = ['arabic', 'hebrew', 'urdu', 'farsi', 'persian']
    return "rtl" if language.lower() in rtl_languages else "ltr"

def validate_request(req_data, required_fields):
    """Validate that request contains all required fields."""
    missing_fields = [field for field in required_fields if field not in req_data]
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"
    return True, ""

def verify_auth(req: https_fn.Request) -> tuple[bool, str, str]:
    """
    Verify the JWT token from the Authorization header and return user
    information along with authentication status.
    
    Args:
        req: The HTTP request object
        
    Returns:
        tuple[bool, str, str]: A tuple containing (is_authenticated, user_id, user_email)
    """
    try:
        # Get the Authorization header
        auth_header = req.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            logger.info("No valid Authorization header found")
            return False, '', ''
            
        # Extract the token
        token = auth_header.split('Bearer ')[1]
        
        # Verify the token
        decoded_token = auth.verify_id_token(token)
        
        # Extract user information
        user_id = decoded_token['uid']
        user_email = decoded_token.get('email', '')
        
        logger.info(f"Successfully verified token for user, user_id = {user_id}, user_email = {user_email}")
        return True, user_id, user_email
        
    except Exception as e:
        logger.error(f"Error verifying auth token: {str(e)}")
        return False, '', ''



def get_materials(level, week):
    try:
        # Remove the 'week' prefix if it exists
        clean_week = week.replace('week', '').zfill(2)
        logger.info(f"Clean week: {clean_week}")
        lesson_key = f"{level}_week_{clean_week}"
        logger.info(f"Lesson key: {lesson_key}")
        logger.info(f"Searching for materials with lesson key: {lesson_key}")

        # Query for documents where the ID starts with the lesson key
        db = get_firestore_client()
        docs = db.collection("materials").stream()
        for doc in docs:
            data = doc.to_dict()
            logger.info(f"RAW ID FIELD: {data.get('id')} | DOC ID: {doc.id}")

        docs = db.collection("materials") \
            .where(filter=FieldFilter("id", ">=", lesson_key)) \
            .where(filter=FieldFilter("id", "<", lesson_key + "_z")) \
            .stream()


        # Convert to list of dictionaries
        materials = [doc.to_dict() for doc in docs]
        for mat in materials:
            logger.info(f"✅ Material found: {mat.get('id')}")

        logger.info(f"Retrieved {len(materials)} relevant teaching materials.")

        # Log the retrieved materials for debugging
        for mat in materials:
            logger.info(f"Retrieved material: {mat['id']}")

        return materials
    except Exception as e:
        logger.error(f"Error fetching materials: {str(e)}", exc_info=True)
        return []


def create_arabic_teaching_prompt(level, week, question, gender, language, materials, conversation_history=None):
    """
    Dynamically generates an Arabic teaching prompt for OpenAI
    for specialized Levantine dialect tutoring.
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
        materials_prompt += f"Material {i}: {mat}\n"

    final_warning = "\nIMPORTANT: If asked about anything not covered in these materials, redirect to content you CAN teach from the materials. ALWAYS use Levantine dialect exclusively.\n"

    # Adjust language usage
    language_guidance_map = {
        "arabic": "\nRespond primarily in Arabic script with minimal explanations in Hebrew.\n",
        "transliteration-hebrew": "\nProvide Arabic responses in Hebrew characters, plus short Hebrew explanations.\n",
        "transliteration-english": "\nProvide Arabic responses with English transliteration, plus Hebrew explanations.\n"
    }
    language_guidance = language_guidance_map.get(
        language, 
        "\nProvide main responses in Hebrew, with Arabic phrases in both script and Hebrew transliteration.\n"
    )

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


def call_bot(api_key, prompt, question):
    """Call OpenAI API with improved error handling."""
    if not api_key:
        logger.error("Missing OpenAI API key")
        raise ValueError("OpenAI API key is required")
        
    try:
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
            "timestamp": get_utc_timestamp(),
            "isUser": False
        }
    except Exception as e:
        logger.error(f"Error calling OpenAI: {str(e)}", exc_info=True)
        raise RuntimeError(f"Failed to generate bot response: {str(e)}")


def load_session(user_id: str, user_email: str, level: str, week: str, gender: str, language: str):
    db = get_firestore_client()
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
        "createdAt": get_utc_timestamp(),
        "updatedAt": get_utc_timestamp(),
        "level": level,
        "language": language,
        "week": week,
        "gender": gender
    }
    db.collection('chatLogs').document(session_id).set(session)
    return session


def add_messages_to_session(session, messages):
    session['messages'] = session.get("messages", []) + messages
    session['updatedAt'] = get_utc_timestamp()

    db = get_firestore_client()
    session_id = session['_id']
    db.collection('chatLogs').document(session_id).update({
        'messages': firestore.ArrayUnion(messages),
        'updatedAt': session['updatedAt']
    })

    return session


def increase_user_message_count(user_id: str):
    current_month = get_current_month()
    db = get_firestore_client()
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


# Chat logs handler functions
def handle_get_all_chatlogs(req: https_fn.Request) -> https_fn.Response:
    """
    Handles GET requests for chat logs with filtering and pagination
    """
    logger.info("Fetching chat logs with query params")
    page = int(req.args.get("page", "1"))
    page_size = int(req.args.get("pageSize", "20"))
    search_term = req.args.get("searchTerm", "").lower()
    user_filter = req.args.get("userId", "").lower()
    date_from = req.args.get("dateFrom")
    date_to = req.args.get("dateTo")
    email_filter = req.args.get("userEmail", "").lower()

    # Get Firestore client
    db = get_firestore_client()
    
    # Start with base query
    query = db.collection("chatLogs")
    
    # Apply database-level filters for better performance
    if user_filter:
        query = query.where("userId", "==", user_filter)
    if email_filter:
        query = query.where("userEmail", "==", email_filter)
        
    # Date filtering
    if date_from and date_to:
        try:
            from_dt = datetime.fromisoformat(date_from)
            to_dt = datetime.fromisoformat(date_to)
            query = query.where("createdAt", ">=", from_dt.isoformat()).where("createdAt", "<=", to_dt.isoformat())
        except Exception as date_err:
            logger.error(f"Date parsing error: {date_err}")
    
    # Sort by creation date
    query = query.order_by("createdAt", direction=firestore.Query.DESCENDING)
    
    # Only load all docs if text search is needed
    if search_term:
        # Full text search requires in-memory filtering
        chat_logs = [doc.to_dict() for doc in query.stream()]
        # Filter in memory
        chat_logs = [
            c for c in chat_logs
            if search_term in c.get("userName", "").lower()
            or search_term in c.get("userId", "").lower()
            or search_term in c.get("userEmail", "").lower()
            or search_term in c.get("_id", "").lower()
        ]
        # Manual pagination
        total = len(chat_logs)
        start = (page - 1) * page_size
        end = start + page_size
        paginated_logs = chat_logs[start:end]
    else:
        # Get all documents for counting (could be optimized with a count function)
        all_docs = [doc.id for doc in query.stream()]
        total = len(all_docs)
        # Get paginated results
        paginated_logs = [doc.to_dict() for doc in query.limit(page_size).offset((page - 1) * page_size).stream()]

    total_pages = (total + page_size - 1) // page_size

    return https_fn.Response(json.dumps({
        "chats": paginated_logs,
        "totalPages": total_pages
    }), status=HTTP_STATUS["OK"])


def handle_get_single_chat(session_id: str) -> https_fn.Response:
    """GET /api/chatlogs/<sessionId>"""
    db = get_firestore_client()
    doc_ref = db.collection("chatLogs").document(session_id)
    doc = doc_ref.get()
    if not doc.exists:
        return https_fn.Response(json.dumps({"error": "Chat session not found"}), status=HTTP_STATUS["NOT_FOUND"])
    return https_fn.Response(json.dumps(doc.to_dict()), status=HTTP_STATUS["OK"])


def handle_delete_all_chatlogs() -> https_fn.Response:
    """DELETE /api/chatlogs"""
    try:
        db = get_firestore_client()
        docs = db.collection("chatLogs").stream()
        batch = db.batch()
        delete_count = 0
        
        for d in docs:
            batch.delete(d.reference)
            delete_count += 1
            # Firestore has a limit of 500 operations per batch
            if delete_count >= 450:
                batch.commit()
                batch = db.batch()
                delete_count = 0
                
        # Commit any remaining operations
        if delete_count > 0:
            batch.commit()
            
        logger.info("All chat logs deleted successfully")
        return https_fn.Response(json.dumps({"success": True}), status=HTTP_STATUS["OK"])
    except Exception as e:
        logger.error(f"Error deleting all chat logs: {str(e)}", exc_info=True)
        return https_fn.Response(json.dumps({"error": str(e)}), status=HTTP_STATUS["SERVER_ERROR"])


def handle_delete_single_chat(session_id: str) -> https_fn.Response:
    """DELETE /api/chatlogs/<sessionId>"""
    db = get_firestore_client()
    doc_ref = db.collection("chatLogs").document(session_id)
    doc = doc_ref.get()
    if not doc.exists:
        return https_fn.Response(json.dumps({"error": "Session not found"}), status=HTTP_STATUS["NOT_FOUND"])
    doc_ref.delete()
    logger.info(f"Chat session {session_id} deleted successfully")
    return https_fn.Response(json.dumps({"success": True}), status=HTTP_STATUS["OK"])


# Main endpoint functions
@https_fn.on_request()
def on_user_purchase(req: https_fn.Request) -> https_fn.Response:
    try:
        logger.info("Payment webhook received")
        
        # Parse the request body
        if not req.is_json:
            logger.error("Payment webhook received non-JSON data")
            return https_fn.Response(json.dumps({'error': 'Invalid request format, JSON expected'}), status=HTTP_STATUS["BAD_REQUEST"])
            
        request_data = req.get_json()
        
        # Validate required fields
        required_fields = ['transactionCode', 'payerEmail', 'paymentSum']
        is_valid, error_msg = validate_request(request_data, required_fields)
        if not is_valid:
            logger.error(f"Payment webhook missing required fields: {error_msg}")
            return https_fn.Response(json.dumps({'error': error_msg}), status=HTTP_STATUS["BAD_REQUEST"])
        
        transaction_code = request_data.get('transactionCode')
        payment_sum = request_data.get('paymentSum', 0)
        payment_type = request_data.get('paymentType', '')
        is_yearly = payment_type == 'yearly' or payment_sum >= 100  # Assume yearly if high amount
        
        logger.info(f"Processing transaction: {transaction_code}")
        
        # Extract payer email from request
        payer_email = request_data.get('payerEmail')
        
        logger.info(f"Processing payment for email: {payer_email}")
        
        # Get Firestore client
        db = get_firestore_client()
        
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
        end_date = now + timedelta(days=365 if is_yearly else 30)
        
        # Store transaction details
        transaction_data = {
            "userId": user_id,
            "userEmail": payer_email,
            "transactionId": transaction_code,
            "status": "completed",
            "amount": payment_sum,
            "plan": "premium",
            "createdAt": get_utc_timestamp(),
            "updatedAt": get_utc_timestamp()
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
            'updatedAt': get_utc_timestamp()
        }, merge=True)
        
        # Create or update subscription record
        subscription_data = {
            "userId": user_id,
            "userEmail": payer_email,
            "plan": "premium",
            "billingCycle": "yearly" if is_yearly else "monthly",
            "status": "active",
            "startDate": get_utc_timestamp(),
            "endDate": end_date.isoformat(),
            "autoRenew": True,
            "transactionId": transaction_code,
            "paymentMethod": "external",
            "createdAt": get_utc_timestamp(),
            "updatedAt": get_utc_timestamp()
        }
        
        db.collection("subscriptions").document(user_id).set(subscription_data, merge=True)
        logger.info(f"Subscription updated successfully for user: {user_id}")
        
        return https_fn.Response(json.dumps({
            'success': True,
            'userId': user_id
        }), status=HTTP_STATUS["OK"])
            
    except Exception as e:
        logger.error(f"Error processing payment webhook: {str(e)}", exc_info=True)
        return https_fn.Response(json.dumps({'error': str(e)}), status=HTTP_STATUS["SERVER_ERROR"])


@https_fn.on_request(secrets=[OPENAI_API_KEY], cors=options.CorsOptions(cors_origins=CORS_ORIGINS, cors_methods=["get", "post"]))
def ask_user(req: https_fn.Request) -> https_fn.Response:
    try:
        logger.info("Ask user request received")
        # Handle health check request separately
        if req.path == "/__/health" and req.method == "GET":
            return https_fn.Response(json.dumps({"status": "ok"}), status=HTTP_STATUS["OK"])

        # Only try to parse JSON for non-health check requests
        if req.is_json:
            request_data = req.get_json()
        else:
            # For non-JSON requests, create an empty dict
            request_data = {}

        # Parse the request body
        week = request_data.get('week', DEFAULT_WEEK)
        level = request_data.get('level', DEFAULT_LEVEL)
        gender = request_data.get('gender', DEFAULT_GENDER)
        language = request_data.get('language', DEFAULT_LANGUAGE)
        question = request_data.get('question', '')
        if not question:
            logger.error("Question is required")
            return https_fn.Response(json.dumps({'error': 'Question is required'}), status=HTTP_STATUS["BAD_REQUEST"])

        # Verify authentication
        is_authenticated, user_id, user_email = verify_auth(req)
        if not is_authenticated:
            logger.error("Authentication failed")
            return https_fn.Response(json.dumps({'error': 'Authentication failed'}), status=HTTP_STATUS["UNAUTHORIZED"])
        
        # Check if user can ask questions
        current_month = get_current_month()
        db = get_firestore_client()
        user_doc = db.collection('users').document(user_id).get()
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            isPremium = user_data.get('premium', {}).get(current_month, False)
            
            # If not premium, check message count
            if not isPremium:
                totalMessages = user_data.get('totalMessages', {}).get(current_month, 0)
                
                # If at exact limit, send a warning with the response
                if totalMessages == MAX_MONTHLY_MESSAGES - 1:
                    # This is their last message, warn them
                    limitWarning = True
                    remainingMessages = 1
                # If over limit, return limit reached response
                elif totalMessages >= MAX_MONTHLY_MESSAGES:
                    logger.info(f"User {user_id} has reached message limit: {totalMessages}/{MAX_MONTHLY_MESSAGES}")
                    return https_fn.Response(json.dumps({
                        'error': 'Message limit reached',
                        'maxLimitReached': True,
                        'subscriptionUrl': '/subscription',
                        'currentCount': totalMessages,
                        'maxLimit': MAX_MONTHLY_MESSAGES
                    }), status=HTTP_STATUS["FORBIDDEN"])
                # If approaching limit (80% or more), add warning flag
                elif totalMessages >= int(MAX_MONTHLY_MESSAGES * 0.8):
                    limitWarning = True
                    remainingMessages = MAX_MONTHLY_MESSAGES - totalMessages
                else:
                    limitWarning = False
                    remainingMessages = MAX_MONTHLY_MESSAGES - totalMessages
            else:
                # Premium users don't have limits
                limitWarning = False
                remainingMessages = -1  # -1 indicates unlimited
        else:
            # New user, no warning needed
            limitWarning = False
            remainingMessages = MAX_MONTHLY_MESSAGES

        # Validate OpenAI API key
        if not OPENAI_API_KEY.value:
            logger.error("OpenAI API key not available")
            return https_fn.Response(json.dumps({'error': 'Service configuration error'}), status=HTTP_STATUS["SERVER_ERROR"])
            
        # Load conversation history and create a new message
        session = load_session(user_id, user_email, level, week, gender, language)
        conversation_history = session.get("messages", [])
        
        # Get materials and validate
        materials = get_materials(level, week)
        if not materials:
            logger.info(f"No materials found for level: {level}, week: {week}")
        
        # Generate prompt and get bot response
        prompt = create_arabic_teaching_prompt(level, week, question, gender, language, materials, conversation_history)
        
        try:
            bot_message = call_bot(OPENAI_API_KEY.value, prompt, question)
        except Exception as e:
            logger.error(f"Error calling bot: {str(e)}")
            return https_fn.Response(json.dumps({'error': 'Failed to generate response'}), status=HTTP_STATUS["SERVER_ERROR"])

        # Create user message
        user_message = {
            "id": f"{user_id}_{str(uuid.uuid4())}",
            "sender": "user",
            "text": question,
            "timestamp": get_utc_timestamp(),
            "isUser": True
        }
        
        # Add both messages to session
        new_messages = [user_message, bot_message]
        session = add_messages_to_session(session, new_messages)
        
        # Increase message count
        increase_user_message_count(user_id)

        return https_fn.Response(json.dumps({
            "answer": bot_message['text'],
            "language": language,
            "direction": get_text_direction(language),
            "_id": session['_id'],
            "sessionId": session['_id'],
            "chatSession": session,
            "limitWarning": limitWarning,
            "remainingMessages": remainingMessages
        }), status=HTTP_STATUS["OK"])
    except Exception as e:
        logger.error(f"Error processing ask user request: {str(e)}", exc_info=True)
        return https_fn.Response(json.dumps({'error': "An error occurred"}), status=HTTP_STATUS["SERVER_ERROR"])


@https_fn.on_request(cors=options.CorsOptions(
    cors_origins=CORS_ORIGINS,
    cors_methods=["get", "delete"]
))
def api_chatlogs(req: https_fn.Request) -> https_fn.Response:
    """
    A consolidated router function for chat logs:

    - GET /api/chatlogs (list all chats with pagination/filtering)
    - GET /getChatLogs (legacy endpoint - redirects to /api/chatlogs)
    - GET /api/chatlogs/<sessionId> (get a single chat)
    - DELETE /api/chatlogs (delete all chats)
    - DELETE /api/chatlogs/<sessionId> (delete a single chat)
    """
    try:
        path = req.path.strip("/")  # e.g. "api/chatlogs" or "api/chatlogs/abc123" or "getChatLogs"
        parts = path.split("/")  # e.g. ["api", "chatlogs"] or ["api", "chatlogs", "abc123"] or ["getChatLogs"]

        method = req.method.upper()
        session_id = None

        # Handle preflight requests
        if method == "OPTIONS":
            return https_fn.Response("", status=204)
        
        if req.method == "GET":
            return handle_get_all_chatlogs(req)
        if method == "DELETE":
            return handle_delete_all_chatlogs()

        return https_fn.Response("Method Not Allowed", status=HTTP_STATUS["BAD_REQUEST"])

    except Exception as e:
        logger.error(f"API chatlogs error: {str(e)}", exc_info=True)
        return https_fn.Response(json.dumps({"error": str(e)}), status=HTTP_STATUS["SERVER_ERROR"])