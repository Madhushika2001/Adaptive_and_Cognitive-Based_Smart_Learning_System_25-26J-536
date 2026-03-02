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
5. For Short Answer and Long Answer questions, provide a comprehensive correct answer/model answer
6. For ALL question types, provide a brief explanation of the answer (why this is correct)
7. Include difficulty level for each question (easy, medium, hard)

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
            "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],  // Only for MCQ and True/False
            "correct_answer": "The correct answer (or key points for short/long answers)",
            "explanation": "Brief explanation of why this is the correct answer",
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
    
    def evaluate_answer(
        self,
        question: str,
        user_answer: str,
        model_answer: str,
        question_type: str = "short_answer",
        topic: str = "General"
    ) -> Dict:
        """Evaluate a user's answer against the model answer using LLM"""
        
        prompt = f"""You are an expert educator and evaluator. Your task is to evaluate a student's answer to a {question_type} question.

QUESTION: {question}

TOPIC: {topic}

STUDENT'S ANSWER:
{user_answer}

MODEL/CORRECT ANSWER:
{model_answer}

Your task:
1. Compare the student's answer with the model answer
2. Identify key concepts that were covered or missed
3. Assess the accuracy and completeness
4. Provide constructive feedback
5. Suggest improvements

Evaluation Criteria:
- For short answer questions: Check if the core concept is correctly explained
- For essay questions: Check for structure, depth, evidence, and argumentation
- For structured questions: Evaluate the overall quality while acknowledging multiple parts exist

Provide your evaluation in the following JSON format:

{{
    "score": <integer between 0-100>,
    "feedback": "<detailed feedback on the answer>",
    "strengths": [
        "<what the student did well>"
    ],
    "areas_for_improvement": [
        "<specific areas to improve>"
    ],
    "key_points_missed": [
        "<important concepts not mentioned>"
    ],
    "suggested_improvements": "<actionable suggestions for better answer>",
    "comparison_with_model_answer": "<how the student answer compares to the model answer>",
    "overall_assessment": "<summary of the evaluation>"
}}

Note:
- Be encouraging and constructive
- Focus on learning outcomes
- Highlight what they got right
- Provide specific guidance for improvement
- Score should reflect understanding level (90-100: Excellent, 70-89: Good, 50-69: Satisfactory, 30-49: Needs Improvement, 0-29: Insufficient)

Provide the evaluation in JSON format:"""
        
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            return self._parse_response_evaluation(response.text)
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")
    
    def evaluate_structured_answer(
        self,
        question: str,
        part_a_user: str,
        part_a_model: str,
        part_b_user: str,
        part_b_model: str,
        part_c_user: str,
        part_c_model: str,
        topic: str = "General"
    ) -> Dict:
        """Evaluate a structured answer with parts (a), (b), (c) separately"""
        
        prompt = f"""You are an expert educator evaluating a structured question with three parts.

QUESTION: {question}

TOPIC: {topic}

===== PART (A) =====
STUDENT'S ANSWER:
{part_a_user}

MODEL ANSWER:
{part_a_model}

===== PART (B) =====
STUDENT'S ANSWER:
{part_b_user}

MODEL ANSWER:
{part_b_model}

===== PART (C) =====
STUDENT'S ANSWER:
{part_c_user}

MODEL ANSWER:
{part_c_model}

Evaluate each part separately and provide overall feedback. Provide response in the following JSON format:

{{
    "part_a": {{
        "score": <0-100>,
        "feedback": "<specific feedback for part a>",
        "status": "excellent|good|satisfactory|needs_improvement|insufficient"
    }},
    "part_b": {{
        "score": <0-100>,
        "feedback": "<specific feedback for part b>",
        "status": "excellent|good|satisfactory|needs_improvement|insufficient"
    }},
    "part_c": {{
        "score": <0-100>,
        "feedback": "<specific feedback for part c>",
        "status": "excellent|good|satisfactory|needs_improvement|insufficient"
    }},
    "overall_score": <average of three parts 0-100>,
    "overall_feedback": "<comprehensive feedback on all three parts>",
    "strengths": ["<what the student did well>"],
    "areas_for_improvement": ["<areas needing work>"],
    "key_points_missed": ["<important concepts not covered>"]
}}

Provide the evaluation in JSON format:"""
        
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            return self._parse_structured_evaluation(response.text)
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")
    
    def _parse_response_evaluation(self, response_text: str) -> Dict:
        """Parse the evaluation response from Gemini"""
        import json
        import re
        
        try:
            # Find JSON in the response
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                result = json.loads(json_match.group())
                # Ensure score is an integer
                if "score" in result and isinstance(result["score"], str):
                    result["score"] = int(result["score"])
                return result
        except (json.JSONDecodeError, ValueError):
            pass
        
        # If parsing fails, return structured error response
        return {
            "score": 0,
            "feedback": response_text,
            "raw_response": response_text,
            "error": "Could not parse structured evaluation response"
        }
    
    def _parse_structured_evaluation(self, response_text: str) -> Dict:
        """Parse the structured question evaluation response from Gemini"""
        import json
        import re
        
        try:
            # Find JSON in the response
            json_match = re.search(r'\{[\s\S]*\}', response_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                # Ensure scores are integers
                for part in ["part_a", "part_b", "part_c"]:
                    if part in result and "score" in result[part]:
                        if isinstance(result[part]["score"], str):
                            result[part]["score"] = int(result[part]["score"])
                if "overall_score" in result and isinstance(result["overall_score"], str):
                    result["overall_score"] = int(result["overall_score"])
                return result
        except (json.JSONDecodeError, ValueError):
            pass
        
        # If parsing fails, return structured error response
        return {
            "overall_score": 0,
            "overall_feedback": response_text,
            "raw_response": response_text,
            "error": "Could not parse structured evaluation response"
        }