import json
import os
import google.generativeai as genai
from dotenv import load_dotenv
from services.backup_content import get_dynamic_mcq_fallback

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

async def generate_mcqs(topic_text: str, num_questions: int = 5, user_level: str = "Intermediate"):
    # Truncate text if needed
    truncated_text = topic_text[:10000] if len(topic_text) > 10000 else topic_text
    
    level_instruction = ""
    if user_level.lower() == "beginner":
        level_instruction = "Focus on the absolute basics, definitions, and core concepts. Keep language simple and introductory."
    elif user_level.lower() == "advanced":
        level_instruction = "Focus on advanced technical architecture, trade-offs, complex scenarios, and intricate mechanisms. Assume the user is an expert."
    else:
        level_instruction = "Focus on intermediate concepts, standard industry applications, and common architectural patterns."

    prompt = f"""
    You are an expert teacher. 
    Use the following "Lecture Content" as your primary blueprint to generate EXACTLY {num_questions} multiple choice questions (MCQs).
    
    Target Audience Level: {user_level}
    {level_instruction}
    
    CRITICAL: YOU MUST USE YOUR EXTERNAL KNOWLEDGE. Do not limit yourself to only what is written in the lecture. 
    
    Generate exactly 5 questions tailored to the {user_level} level.
    
    Rules:
    - 4 options (A, B, C, D)
    - Only one correct answer
    - CONCISENESS RULE: Each question and EACH option MUST NOT EXCEED 15 words. Keep them short and punchy so they fit in the UI.
    - Return ONLY a valid JSON array.
    CRITICAL REQUIREMENT: YOU MUST RETURN EXACTLY {num_questions} QUESTIONS. The JSON array must have a length of exactly {num_questions}.
    
    Format:
    [
      {{
        "question": "Question 1?", 
        "options": {{
          "A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"
        }},
        "correct_answer": "A"
      }},
      {{
        "question": "Question 2?", 
        "options": {{
          "A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"
        }},
        "correct_answer": "B"
      }},
      ... (Must continue until {num_questions} questions are generated)
    ]
    
    Lecture Content:
    {truncated_text}
    """

    safety_settings = [
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
    ]
    
    try:
        # Use a more available model version
        model = genai.GenerativeModel("gemini-2.5-flash", safety_settings=safety_settings)
        
        print(f"   [Gemini] Sending MCQ prompt for topic: {topic_text[:50]}...")
        response = await model.generate_content_async(
            prompt, 
            generation_config={"response_mime_type": "application/json"}
        )
        
        content = response.text.strip()
        print(f"   [Gemini] Received response length: {len(content)}")
        
        result = json.loads(content)
        
        if isinstance(result, list):
            return result[:num_questions]
        return result

    except Exception as e:
        print(f"\n[!!!] GEMINI MCQ ERROR: {e}")
        # Fallback to local content-based note if AI fails
        return get_dynamic_mcq_fallback(topic_text)
