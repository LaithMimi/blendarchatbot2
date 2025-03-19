import os
import logging
import uuid
import traceback
from datetime import datetime, timezone
from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, auth, firestore

# Load environment variables
load_dotenv()

# Setup logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# Initialize Firebase
firebase_initialized = False
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        logger.info("✅ Firebase initialized successfully.")
    except Exception as e:
        logger.error(f"❌ Firebase initialization failed: {e}")

# Firestore client (only if Firebase was successfully initialized)
db = firestore.client() if firebase_initialized else None

# ------------------------------
# Initialize OpenAI
# ------------------------------
try:
    from openai import OpenAI
    api_key = os.getenv("OPENAI_KEY")
    if not api_key:
        logger.error("❌ OpenAI API key is missing! Set the OPENAI_API_KEY environment variable.")
        client = None
    else:
        client = OpenAI(api_key=api_key)
        # Test the API key validity
        model_list = client.models.list()
        logger.info("✅ OpenAI client initialized successfully with valid API key.")
except Exception as e:
    logger.error(f"❌ OpenAI client initialization failed: {e}")
    client = None

# Initialize Flask app
app = Flask(__name__, static_folder='./build', static_url_path='')
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev_secret_key")
CORS(app, resources={r"/": {"origins": ""}})

# (1) Global 500 Error Handler
@app.errorhandler(500)
def handle_500_error(error):
    logger.error(f"💥 500 Internal Server Error: {error}", exc_info=True)
    return jsonify({
        "error": "An internal server error occurred",
        "message": "Please try again later.",
        "status": 500
    }), 500

# (2) Health Check Endpoint
@app.route('/api/healthcheck', methods=['GET'])
def healthcheck():
    try:
        if not client:
            return jsonify({
                "status": "warning",
                "message": "Server is running but OpenAI is not fully configured.",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }), 200
        return jsonify({
            "status": "ok",
            "message": "API server is running",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0"
        }), 200
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": f"Health check failed: {str(e)}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }), 500

# Additional Test Endpoint
@app.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({"status": "ok", "message": "API is working"})

# (4) Authentication Middleware
def verify_token():
    """Improved token verification with CORS handling"""
    if request.method == 'OPTIONS':
        # Allow preflight requests without auth
        return None, None
    
    auth_header = request.headers.get("Authorization")
    logger.debug(f"Auth header: {auth_header}")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        logger.warning("Missing or malformed Authorization header")
        return None, "Unauthorized - Missing token"

    token = auth_header.split("Bearer ")[1]
    
    if not firebase_initialized:
        logger.error("Firebase not initialized")
        return None, "Server configuration error"

    try:
        decoded_token = auth.verify_id_token(token)
        logger.info(f"Authenticated user: {decoded_token['uid']}")
        return decoded_token["uid"], None
    except auth.ExpiredIdTokenError:
        logger.warning("Expired token")
        return None, "Token expired - please reauthenticate"
    except auth.InvalidIdTokenError:
        logger.warning("Invalid token format")
        return None, "Invalid authentication token"
    except Exception as e:
        logger.error(f"Auth error: {str(e)}")
        return None, "Authentication failed"

# (5) Arabic Teaching Prompt Generator
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

# (6) Firestore Database Utilities
def safe_firestore_get(collection, document_id, default_value=None):
    if not firebase_initialized or not db:
        logger.warning("⚠ Firebase not initialized, skipping Firestore get")
        return default_value
    try:
        doc_ref = db.collection(collection).document(document_id).get()
        return doc_ref.to_dict() if doc_ref.exists else default_value
    except Exception as e:
        logger.error(f"❌ Firestore get error: {e}", exc_info=True)
        return default_value

def safe_firestore_set(collection, document_id, data, merge=False):
    if not firebase_initialized or not db:
        logger.warning("⚠ Firebase not initialized, skipping Firestore set")
        return False
    try:
        db.collection(collection).document(document_id).set(data, merge=merge)
        return True
    except Exception as e:
        logger.error(f"❌ Firestore set error for collection {collection}: {e}", exc_info=True)
        return False

def safe_get_materials(level, week):
    """
    Example retrieval of learning materials by level + week.
    Materials in Firestore might have an 'id' like 'beginner_week_01', 'beginner_week_02', etc.
    """
    if not firebase_initialized or not db:
        logger.warning("⚠ Firebase not initialized, skipping materials retrieval")
        return []
    try:
        clean_week = week.replace('week', '').zfill(2)
        lesson_key = f"{level}week{clean_week}"
        docs = db.collection("materials").where("id", ">=", lesson_key).where("id", "<", lesson_key + "_z").stream()
        materials = [doc.to_dict() for doc in docs]
        logger.info(f"📚 Retrieved {len(materials)} relevant materials.")
        return materials
    except Exception as e:
        logger.error(f"❌ Error fetching materials: {e}", exc_info=True)
        return []

# (7) Ask Endpoint
@app.route('/ask', methods=['POST'])
def ask():
    """
    Processes user messages, enforces usage limits for non-premium users,
    integrates with OpenAI (optional), and stores conversation logs in Firestore.
    """
    try:
        logger.info("📝 Received request to /ask endpoint")
    
        user_id, error = verify_token()
        if error:
            logger.warning(f"🔒 Authentication error: {error}")
            return jsonify({"error": error}), 401
        data = request.json
        if not data:
            logger.warning("❌ No JSON data in request.")
            return jsonify({"error": "No data provided"}), 400

        question = data.get('question', '').strip()
        if not question:
            logger.warning("❌ Missing question in request.")
            return jsonify({"error": "Question is required"}), 400

        # Extract additional user context
        week = data.get('week', '01')
        level = data.get('level', 'beginner')
        gender = data.get('gender', 'male')
        language = data.get('language', 'Hebrew')

        # Check if we've stored a conversation_id in session
        if 'conversation_id' in session:
            session_id = session['conversation_id']
        else:
            session_id = f"session_{user_id}_{str(uuid.uuid4())}"
            session['conversation_id'] = session_id

        logger.info(f"Session ID: {session_id}")

        # Retrieve user data from Firestore or create if none
        user_data = safe_firestore_get("users", user_id, {})
        if not user_data:
            user_data = {
                "userId": user_id,
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "totalMessages": {},
                "isPremium": False
            }
            safe_firestore_set("users", user_id, user_data)

        # (12) Usage Limiter for non-premium users
        if not user_data.get("isPremium", False):
            current_month = datetime.now().strftime("%m_%y")
            total_messages = user_data.get("totalMessages", {}).get(current_month, 0)
            if total_messages >= 50:
                limit_message = {
                    "answer": "You have reached your monthly limit of 50 messages. Please upgrade to premium.",
                    "_id": session_id,
                    "sessionId": session_id,
                    "isSubscriptionLimit": True,
                    "upgradeLink": "/subscription"
                }
                return jsonify(limit_message), 200

            # Update message count
            safe_firestore_set(
                "users",
                user_id,
                {"totalMessages": {current_month: total_messages + 1}},
                merge=True
            )

        # Retrieve chat session from Firestore
        logger.info(f"🔍 User data retrieved: {user_data}")
        chat_session = safe_firestore_get("chatLogs", session_id)
        logger.info(f"🔍 Retrieved chat session from Firestore: {chat_session}")

        if not chat_session:
            chat_session = {
                "_id": session_id,
                "userId": user_id,
                "userName": user_data.get("displayName", ""),
                "messages": [],
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "updatedAt": datetime.now(timezone.utc).isoformat(),
                "level": level,
                "language": language,
                "week": week,
                "gender": gender
            }

        conversation_history = chat_session.get("messages", [])

        # Append the user's message
        user_message = {
            "id": f"{user_id}_{str(uuid.uuid4())}",
            "sender": "user",
            "text": question,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "isUser": True
        }
        conversation_history.append(user_message)

        # Retrieve materials
        materials = safe_get_materials(level, week)
        prompt = create_arabic_teaching_prompt(level, week, question, gender, language, materials, conversation_history)

        # If OpenAI is configured, generate a response
        if not client:
            logger.warning("OpenAI client not available, returning mock response in dev mode.")
            bot_answer = "This is a mock response; OpenAI is not configured."
        else:
            try:
                # Call ChatCompletion
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

            except Exception as openai_error:
                logger.error(f"❌ OpenAI error: {openai_error}", exc_info=True)
                bot_answer = "We encountered an issue calling OpenAI. Please try again later."

        # Append the bot's message
        bot_message = {
            "id": f"{user_id}_{str(uuid.uuid4())}",
            "sender": "bot",
            "text": bot_answer,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "isUser": False
        }
        conversation_history.append(bot_message)

        # Update the chat session data
        chat_session["messages"] = conversation_history
        chat_session["updatedAt"] = datetime.now(timezone.utc).isoformat()

        # Save to Firestore
        safe_firestore_set("chatLogs", session_id, chat_session)
        print(f"📝 Chat session saved to Firestore: {session_id}")

        return jsonify({
            "answer": bot_answer,
            "language": language,
            "direction": "rtl" if language == 'arabic' else "ltr",
            "_id": session_id,
            "sessionId": session_id,
            "chatSession": chat_session
        })
    except Exception as e:
        stack_trace = traceback.format_exc()
        logger.error(f"❌ Unhandled error in /ask endpoint: {e}\n{stack_trace}")
        return jsonify({
            "error": "An unexpected error occurred",
            "message": f"Error: {str(e)}"
        }), 500

# (8) Aliased Ask Endpoint
@app.route('/api/ask', methods=['POST'])
def api_ask():
    return ask()

# (9) Chat Log Management
@app.route('/api/chatlogs', methods=['GET'])
def get_chatlogs():
    """
    Retrieve chat logs with optional pagination & filtering.
    """
    try:
        if not firebase_initialized or not db:
            logger.warning("⚠ Firebase not initialized, returning empty results")
            return jsonify({"chats": [], "totalPages": 0}), 200
            
        logger.info("📋 Attempting to fetch chat logs from Firestore")
        try:
            chat_docs = db.collection("chatLogs").stream()
            chat_logs = [doc.to_dict() for doc in chat_docs]
            logger.info(f"✅ Successfully retrieved {len(chat_logs)} chat logs")
        except Exception as firebase_error:
            logger.error(f"❌ Firebase error retrieving chat logs: {firebase_error}", exc_info=True)
            return jsonify({"error": "Firebase error", "message": str(firebase_error)}), 500
            
        page = int(request.args.get("page", 1))
        page_size = int(request.args.get("pageSize", 20))
        search_term = request.args.get("searchTerm", "").lower()
        user_filter = request.args.get("userId", "").lower()
        date_from = request.args.get("dateFrom", None)
        date_to = request.args.get("dateTo", None)

        chat_docs = db.collection("chatLogs").stream()
        chat_logs = [doc.to_dict() for doc in chat_docs]

        # Filtering by search term
        if search_term:
            chat_logs = [
                c for c in chat_logs
                if search_term in c.get("userName", "").lower()
                or search_term in c.get("userId", "").lower()
                or search_term in c.get("_id", "").lower()
            ]

        # Filter by userId
        if user_filter:
            chat_logs = [c for c in chat_logs if user_filter in c.get("userId", "").lower()]

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

        return jsonify({"chats": paginated_logs, "totalPages": total_pages}), 200
    except Exception as e:
        logger.error(f"Error retrieving chat logs: {e}", exc_info=True)
        return jsonify({"error": "Failed to retrieve chat logs", "message": str(e)}), 500

@app.route('/api/chatlogs/<session_id>', methods=['DELETE'])
def delete_chatlog(session_id):
    try:
        db.collection("chatLogs").document(session_id).delete()
        return jsonify({"success": True}), 200
    except Exception as e:
        logger.error(f"Error deleting chat log {session_id}: {e}", exc_info=True)
        return jsonify({"error": "Failed to delete chat log", "message": str(e)}), 500

@app.route('/api/chatlogs', methods=['DELETE'])
def delete_all_chatlogs():
    try:
        chat_docs = db.collection("chatLogs").stream()
        for doc in chat_docs:
            doc.reference.delete()
        return jsonify({"success": True}), 200
    except Exception as e:
        logger.error(f"Error deleting all chat logs: {e}", exc_info=True)
        return jsonify({"error": "Failed to delete all chat logs", "message": str(e)}), 500

# (10) Frontend Serving
@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def catch_all(path):
    if path.startswith('api/'):
        return jsonify({"error": f"Unknown API endpoint: /{path}"}), 404
    elif path == 'auth/complete' or path.startswith('auth/'):
        return send_from_directory(app.static_folder, 'index.html')
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    if os.getenv("FLASK_SECRET_KEY"):
        logger.info("🔒 Secret key loaded successfully")
    else:
        logger.critical("❌ No secret key configured!")
    
    logger.info("🚀 Starting Flask server...")
    app.run(debug=True, host='0.0.0.0', port=8888)
    #app.run(debug=False) Always disable debug in production