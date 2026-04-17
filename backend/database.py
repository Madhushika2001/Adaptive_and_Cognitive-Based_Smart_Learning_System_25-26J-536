import certifi
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# ── MongoDB (Adaptive Learning component) ───────────────────────────────────
uri = os.getenv("MONGODB_URI")
db_name = os.getenv("MONGODB_DB_NAME", "adaptive_learning_gemini")

db = None
lecture_collection = None
user_results_collection = None
mcq_collection = None
summary_collection = None
mindmap_collection = None
flashcard_collection = None
feedback_collection = None
study_plan_collection = None

if not uri or "<cluster>" in uri:
    print("⚠️ MONGODB_URI is not configured or is using a placeholder. Adaptive features will be disabled.")
else:
    try:
        client = MongoClient(uri, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
        # Verify connection
        client.admin.command('ping')
        db = client[db_name]
        
        lecture_collection      = db["lecture_content"]
        user_results_collection = db["user_results"]
        mcq_collection          = db["generated_mcqs"]
        summary_collection      = db["generated_summaries"]
        mindmap_collection      = db["generated_mindmaps"]
        flashcard_collection    = db["generated_flashcards"]
        feedback_collection     = db["generated_feedback"]
        study_plan_collection   = db["generated_study_plans"]
        
        print("✅ MongoDB connected — adaptive learning collections ready.")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}. Adaptive features will be disabled.")

