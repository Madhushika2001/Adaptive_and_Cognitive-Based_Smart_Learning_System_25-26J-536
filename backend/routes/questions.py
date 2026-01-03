from fastapi import APIRouter, UploadFile, File, Query, Depends
from typing import Optional

from controllers.question_controller import QuestionController
from schemas.question import (
    QuestionGenerateRequest,
    QuestionType,
    Difficulty,
    ModelPaperConfig,
    ModelPaperRequest
)

router = APIRouter(prefix="/api/questions", tags=["Questions"])

# Initialize controller
controller = QuestionController()

@router.post("/generate/pdf")
async def generate_from_pdf(
    file: UploadFile = File(...),
    num_questions: int = Query(default=10, ge=1, le=50),
    question_type: QuestionType = Query(default=QuestionType.MIXED),
    difficulty: Difficulty = Query(default=Difficulty.MEDIUM)
):
    """
    Generate questions from an uploaded PDF file.
    
    - **file**: PDF file containing lecture notes
    - **num_questions**: Number of questions to generate (1-50)
    - **question_type**: Type of questions (mcq, short_answer, long_answer, true_false, mixed)
    - **difficulty**: Difficulty level (easy, medium, hard)
    """
    return await controller.generate_questions_from_pdf(
        file=file,
        num_questions=num_questions,
        question_type=question_type.value,
        difficulty=difficulty.value
    )

@router.post("/generate/text")
async def generate_from_text(request: QuestionGenerateRequest):
    """
    Generate questions from text content.
    
    - **content**: Text content from lecture notes
    - **num_questions**: Number of questions to generate
    - **question_type**: Type of questions
    - **difficulty**: Difficulty level
    """
    return await controller.generate_questions_from_text(request)

@router.get("/generate/stored/{source}")
async def generate_from_stored(
    source: str = "dl",
    num_questions: int = Query(default=10, ge=1, le=50),
    question_type: QuestionType = Query(default=QuestionType.MIXED),
    difficulty: Difficulty = Query(default=Difficulty.MEDIUM)
):
    """
    Generate questions from pre-extracted content.
    
    - **source**: Source identifier (dl for Deep Learning, da for Data Analytics)
    - **num_questions**: Number of questions to generate
    - **question_type**: Type of questions
    - **difficulty**: Difficulty level
    """
    return await controller.generate_questions_from_stored(
        source=source,
        num_questions=num_questions,
        question_type=question_type.value,
        difficulty=difficulty.value
    )

@router.post("/model-paper/pdf")
async def generate_model_paper_from_pdf(
    file: UploadFile = File(...),
    total_marks: int = Query(default=100),
    duration: str = Query(default="3 hours"),
    mcq_count: int = Query(default=10),
    short_count: int = Query(default=5),
    long_count: int = Query(default=3)
):
    """
    Generate a complete model paper from uploaded PDF.
    """
    config = ModelPaperConfig(
        total_marks=total_marks,
        duration=duration,
        mcq_count=mcq_count,
        short_count=short_count,
        long_count=long_count
    )
    return await controller.generate_model_paper(file=file, config=config)

@router.get("/model-paper/stored/{source}")
async def generate_model_paper_from_stored(
    source: str = "dl",
    total_marks: int = Query(default=100),
    duration: str = Query(default="3 hours"),
    mcq_count: int = Query(default=10),
    short_count: int = Query(default=5),
    long_count: int = Query(default=3)
):
    """
    Generate a complete model paper from pre-extracted content.
    """
    config = ModelPaperConfig(
        total_marks=total_marks,
        duration=duration,
        mcq_count=mcq_count,
        short_count=short_count,
        long_count=long_count
    )
    return await controller.generate_model_paper(file=None, config=config, source=source)


@router.get("/generate/personalized/{subject}")
async def generate_personalized_questions(
    subject: str = "dl",
    num_questions: int = Query(default=5, ge=1, le=20),
    question_type: QuestionType = Query(default=QuestionType.MIXED),
    content: Optional[str] = Query(default=None, description="Optional content to base questions on")
):
    """
    Generate questions using a personalized LoRA model trained on course materials.
    
    - **subject**: Subject identifier (dl, da, ime)
    - **num_questions**: Number of questions to generate
    - **question_type**: Type of questions
    - **content**: Optional specific content to generate questions from
    """
    from utils.personalized_model_service import get_personalized_service
    
    service = get_personalized_service()
    
    # If no content provided, use stored content
    if not content:
        from pathlib import Path
        import json
        data_path = Path(__file__).parent.parent / "data" / f"extracted_text_{subject}.json"
        if data_path.exists():
            with open(data_path, 'r', encoding='utf-8') as f:
                pages = json.load(f)
            content = "\n\n".join([p.get('content', p.get('output', '')) for p in pages[:5]])
        else:
            return {"success": False, "error": f"No content found for subject: {subject}"}
    
    result = service.generate_questions(
        content=content,
        subject=subject,
        num_questions=num_questions,
        question_type=question_type.value
    )
    
    return result


@router.get("/personalized/models")
async def get_available_personalized_models():
    """
    Get list of available personalized models.
    """
    from utils.personalized_model_service import get_personalized_service
    
    service = get_personalized_service()
    return {
        "available_models": service.get_available_models(),
        "device": service.device
    }


@router.get("/generate/custom/{source}")
async def generate_custom_paper(
    source: str = "dl",
    topic: str = Query(default="General"),
    num_questions: int = Query(default=10, ge=1, le=50),
    question_type: str = Query(default="short_answers"),
    difficulty: str = Query(default="medium")
):
    """
    Generate a custom paper with specific topic, difficulty, question type, and count.
    This endpoint is used by the ModelPaperSetupPage.
    
    - **source**: Subject identifier (dl, da, ime)
    - **topic**: Specific topic to focus on
    - **num_questions**: Number of questions to generate
    - **question_type**: Type of questions (short_answers, mcq, structured, essay)
    - **difficulty**: Difficulty level (easy, medium, hard)
    """
    return await controller.generate_custom_paper(
        source=source,
        topic=topic,
        num_questions=num_questions,
        question_type=question_type,
        difficulty=difficulty
    )