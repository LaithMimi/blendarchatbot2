import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# Load environment variables (if any)
load_dotenv()

def initialize_firebase():
    if not firebase_admin._apps:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
        print("✅ Firebase initialized.")

def seed_database():
    try:
        initialize_firebase()
        db = firestore.client()

        # -------------------------
        # 1) Insert Learning Materials
        # -------------------------
        materials_coll = db.collection('materials')

        # Make sure the file path is correct. 
        # If your file is at "./data_files/materials_data_set.json", use that path below
        with open('data_files/materials_data_set.json', 'r', encoding='utf-8') as file:
            sample_data = json.load(file)
        
        for item in sample_data:
            doc_id = item['id']    # Firestore doc name will match the "id" field
            doc_ref = materials_coll.document(doc_id)
            doc_ref.set(item)
            print(f"✅ Inserted material with ID: {doc_id}")

        print("🎉 'materials' collection seeding complete.\n")

        # -------------------------
        # 2) Insert Example User
        # -------------------------
        users_coll = db.collection('users')
        example_user_id = "test_user_123"
        example_user_data = {
            "isPremium": False,
            "totalMessages": {
                "03_25": 5,
                "04_25": 0
            },
            "createdAt": "2025-01-01T00:00:00Z"
        }

        user_doc = users_coll.document(example_user_id).get()
        if not user_doc.exists:
            users_coll.document(example_user_id).set(example_user_data)
            print(f"✅ Inserted example user: {example_user_id}")
        else:
            print(f"⚡ User {example_user_id} already exists. No changes made.")

        print("🎉 'users' collection setup done.\n")

        # -------------------------
        # 3) Ensure ChatLogs Collection
        # -------------------------
        chat_logs_coll = db.collection('chatLogs')
        placeholder_doc_id = "placeholder"
        if not chat_logs_coll.document(placeholder_doc_id).get().exists:
            chat_logs_coll.document(placeholder_doc_id).set({"message": "This is a placeholder."})
            print("✅ Inserted placeholder in 'chatLogs' collection.")
        else:
            print("⚡ 'chatLogs' placeholder already exists. No changes made.")

        print("🎉 Firestore seeding complete!")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")

if __name__ == "__main__":
    seed_database()
