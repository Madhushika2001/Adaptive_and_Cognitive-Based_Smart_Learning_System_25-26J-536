from google import genai
from typing import List, Dict, Optional
from config import get_settings

class GeminiService:
    """Service for interacting with Gemini API"""
    
    def __init__(self):
        settings = get_settings()
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model = "gemini-2.5-flash"
    
    def generate_questions(
        self,
        content: str,
        num_questions: int = 10,
        question_type: str = "mixed",
        difficulty: str = "medium"
    ) -> Dict:
        """Generate questions from lecture content"""
        
        prompt = self._build_question_prompt(content, num_questions, question_type, difficulty)
        
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            return self._parse_response(response.text)
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")
    
    def _build_question_prompt(
        self,
        content: str,
        num_questions: int,
        question_type: str,
        difficulty: str
    ) -> str:
        """Build the prompt for question generation"""
        
        type_instructions = {
            "mcq": "Generate only Multiple Choice Questions (MCQ) with 4 options each.",
            "short_answer": "Generate only Short Answer Questions.",
            "long_answer": "Generate only Long Answer/Essay Questions.",
            "true_false": "Generate only True/False Questions.",
            "mixed": "Generate a mix of MCQ, Short Answer, Long Answer, and True/False questions."
        }
        
        difficulty_instructions = {
            "easy": "Questions should be basic and test fundamental understanding.",
            "medium": "Questions should be moderate, testing application of concepts.",
            "hard": "Questions should be challenging, requiring deep understanding and analysis."
        }
        
        prompt = f"""You are an expert educator and question paper generator. Based on the following lecture content, generate {num_questions} high-quality exam questions.

{type_instructions.get(question_type, type_instructions['mixed'])}
{difficulty_instructions.get(difficulty, difficulty_instructions['medium'])}

LECTURE CONTENT:
{content[:15000]}  # Limit content to avoid token limits

INSTRUCTIONS:
1. Generate exactly {num_questions} questions
2. Cover different topics from the content
3. For MCQ questions, provide 4 options (A, B, C, D) and indicate the correct answer
4. For True/False, provide the statement and the correct answer
5. Provide the correct answer for each question
6. Include a brief explanation for each answer

IMPORTANT STYLE RULES:
- Write questions directly without meta-references like "in the context of...", "according to the lecture...", "as discussed in..."
- Questions should be standalone and self-contained
- Do NOT reference the source material in the question text
- Write as if these are real exam questions, not questions about a document

OUTPUT FORMAT (JSON):
{{
    "questions": [
        {{
            "id": 1,
            "type": "mcq|short_answer|long_answer|true_false",
            "question": "The question text",
            "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],  // Only for MCQ
            "correct_answer": "The correct answer",
            "explanation": "Brief explanation",
            "difficulty": "easy|medium|hard",
            "topic": "Topic from the content"
        }}
    ],
    "total_questions": {num_questions},
    "source": "Lecture Notes"
}}

Generate the questions now:"""
        
        return prompt
    
    def _parse_response(self, response_text: str) -> Dict:
        """Parse the Gemini response"""
        import json
        import re
        
        # Try to extract JSON from the response
        try:
            # Find JSON in the response
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass
        
        # If parsing fails, return raw response
        return {
            "questions": [],
            "raw_response": response_text,
            "error": "Could not parse structured response"
        }
    
    def generate_model_paper(
        self,
        content: str,
        paper_config: Dict
    ) -> Dict:
        """Generate a complete model paper"""
        
        prompt = f"""You are an expert educator. Create a complete examination paper based on the following lecture content.

PAPER CONFIGURATION:
- Total Marks: {paper_config.get('total_marks', 100)}
- Duration: {paper_config.get('duration', '3 hours')}
- Sections: {paper_config.get('sections', 3)}
- MCQ Questions: {paper_config.get('mcq_count', 10)}
- Short Answer Questions: {paper_config.get('short_count', 5)}
- Long Answer Questions: {paper_config.get('long_count', 3)}

LECTURE CONTENT:
{content[:15000]}

IMPORTANT STYLE RULES:
- Write questions directly without meta-references like "in the context of...", "according to the lecture...", "as discussed in..."
- Questions should be standalone and self-contained
- Do NOT reference the source material in the question text
- Write as if these are real exam questions, not questions about a document

Create a well-structured examination paper with:
1. Clear instructions for each section
2. Mark distribution
3. Questions covering the entire syllabus
4. Answer key with explanations

OUTPUT FORMAT (JSON):
{{
    "paper_title": "Examination",
    "duration": "3 hours",
    "total_marks": 100,
    "instructions": ["List of general instructions"],
    "sections": [
        {{
            "section_name": "Section A - Multiple Choice",
            "marks_per_question": 1,
            "total_marks": 10,
            "instructions": "Section specific instructions",
            "questions": [...]
        }}
    ],
    "answer_key": [...]
}}

Generate the examination paper:"""
        
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            return self._parse_response(response.text)
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")