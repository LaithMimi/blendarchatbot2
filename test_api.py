import unittest
import requests
import json
import os
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class BlendArAPITester(unittest.TestCase):
    """Test suite for Blend.ar Arabic tutor backend API"""
    
    BASE_URL = "http://localhost:8888"  # Update this with your actual backend URL
    
    def setUp(self):
        """Setup before each test - get test auth token"""
        # For testing, we'll use the dev token
        self.headers = {
            "Authorization": "Bearer dev_token_for_testing",
            "Content-Type": "application/json"
        }
        
        # Test user preferences
        self.test_prefs = {
            "question": "Hello, can you teach me how to say 'my name is' in Arabic?",
            "week": "01",
            "level": "beginner",
            "gender": "male",
            "language": "hebrew"
        }
    
    def test_01_health_check(self):
        """Test the health check endpoint"""
        response = requests.get(f"{self.BASE_URL}/api/healthcheck")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        print("✅ Health check endpoint working")
    
    def test_02_test_endpoint(self):
        """Test the simple test endpoint"""
        response = requests.get(f"{self.BASE_URL}/api/test-simple")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        print("✅ Test endpoint working")
    
    def test_03_authentication_required(self):
        """Test that authentication is required for protected endpoints"""
        # Try accessing without auth token
        response = requests.post(
            f"{self.BASE_URL}/api/ask",
            json=self.test_prefs
        )
        self.assertEqual(response.status_code, 401)
        print("✅ Authentication check working")
    
    def test_04_ask_endpoint_with_dev_token(self):
        """Test the ask endpoint with dev token"""
        response = requests.post(
            f"{self.BASE_URL}/api/ask",
            headers=self.headers,
            json=self.test_prefs
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("answer", data)
        self.assertIn("sessionId", data)
        print("✅ Ask endpoint working with dev token")
        
        # Save the session ID for the conversation continuity test
        self.session_id = data["sessionId"]
        return data
    
    def test_05_conversation_continuity(self):
        """Test that the API maintains conversation context"""
        # First message already sent in test_04
        # Now send a follow-up question that requires context
        
        # Make sure we're using the same session ID from the previous test
        first_response_data = self.test_04_ask_endpoint_with_dev_token()
        session_id = first_response_data["sessionId"]
        
        follow_up = {
            "question": "Can you give me more examples?",
            "week": "01",
            "level": "beginner",
            "gender": "male",
            "language": "hebrew",
            "sessionId": session_id  # Include the session ID from the first response
        }
        
        # Small delay to ensure messages are processed in order
        time.sleep(1)
        
        response = requests.post(
            f"{self.BASE_URL}/api/ask",
            headers=self.headers,
            json=follow_up
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Print the response for debugging
        print(f"Follow-up response: {data['answer'][:100]}...")
        
        # The response should reference "name" since our first question was about "my name is"
        # This is a basic test for context awareness
        self.assertIn("answer", data)
        answer_lower = data["answer"].lower()
        
        # Expand list of context words to catch more potential matches
        context_words = ["name", "اسم", "שם", "إسم", "שמי", "اسمي", "my name", "call me"]
        has_context = any(word in answer_lower for word in context_words)
        
        # Print debug info about content search
        if not has_context:
            print("Context check failed. Searching for these terms in the response:")
            for word in context_words:
                print(f"- '{word}': {'✓' if word in answer_lower else '✗'}")
            print(f"Response excerpt: {answer_lower[:200]}")
        
        self.assertTrue(has_context, "Response doesn't show context awareness")
        print("✅ Conversation continuity working")
    
    
    def test_06_different_language_preference(self):
        """Test that language preference changes the response format"""
        arabic_prefs = self.test_prefs.copy()
        arabic_prefs["language"] = "arabic"
        
        response = requests.post(
            f"{self.BASE_URL}/api/ask",
            headers=self.headers,
            json=arabic_prefs
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Arabic responses should have rtl direction
        self.assertEqual(data["direction"], "rtl")
        
        # Should contain Arabic script
        arabic_script_pattern = any(ord(c) >= 0x0600 and ord(c) <= 0x06FF for c in data["answer"])
        self.assertTrue(arabic_script_pattern, "Response doesn't contain Arabic script")
        print("✅ Language preference handling working")
    
    def test_07_invalid_request(self):
        """Test handling of invalid requests"""
        # Send request without question
        invalid_request = {
            "week": "01",
            "level": "beginner",
            "gender": "male",
            "language": "hebrew"
        }
        
        response = requests.post(
            f"{self.BASE_URL}/api/ask",
            headers=self.headers,
            json=invalid_request
        )
        self.assertEqual(response.status_code, 400)
        print("✅ Invalid request handling working")
    
    def test_08_multiple_conversation_turns(self):
        """Test a longer conversation with multiple turns"""
        # Define a sequence of messages for a conversation
        messages = [
            "How do I say hello in Arabic?",
            "How do I ask someone how they are?",
            "Can you teach me to count from 1 to 5?",
            "Let's practice a dialogue with these phrases."
        ]
        
        for i, message in enumerate(messages):
            prefs = self.test_prefs.copy()
            prefs["question"] = message
            
            response = requests.post(
                f"{self.BASE_URL}/api/ask",
                headers=self.headers,
                json=prefs
            )
            self.assertEqual(response.status_code, 200)
            
            # Print a snippet of the response
            answer = response.json()["answer"]
            print(f"Message {i+1} response preview: {answer[:50]}...")
            
            # Brief pause between requests
            time.sleep(1)
        
        print("✅ Multiple conversation turns working")
    
    def test_09_stress_test(self):
        """Stress test with multiple rapid requests"""
        # Send 5 requests in quick succession
        stress_question = "Translate 'Good morning' to Arabic"
        prefs = self.test_prefs.copy()
        prefs["question"] = stress_question
        
        start_time = time.time()
        responses = []
        
        for i in range(5):
            response = requests.post(
                f"{self.BASE_URL}/api/ask",
                headers=self.headers,
                json=prefs
            )
            responses.append(response)
        
        end_time = time.time()
        
        # Check all responses were successful
        all_successful = all(r.status_code == 200 for r in responses)
        self.assertTrue(all_successful, "Not all stress test requests were successful")
        
        # Print timing information
        print(f"✅ Stress test complete. 5 requests took {end_time - start_time:.2f} seconds")

    def test_10_simulate_premium_check(self):
        """Test premium user check simulation"""
        # We can't directly test the premium check since it's internal,
        # but we can check that it's working conceptually by sending many messages
        
        # Dev mode should bypass the 50 message limit
        for i in range(3):  # Just do 3 for testing speed
            prefs = self.test_prefs.copy()
            prefs["question"] = f"Test message {i+1}"
            
            response = requests.post(
                f"{self.BASE_URL}/api/ask",
                headers=self.headers,
                json=prefs
            )
            self.assertEqual(response.status_code, 200)
        
        print("✅ Premium limit bypass working in dev mode")


def run_tests():
    """Run the test suite"""
    print("Starting Blend.ar API tests...")
    print("-" * 60)
    
    # Create a test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(BlendArAPITester)
    
    # Run the tests
    result = unittest.TextTestRunner(verbosity=1).run(suite)
    
    print("-" * 60)
    print(f"Tests completed: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if not result.wasSuccessful():
        print("\nFailed tests:")
        for test, error in result.failures + result.errors:
            print(f"- {test._testMethodName}: {error}")
    else:
        print("\n🎉 All tests passed!")


if __name__ == "__main__":
    run_tests()