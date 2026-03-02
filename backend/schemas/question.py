from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class QuestionType(str, Enum):
    MCQ = "mcq"
    SHORT_ANSWER = "short_answer"
    LONG_ANSWER = "long_answer"
    TRUE_FALSE = "true_false"
    MIXED = "mixed"

class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class QuestionGenerateRequest(BaseModel):
    content: Optional[str] = None
    num_questions: int = Field(default=10, ge=1, le=50)
    question_type: QuestionType = QuestionType.MIXED
    difficulty: Difficulty = Difficulty.MEDIUM

class Question(BaseModel):
    id: int
    type: str
    question: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None
    difficulty: str
    topic: Optional[str] = None

class QuestionGenerateResponse(BaseModel):
    questions: List[Question]
    total_questions: int
    source: Optional[str] = None

class ModelPaperConfig(BaseModel):
    total_marks: int = 100
    duration: str = "3 hours"
    sections: int = 3
    mcq_count: int = 10
    short_count: int = 5
    long_count: int = 3

class ModelPaperRequest(BaseModel):
    content: Optional[str] = None
    config: ModelPaperConfig = ModelPaperConfig()

class EvaluateAnswerRequest(BaseModel):
    question: str
    user_answer: str
    model_answer: str
    question_type: str = "short_answer"
    topic: str = "General"

class EvaluateStructuredAnswerRequest(BaseModel):
    question: str
    part_a_user: str
    part_a_model: str
    part_b_user: str
    part_b_model: str
    part_c_user: str
    part_c_model: str
    topic: str = "General"