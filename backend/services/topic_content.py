from database import lecture_collection

def get_topic_content(module: str, lecture: str, topic: str):
    doc = lecture_collection.find_one(
        {"module": module, "lecture": lecture}
    )

    if not doc:
        return None

    for t in doc["topics"]:
        if t["title"] == topic:
            return t["content"]

    return None
