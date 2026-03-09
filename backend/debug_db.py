from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DB_NAME", "adaptive_learning_gemini")

def diagnose():
    print(f"Connecting to {DB_NAME}...")
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    
    col = db["lecture_content"]
    
    print("\n--- Checking 'module' field types in lecture_content ---")
    pipeline = [
        {"$project": {"module_type": {"$type": "$module"}, "module_value": "$module"}},
        {"$group": {"_id": "$module_type", "count": {"$sum": 1}, "example": {"$first": "$module_value"}}}
    ]
    
    for res in col.aggregate(pipeline):
        print(f"Type: {res['_id']}, Count: {res['count']}, Example: {res['example']}")

    print("\n--- Checking distinct modules ---")
    try:
        modules = col.distinct("module")
        print(f"Distinct modules: {modules}")
    except Exception as e:
        print(f"❌ Error in distinct('module'): {e}")

if __name__ == "__main__":
    diagnose()
