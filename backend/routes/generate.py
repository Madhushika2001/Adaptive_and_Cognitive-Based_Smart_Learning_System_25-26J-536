from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

from backend.schemas import SummaryRequest, LevelRequest, MCQRequest
from backend.database import db
from backend.services.level_service import calculate_level
from backend.services.openai_service import (
    generate_summary,
    generate_flashcards,
    generate_mindmap,
    generate_mcqs
)

router = APIRouter(prefix="/generate", tags=["Generation"])


# -------------------------
# LEVEL PREDICTION
# -------------------------
@router.post("/check-level")
def check_level(data: LevelRequest):
    return {
        "level": calculate_level(
            confidence=data.confidence,
            mcq_score=data.mcq_score
        )
    }


# -------------------------
# SUMMARY
# -------------------------
@router.post("/summary")
def summary(req: SummaryRequest):
    text = generate_summary(req.topic, req.level)

    db.generated_content.insert_one({
        "module": req.module,
        "lecture": req.lecture,
        "topic": req.topic,
        "level": req.level,
        "type": "summary",
        "content": text
    })

    return {"summary": text}


# -------------------------
# FLASHCARDS
# -------------------------
@router.post("/flashcards")
def flashcards(req: SummaryRequest):
    return {
        "flashcards": generate_flashcards(req.topic, req.level)
    }


# -------------------------
# MIND MAP
# -------------------------
@router.post("/mindmap")
def mindmap(req: SummaryRequest):
    return {
        "mindmap": generate_mindmap(req.topic, req.level)
    }


# -------------------------
# MCQs
# -------------------------
@router.post("/mcqs")
def mcqs(req: MCQRequest):
    raw = generate_mcqs(req.topic)

    normalized = []
    for q in raw:
        normalized.append({
            "question": q["question"],
            "options": q["options"],
            "correct_index": q["correct"]
        })

    db.mcq_sessions.insert_one({
        "topic": req.topic,
        "questions": normalized
    })

    safe_questions = [
        {
            "question": q["question"],
            "options": q["options"]
        }
        for q in normalized
    ]

    return {"questions": safe_questions}


# -------------------------
# SUBMIT MCQs
# -------------------------
class SubmitMCQRequest(BaseModel):
    topic: str
    answers: List[int]


@router.post("/submit-mcqs")
def submit_mcqs(data: SubmitMCQRequest):
    session = db.mcq_sessions.find_one(
        {"topic": data.topic},
        sort=[("_id", -1)]
    )

    if not session:
        raise HTTPException(status_code=404, detail="MCQ session not found")

    score = 0
    for i, q in enumerate(session["questions"]):
        if i < len(data.answers) and data.answers[i] == q["correct_index"]:
            score += 1

    return {
        "mcq_score": score,
        "total": len(session["questions"])
    }
