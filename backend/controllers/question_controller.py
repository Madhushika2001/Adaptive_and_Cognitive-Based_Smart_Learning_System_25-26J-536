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
        
        # Use Gemini to evaluate the answer
        result = self.gemini_service.evaluate_answer(
            question=question,
            user_answer=user_answer,
            model_answer=model_answer,
            question_type=question_type,
            topic=topic
        )
        
        return result
    
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
        
        return result