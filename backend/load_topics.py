from module_topics import module_topics
from database import db

topics_col = db["topics"]

# clear old data
topics_col.delete_many({})

for module, lectures in module_topics.items():
    for lecture, topics in lectures.items():
        topics_col.insert_one({
            "module": module,
            "lecture": lecture,
            "topics": topics
        })

print("✅ Topics inserted")

