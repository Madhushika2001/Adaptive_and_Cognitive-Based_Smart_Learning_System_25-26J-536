from database import lecture_collection

def get_topics(module: str, lecture: str):
    doc = lecture_collection.find_one(
        {"module": module, "lecture": lecture},
        {"_id": 0, "topics.title": 1}
    )

    if not doc:
        return []

    return [topic["title"] for topic in doc["topics"]]
