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
        1. Start with a very basic, welcoming introduction.
        2. Break down every concept into highly readable, bite-sized bullet points.
        3. DO NOT write dense paragraphs. Keep sentences short and punchy.
        4. Use relatable real-world analogies in a dedicated "### 💡 Analogy" section.
        5. Clearly explain WHY this concept is important in daily life.
        """
    elif user_level.lower() == "advanced":
        level_instruction = """
        Assume the student has a STRONG foundation.
        1. Provide deep, analytical, and highly technical explanations.
        2. Use professional industry terminology without over-simplifying.
        3. Structure the content with clear headers, bulleted lists for pros/cons, and technical trade-offs.
        4. Include a dedicated "### ⚙️ Enterprise Implementation" section for industry standards.
        5. DO NOT write a wall of text. Make it easily scannable for professionals.
        """
    else:  # Intermediate
        level_instruction = """
        Assume the student understands the basics.
        1. Provide structured technical explanations using clear headers and bullet points.
        2. Focus on the relationships between key concepts and practical benefits.
        3. DO NOT write dense paragraphs. Use concise, punchy lists.
        4. Include a "### 🛠️ Practical Application" section to show how it's used.
        """

    prompt = f"""
    You are an expert academic professor. 
    Generate a highly detailed and level-appropriate summary for the topic: "{topic}" based on the lecture notes below.
    
    Target Level: {user_level}
    Instructions: {level_instruction}
    
    Lecture Content:
    {truncated_text}
    
    CRITICAL RESTRICTION 1: STRICTLY FORBIDDEN HTML. Output MUST be pure Markdown. DO NOT include any HTML tags (e.g., <div>, <span>, <p>, <b>, <i>, <ul>, <ol>, <li>).
    CRITICAL RESTRICTION 2: Use Markdown headers (##, ###) for structure. DO NOT use HTML headings (<h1>, <h2>).
    CRITICAL RESTRICTION 3: Use Markdown lists (-) for bullet points. DO NOT use HTML list tags.
    CRITICAL RESTRICTION 4: Highlight important vocabulary by wrapping them in double asterisks for bolding, like this: **Concept Name**.
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
        return {"summary": f"<b>[DEBUG ERROR]</b> Gemini failed with error: {str(e)}"}
