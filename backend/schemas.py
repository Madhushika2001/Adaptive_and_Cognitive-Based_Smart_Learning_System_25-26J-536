from pydantic import BaseModel

class LevelRequest(BaseModel):
    confidence: int
    mcq_score: int


class SummaryRequest(BaseModel):
    module: str
    lecture: str
    topic: str
    level: str


class MCQRequest(BaseModel):
    topic: str
