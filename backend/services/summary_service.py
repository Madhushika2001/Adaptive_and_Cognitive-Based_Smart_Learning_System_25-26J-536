import os
import google.generativeai as genai
from dotenv import load_dotenv
from services.backup_content import get_dynamic_summary_fallback

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

async def generate_summary(module: str, lecture: str, topic: str, user_level: str = "Intermediate", lecture_content: str = ""):
    truncated_text = lecture_content[:15000] if len(lecture_content) > 15000 else lecture_content
    
    level_instruction = ""
    if user_level.lower() == "beginner":
        level_instruction = """
        Assume the student has ZERO prior knowledge.
        1. Start with a very basic, welcoming introduction to the concept.
        2. Explain every term step-by-step.
        3. Use simple, non-technical language and short sentences.
        4. Use relatable real-world analogies (e.g., comparing a Database to a digital filing cabinet).
        5. Clearly explain WHY this concept is important in daily life or simple terms.
        6. Highlight core definitions using <b> tags.
        """
    elif user_level.lower() == "advanced":
        level_instruction = """
        Assume the student has a STRONG foundation.
        1. Provide deep, analytical, and highly technical explanations.
        2. Use professional industry terminology without over-simplifying.
        3. Discuss complex relationships, underlying architectures, and performance trade-offs.
        4. Include insights on 'Industry Standards' or 'Enterprise Implementation' strategies.
        5. Highlight technical jargon and advanced mechanisms using <b> tags.
        """
    else:  # Intermediate
        level_instruction = """
        Assume the student understands the basics.
        1. Provide moderate technical explanations with structured paragraphs and bullet points.
        2. Focus on the relationships between key concepts and their practical benefits.
        3. Use standard university-level terminology.
        4. Highlight important terms using <b> tags.
        """

    prompt = f"""
    You are an expert academic professor. 
    Generate a highly detailed and level-appropriate summary for the topic: "{topic}" based on the lecture notes below.
    
    Target Level: {user_level}
    Instructions: {level_instruction}
    
    Lecture Content:
    {truncated_text}
    
    CRITICAL RESTRICTION 1: Output ONLY the raw HTML paragraph text. Do not add conversational filler.
    CRITICAL RESTRICTION 2: The "Lecture Content" above is your primary blueprint. You MUST include all major concepts mentioned there.
    KNOWLEDGE EXPANSION: You ARE ENCOURAGED to draw from your own extensive internal knowledge to provide deeper academic definitions, historical context, and technical explanations for the terms found in the lecture. Do not hallucinate unrelated topics, but make the explanation much more profound and comprehensive than the brief lecture notes.
    """

    try:
        # Standardize model version
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        print(f"   [Gemini] Generating summary for topic: {topic}...")
        response = await model.generate_content_async(prompt)
        
        content = response.text.strip()
        print(f"   [Gemini] Summary generated. Length: {len(content)}")
        
        return {"summary": content}

    except Exception as e:
        print(f"\n[!!!] GEMINI SUMMARY ERROR: {e}")
        return {"summary": get_dynamic_summary_fallback(lecture_content)}
