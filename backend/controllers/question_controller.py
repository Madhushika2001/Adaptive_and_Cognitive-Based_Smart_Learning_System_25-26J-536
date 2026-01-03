from fastapi import UploadFile, HTTPException
from typing import Optional
from pathlib import Path
import json

from utils.pdf_extractor import PDFExtractor
from utils.gemini_service import GeminiService
from schemas.question import (
    QuestionGenerateRequest,
    QuestionType,
    Difficulty,
    ModelPaperConfig
)

class QuestionController:
    """Controller for question generation"""
    
    def __init__(self):
        self.gemini_service = GeminiService()
        self.pdf_extractor = PDFExtractor()
        self.cached_content = None
    
    async def generate_questions_from_pdf(
        self,
        file: UploadFile,
        num_questions: int = 10,
        question_type: str = "mixed",
        difficulty: str = "medium"
    ):
        """Generate questions from uploaded PDF"""
        
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Read PDF content
        pdf_bytes = await file.read()
        
        # Extract text
        pages = self.pdf_extractor.extract_text_from_bytes(pdf_bytes, file.filename)
        
        if not pages:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
        content = self.pdf_extractor.combine_pages(pages)
        
        # Generate questions
        result = self.gemini_service.generate_questions(
            content=content,
            num_questions=num_questions,
            question_type=question_type,
            difficulty=difficulty
        )
        
        return result
    
    async def generate_questions_from_text(
        self,
        request: QuestionGenerateRequest
    ):
        """Generate questions from text content"""
        
        if not request.content or len(request.content.strip()) < 100:
            raise HTTPException(
                status_code=400,
                detail="Content must be at least 100 characters"
            )
        
        result = self.gemini_service.generate_questions(
            content=request.content,
            num_questions=request.num_questions,
            question_type=request.question_type.value,
            difficulty=request.difficulty.value
        )
        
        return result
    
    async def generate_questions_from_stored(
        self,
        source: str = "dl",
        num_questions: int = 10,
        question_type: str = "mixed",
        difficulty: str = "medium"
    ):
        """Generate questions from pre-extracted content"""
        
        # Load pre-extracted content from project root data folder
        data_path = Path(__file__).parent.parent.parent / "data" / f"extracted_text_{source}.json"
        
        if not data_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"No extracted content found for source: {source}"
            )
        
        with open(data_path, 'r', encoding='utf-8') as f:
            pages = json.load(f)
        
        content = "\n\n".join([page['content'] for page in pages])
        
        result = self.gemini_service.generate_questions(
            content=content,
            num_questions=num_questions,
            question_type=question_type,
            difficulty=difficulty
        )
        
        return result
    
    async def generate_model_paper(
        self,
        file: Optional[UploadFile] = None,
        config: ModelPaperConfig = ModelPaperConfig(),
        source: str = "dl"
    ):
        """Generate a complete model paper"""
        
        if file:
            pdf_bytes = await file.read()
            pages = self.pdf_extractor.extract_text_from_bytes(pdf_bytes, file.filename)
            content = self.pdf_extractor.combine_pages(pages)
        else:
            # Use stored content from project root data folder
            data_path = Path(__file__).parent.parent.parent / "data" / f"extracted_text_{source}.json"
            if not data_path.exists():
                raise HTTPException(
                    status_code=404,
                    detail=f"No extracted content found for source: {source}"
                )
            
            with open(data_path, 'r', encoding='utf-8') as f:
                pages = json.load(f)
            
            content = "\n\n".join([page['content'] for page in pages])
        
        result = self.gemini_service.generate_model_paper(
            content=content,
            paper_config=config.model_dump()
        )
        
        return result
    
    async def generate_custom_paper(
        self,
        source: str = "dl",
        topic: str = "General",
        num_questions: int = 10,
        question_type: str = "short_answers",
        difficulty: str = "medium"
    ):
        """Generate a custom paper with specific topic, difficulty, type, and count"""
        
        # Load pre-extracted content from project root data folder
        data_path = Path(__file__).parent.parent.parent / "data" / f"extracted_text_{source}.json"
        
        if not data_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"No extracted content found for source: {source}"
            )
        
        with open(data_path, 'r', encoding='utf-8') as f:
            pages = json.load(f)
        
        content = "\n\n".join([page['content'] for page in pages])
        
        # Map question types to backend format
        type_mapping = {
            "short_answers": "short_answer",
            "short answers": "short_answer",
            "mcq": "mcq",
            "structured": "long_answer",  # structured maps to long answer format
            "essay": "long_answer",
        }
        
        mapped_type = type_mapping.get(question_type.lower(), "mixed")
        
        # Generate questions using Gemini
        result = self.gemini_service.generate_questions(
            content=content,
            num_questions=num_questions,
            question_type=mapped_type,
            difficulty=difficulty
        )
        
        # Get subject name
        subject_names = {
            "dl": "Deep Learning",
            "da": "Data Analytics",
            "ime": "Innovation & Entrepreneurship"
        }
        subject_name = subject_names.get(source, source.upper())
        
        # Transform to the expected format for ModelPaperSetupPage
        questions = []
        if "questions" in result and result["questions"]:
            for q in result["questions"]:
                question_item = {"q": q.get("question", "")}
                
                # For MCQ type, include the options and correct answer
                if question_type.lower() == "mcq" and q.get("options"):
                    question_item["options"] = q.get("options", [])
                    question_item["correct_answer"] = q.get("correct_answer", "")
                    question_item["explanation"] = q.get("explanation", "")
                
                # For structured type, add parts from long_answer questions
                if question_type.lower() == "structured" and q.get("type") == "long_answer":
                    question_item["parts"] = [
                        "(a) Explain the concept.",
                        "(b) Give an example.",
                        "(c) Mention any limitations or considerations."
                    ]
                questions.append(question_item)
        
        return {
            "title": f"{subject_name} - Model Paper",
            "meta": {
                "topic": topic,
                "difficulty": difficulty.capitalize(),
                "type": question_type.replace("_", " ").title(),
                "count": len(questions)
            },
            "questions": questions
        }