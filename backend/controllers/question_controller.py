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
    
    def _backend_root(self) -> Path:
        """
        Returns backend root directory.

        controllers/question_controller.py -> parents[1] -> backend/
        """
        return Path(__file__).resolve().parents[1]

    def _load_stored_content(self, source: str) -> str:
        """
        Loads extracted text JSON and returns combined content.
        Looks for: backend/data/extracted_text_{source}.json
        """
        data_path = self._backend_root() / "data" / f"extracted_text_{source}.json"

        if not data_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"No extracted content found for source: {source}. Expected file at: {data_path}"
            )

        try:
            with open(data_path, "r", encoding="utf-8") as f:
                pages = json.load(f)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to read extracted content file: {data_path}. Error: {str(e)}"
            )

        # Support both {"content": "..."} and {"output": "..."} just in case
        content_parts = []
        for page in pages:
            if isinstance(page, dict):
                content_parts.append(page.get("content") or page.get("output") or "")
            else:
                content_parts.append(str(page))

        content = "\n\n".join([c for c in content_parts if c.strip()])

        if not content.strip():
            raise HTTPException(
                status_code=400,
                detail=f"Extracted content file exists but is empty: {data_path}"
            )

        return content
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
        content = self._load_stored_content(source)
        
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
            content = self._load_stored_content(source)
        
        result = self.gemini_service.generate_model_paper(
            content=content,
            paper_config=config.model_dump()
        )
        
        # Log answer field presence for debugging
        if "questions" in result:
            print(f"\n🔍 DEBUG: Checking answer fields in generated paper:")
            print(f"Total questions: {len(result['questions'])}")
            for i, q in enumerate(result['questions'][:3]):  # Check first 3
                has_answer = "answer" in q
                has_correct_answer = "correct_answer" in q
                q_type = q.get("type", "unknown")
                print(f"  Q{i+1} ({q_type}): answer={has_answer}, correct_answer={has_correct_answer}")
        
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
        content = self._load_stored_content(source)
        
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
        
        # Get subject name and recommended resources
        subject_names = {
            "dl": "Deep Learning",
            "da": "Data Analytics",
            "ime": "Innovation & Entrepreneurship"
        }
        subject_name = subject_names.get(source, source.upper())
        
        # Generate recommended resources based on topic and source
        recommended_resources = self._get_recommended_resources(source, topic)
        
        # Transform to the expected format for ModelPaperSetupPage
        questions = []
        if "questions" in result and result["questions"]:
            for q in result["questions"]:
                question_item = {"q": q.get("question", "")}
                
                # Include answer and explanation for ALL question types
                if q.get("correct_answer"):
                    question_item["answer"] = q.get("correct_answer", "")
                
                if q.get("explanation"):
                    question_item["explanation"] = q.get("explanation", "")
                
                # For MCQ type, include the options
                if question_type.lower() == "mcq" and q.get("options"):
                    question_item["options"] = q.get("options", [])
                    question_item["correct_answer"] = q.get("correct_answer", "")
                
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
            "questions": questions,
            "recommended_resources": recommended_resources
        }
    
    def _get_recommended_resources(self, source: str, topic: str) -> dict:
        """Get recommended learning resources for the given source and topic"""
        
        resources_map = {
            "dl": {
                "general": [
                    {
                        "title": "Deep Learning by Ian Goodfellow, Yoshua Bengio, and Aaron Courville",
                        "type": "Textbook",
                        "url": "https://www.deeplearningbook.org/",
                        "description": "Comprehensive textbook covering fundamentals and advanced topics in deep learning"
                    },
                    {
                        "title": "Fast.ai - Practical Deep Learning for Coders",
                        "type": "Course",
                        "url": "https://www.fast.ai/",
                        "description": "Free practical deep learning course with hands-on projects"
                    },
                    {
                        "title": "Stanford CS231n: Convolutional Neural Networks",
                        "type": "Course",
                        "url": "http://cs231n.stanford.edu/",
                        "description": "Comprehensive course on computer vision and deep learning"
                    },
                    {
                        "title": "TensorFlow Documentation",
                        "type": "Documentation",
                        "url": "https://www.tensorflow.org/",
                        "description": "Official TensorFlow library documentation and tutorials"
                    },
                    {
                        "title": "PyTorch Documentation",
                        "type": "Documentation",
                        "url": "https://pytorch.org/",
                        "description": "Official PyTorch library documentation and tutorials"
                    }
                ],
                "Neural Networks": [
                    {
                        "title": "Neural Networks from Scratch",
                        "type": "Tutorial",
                        "url": "https://nnfs.io/",
                        "description": "Learn how to build neural networks from scratch with Python"
                    },
                    {
                        "title": "3Blue1Brown - Neural Networks Playlist",
                        "type": "Video",
                        "url": "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_LFPM5gQa",
                        "description": "Excellent visual introduction to neural networks and backpropagation"
                    },
                    {
                        "title": "Backpropagation Explained",
                        "type": "Tutorial",
                        "url": "https://colah.github.io/posts/2015-08-Backprop/",
                        "description": "Clear explanation of the backpropagation algorithm"
                    }
                ],
                "Convolutional Neural Networks": [
                    {
                        "title": "A Comprehensive Guide to Convolutional Neural Networks",
                        "type": "Blog",
                        "url": "https://towardsdatascience.com/",
                        "description": "Collection of articles and tutorials on CNNs for computer vision"
                    },
                    {
                        "title": "ImageNet Classification with Deep Convolutional Networks",
                        "type": "Research Paper",
                        "url": "https://papers.nips.cc/",
                        "description": "The AlexNet paper that revolutionized computer vision"
                    }
                ],
                "Recurrent Neural Networks": [
                    {
                        "title": "Understanding LSTM Networks",
                        "type": "Blog",
                        "url": "https://colah.github.io/posts/2015-08-Understanding-LSTMs/",
                        "description": "Excellent explanation of LSTM and RNN architectures"
                    },
                    {
                        "title": "The Unreasonable Effectiveness of Recurrent Neural Networks",
                        "type": "Blog",
                        "url": "https://karpathy.github.io/2015/05/21/rnn-effectiveness/",
                        "description": "Practical guide to using RNNs for various sequence tasks"
                    }
                ]
            },
            "da": {
                "general": [
                    {
                        "title": "Python for Data Analysis",
                        "type": "Textbook",
                        "url": "https://wesmckinney.com/book/",
                        "description": "Essential resource for data analysis with Python and pandas"
                    },
                    {
                        "title": "Kaggle Learn - Micro Courses",
                        "type": "Course",
                        "url": "https://www.kaggle.com/learn",
                        "description": "Free short courses on data analysis and machine learning"
                    },
                    {
                        "title": "Google Analytics Academy",
                        "type": "Course",
                        "url": "https://analytics.google.com/analytics/academy/",
                        "description": "Free courses on data analytics and measurement"
                    }
                ]
            },
            "ime": {
                "general": [
                    {
                        "title": "The Lean Startup",
                        "type": "Book",
                        "url": "https://www.theleanstartup.com/",
                        "description": "Essential resource for understanding startup methodology"
                    },
                    {
                        "title": "Business Model Canvas",
                        "type": "Framework",
                        "url": "https://www.businessmodelgeneration.com/",
                        "description": "Tool for developing new or documenting existing business models"
                    }
                ]
            }
        }
        
        # Get subject-specific or general resources
        subject_resources = resources_map.get(source, {})
        topic_resources = subject_resources.get(topic, [])
        general_resources = subject_resources.get("general", [])
        
        # Combine topic-specific and general resources
        combined_resources = topic_resources + general_resources
        
        return {
            "topic": topic,
            "resources": combined_resources[:10]  # Limit to 10 resources
        }
    
    async def evaluate_answer(
        self,
        question: str,
        user_answer: str,
        model_answer: str,
        question_type: str = "short_answer",
        topic: str = "General"
    ):
        """Evaluate a user's answer against the model answer using LLM"""
        
        if not question or not user_answer or not model_answer:
            raise HTTPException(
                status_code=400,
                detail="Question, user answer, and model answer are required"
            )
        
        print(f"\n📝 Backend: Evaluating {question_type} answer for topic: {topic}")
        print(f"Question: {question[:100]}...")
        print(f"User answer length: {len(user_answer)} chars")
        print(f"Model answer length: {len(model_answer)} chars")
        
        try:
            # Use Gemini to evaluate the answer
            result = self.gemini_service.evaluate_answer(
                question=question,
                user_answer=user_answer,
                model_answer=model_answer,
                question_type=question_type,
                topic=topic
            )
            
            print(f"✅ Evaluation result: {result}")
            return result
        except Exception as e:
            print(f"❌ Error during evaluation: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Evaluation error: {str(e)}"
            )
    
    async def evaluate_structured_answer(
        self,
        question: str,
        part_a_user: str,
        part_a_model: str,
        part_b_user: str,
        part_b_model: str,
        part_c_user: str,
        part_c_model: str,
        topic: str = "General"
    ):
        """Evaluate a structured answer with parts (a), (b), (c) separately"""
        
        if not question:
            raise HTTPException(
                status_code=400,
                detail="Question is required"
            )
        
        print(f"\n📝 Backend: Evaluating structured answer for topic: {topic}")
        print(f"Question: {question[:100]}...")
        print(f"Part A - User: {len(part_a_user)} chars, Model: {len(part_a_model)} chars")
        print(f"Part B - User: {len(part_b_user)} chars, Model: {len(part_b_model)} chars")
        print(f"Part C - User: {len(part_c_user)} chars, Model: {len(part_c_model)} chars")
        
        try:
            # Use Gemini to evaluate the structured answer
            result = self.gemini_service.evaluate_structured_answer(
                question=question,
                part_a_user=part_a_user,
                part_a_model=part_a_model,
                part_b_user=part_b_user,
                part_b_model=part_b_model,
                part_c_user=part_c_user,
                part_c_model=part_c_model,
                topic=topic
            )
            
            print(f"✅ Evaluation result: {result}")
            return result
        except Exception as e:
            print(f"❌ Error during evaluation: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Evaluation error: {str(e)}"
            )
    
    async def validate_submission(
        self,
        questions: list,
        paper_type: str,
        topic: str = "General"
    ):
        """Validate exam submission using LLM"""
        from schemas.question import ValidationError, SubmissionValidationResponse
        
        print(f"\n🔍 Validating submission for {paper_type} exam")
        print(f"Total questions: {len(questions)}")
        print(f"Topic: {topic}")
        
        errors = []
        warnings = []
        
        # Check each question
        for idx, q in enumerate(questions):
            q_text = q.get("q", "")
            q_type = q.get("type", "").lower()
            user_answer = q.get("user_answer", "").strip()
            model_answer = q.get("answer") or q.get("correct_answer", "")
            
            print(f"\n📋 Q{idx + 1} ({q_type}):")
            print(f"   User answer length: {len(user_answer)}")
            print(f"   Has model answer: {bool(model_answer)}")
            
            # Skip MCQ - they're validated in UI
            if q_type == "mcq":
                print(f"   ✅ MCQ - no validation needed")
                continue
            
            # Check if question was answered
            if not user_answer:
                error = ValidationError(
                    question_index=idx,
                    question_text=q_text[:100],
                    error_type="missing_answer",
                    severity="warning",
                    message="Question not answered"
                )
                warnings.append(error)
                print(f"   ⚠️ Not answered")
                continue
            
            # Check minimum length (at least 30 chars for short answers)
            if len(user_answer) < 30 and q_type in ["short_answer", "short_answers"]:
                error = ValidationError(
                    question_index=idx,
                    question_text=q_text[:100],
                    error_type="answer_too_short",
                    severity="warning",
                    message=f"Answer might be too brief ({len(user_answer)} chars, minimum recommended: 30)"
                )
                warnings.append(error)
                print(f"   ⚠️ Answer too short ({len(user_answer)} chars)")
                continue
            
            # For non-MCQ answers, use Gemini to check for key points
            if q_type in ["short_answer", "short_answers", "essay"] and model_answer:
                try:
                    print(f"   🔄 Using Gemini to validate content...")
                    
                    # Quick validation using Gemini
                    validation_result = await self._validate_answer_with_llm(
                        question=q_text,
                        user_answer=user_answer,
                        model_answer=model_answer,
                        question_type=q_type,
                        topic=topic
                    )
                    
                    if not validation_result.get("valid", True):
                        error = ValidationError(
                            question_index=idx,
                            question_text=q_text[:100],
                            error_type="answer_missing_key_points",
                            severity="warning",
                            message=validation_result.get("message", "Answer appears to be missing key concepts")
                        )
                        warnings.append(error)
                        print(f"   ⚠️ {validation_result.get('message', 'Validation warning')}")
                    else:
                        print(f"   ✅ Content validated")
                        
                except Exception as e:
                    print(f"   ⚠️ Could not validate with LLM: {str(e)}")
                    # Don't add error - validation is optional
        
        # Determine if submission can proceed
        can_proceed = len(errors) == 0
        is_valid = len(errors) + len(warnings) == 0
        
        summary = f"Submission check: {len(errors)} errors, {len(warnings)} warnings"
        if is_valid:
            summary = "✅ All answers validated successfully!"
        elif len(errors) > 0:
            summary = f"❌ Cannot proceed: {len(errors)} validation errors found"
        else:
            summary = f"⚠️ {len(warnings)} warnings found - you can still proceed"
        
        print(f"\n📊 Validation Summary: {summary}")
        
        return SubmissionValidationResponse(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings,
            summary=summary,
            can_proceed=can_proceed
        )
    
    async def _validate_answer_with_llm(
        self,
        question: str,
        user_answer: str,
        model_answer: str,
        question_type: str,
        topic: str
    ) -> dict:
        """Use LLM to validate if answer covers key concepts"""
        
        result = self.gemini_service.validate_answer_quality(
            question=question,
            user_answer=user_answer,
            model_answer=model_answer,
            question_type=question_type,
            topic=topic
        )
        
        return result