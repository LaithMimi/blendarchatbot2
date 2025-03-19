import firebase_admin
from firebase_admin import credentials, auth
import requests
import time
import json
import sys

# Initialize Firebase Admin SDK
def initialize_firebase():
    try:
        cred = credentials.Certificate("serviceAccountKey.json")
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin SDK initialized successfully")
    except Exception as e:
        print(f"❌ Firebase initialization error: {e}")
        sys.exit(1)

# Create or get a test user
def get_or_create_user(email, password):
    try:
        user = auth.get_user_by_email(email)
        print(f"✅ Found existing user: {user.uid}")
    except:
        try:
            user = auth.create_user(email=email, password=password)
            print(f"✅ Created new user: {user.uid}")
        except Exception as e:
            print(f"❌ Error creating user: {e}")
            sys.exit(1)
    return user

# Create a custom token
def get_custom_token(user_id):
    try:
        custom_token = auth.create_custom_token(user_id)
        print(f"✅ Generated custom token for user {user_id}")
        return custom_token.decode('utf-8')
    except Exception as e:
        print(f"❌ Error generating custom token: {e}")
        sys.exit(1)

# Exchange custom token for ID token
def exchange_custom_token(custom_token, api_key):
    try:
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={api_key}"
        payload = {
            "token": custom_token,
            "returnSecureToken": True
        }
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            id_token = response.json().get("idToken")
            print(f"✅ Exchanged custom token for ID token")
            return id_token
        else:
            print(f"❌ Token exchange error: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error in token exchange request: {e}")
        return None

# Test the API with authentication
def test_api_with_auth_token(id_token):
    BASE_URL = "http://localhost:8888"  # Update with your server URL
    
    # Headers for authenticated requests
    headers = {
        "Authorization": f"Bearer {id_token}",
        "Content-Type": "application/json"
    }
    
    # Test 1: Check health endpoint (no auth required)
    try:
        print("\n🔍 Test 1: Health check endpoint")
        response = requests.get(f"{BASE_URL}/api/healthcheck")
        if response.status_code == 200:
            print(f"✅ Health check successful: {response.json()['status']}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check request error: {e}")
    
    # Test 2: First message - testing authentication
    try:
        print("\n🔍 Test 2: First authenticated message")
        first_message = {
            "question": "Hello, can you teach me how to say 'thank you' in Arabic?",
            "week": "01",
            "level": "beginner",
            "gender": "male",
            "language": "hebrew"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ask",
            headers=headers,
            json=first_message
        )
        
        if response.status_code == 200:
            data = response.json()
            session_id = data.get("sessionId")
            print(f"✅ First message successful with session ID: {session_id}")
            print(f"Response preview: {data.get('answer')[:100]}...")
            
            # Test 3: Second message - testing context
            try:
                print("\n🔍 Test 3: Follow-up message with context")
                # Wait a moment before sending the second message
                time.sleep(2)
                
                second_message = {
                    "question": "And how do I say 'you're welcome'?",
                    "week": "01",
                    "level": "beginner",
                    "gender": "male",
                    "language": "hebrew",
                    "sessionId": session_id
                }
                
                response = requests.post(
                    f"{BASE_URL}/api/ask",
                    headers=headers,
                    json=second_message
                )
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Follow-up message successful")
                    print(f"Response preview: {data.get('answer')[:100]}...")
                    
                    # Check if the second message contains relevant context
                    answer = data.get('answer', '').lower()
                    has_thank_you = any(word in answer for word in ['thank', 'شكر', 'תודה', 'شكرا'])
                    has_welcome = any(word in answer for word in ['welcome', 'عفو', 'בבקשה', 'اهلا'])
                    
                    if has_thank_you and has_welcome:
                        print("✅ Context maintained! Response includes references to both thank you and you're welcome.")
                    elif has_welcome:
                        print("✅ Response addresses the you're welcome request.")
                    else:
                        print("❌ Context may not be working correctly.")
                    
                    # Test 4: Third message - more complex follow-up
                    try:
                        print("\n🔍 Test 4: Complex follow-up message")
                        time.sleep(2)
                        
                        third_message = {
                            "question": "Can we practice a short conversation using these phrases?",
                            "week": "01",
                            "level": "beginner",
                            "gender": "male",
                            "language": "hebrew",
                            "sessionId": session_id
                        }
                        
                        response = requests.post(
                            f"{BASE_URL}/api/ask",
                            headers=headers,
                            json=third_message
                        )
                        
                        if response.status_code == 200:
                            data = response.json()
                            print(f"✅ Complex follow-up successful")
                            print(f"Response preview: {data.get('answer')[:100]}...")
                            
                            # Check for dialogue format in response
                            answer = data.get('answer', '')
                            has_dialogue = ':' in answer or '-' in answer or 'A:' in answer or 'Q:' in answer
                            
                            if has_dialogue:
                                print("✅ Response contains a dialogue format as requested.")
                            else:
                                print("⚠️ Response may not contain a dialogue as requested.")
                        else:
                            print(f"❌ Complex follow-up failed: {response.status_code}")
                            print(response.text)
                    
                    except Exception as e:
                        print(f"❌ Complex follow-up request error: {e}")
                
                else:
                    print(f"❌ Follow-up message failed: {response.status_code}")
                    print(response.text)
            
            except Exception as e:
                print(f"❌ Follow-up message request error: {e}")
        
        else:
            print(f"❌ First message failed: {response.status_code}")
            print(response.text)
    
    except Exception as e:
        print(f"❌ First message request error: {e}")

# Main test execution
def run_tests():
    print("🚀 Starting Blend.ar API tests with real authentication\n")
    
    # Configuration
    EMAIL = "test@example.com"
    PASSWORD = "Test123456!"  # Strong password for Firebase
    API_KEY = "AIzaSyDsjUt2ZCPvngO03E062Mur5jVTcfDu2BY"  # Your Firebase Web API Key
    
    # Initialize Firebase
    initialize_firebase()
    
    # Authentication flow
    user = get_or_create_user(EMAIL, PASSWORD)
    custom_token = get_custom_token(user.uid)
    id_token = exchange_custom_token(custom_token, API_KEY)
    
    if id_token:
        print(f"✅ Authentication successful. ID token: {id_token[:20]}...\n")
        # Run API tests with the token
        test_api_with_auth_token(id_token)
        print("\n🏁 Tests completed!")
    else:
        print("❌ Failed to obtain ID token. Tests aborted.")

if __name__ == "__main__":
    run_tests()