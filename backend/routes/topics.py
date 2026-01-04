from fastapi import APIRouter
from database import db

router = APIRouter()

@router.get("/topics/{module}/{lecture}")
def get_topics(module: str, lecture: str):
    topics = db.topics.find(
        {"module": module, "lecture": lecture},
        {"_id": 0, "topic": 1}
    )
    return [t["topic"] for t in topics]
