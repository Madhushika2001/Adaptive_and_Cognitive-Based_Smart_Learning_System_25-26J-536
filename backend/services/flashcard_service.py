import json
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

async def generate_flashcards(topic: str, lecture_content: str, user_level: str = "Intermediate"):
    truncated_text = lecture_content[:10000] if len(lecture_content) > 10000 else lecture_content
    
    count = 6
    level_instruction = "Provide clear definitions and explain concept relationships."
    if user_level.lower() == "beginner":
        count = 5
        level_instruction = "Focus purely on essential core definitions. Use extremely simple language and analogies. Avoid theoretical depth."
    elif user_level.lower() == "advanced":
        count = 8
        level_instruction = "Provide technical, high-density definitions. Focus on conceptual understanding, critical thinking and advanced edge-cases."

    prompt = f"""
    You are an expert tutor. 
    Generate exactly {count} level-appropriate flashcards for the topic: "{topic}" based on the lecture notes below.
    
    Level: {user_level}
    Instruction: {level_instruction}
    
    Rules:
    - Return ONLY valid JSON array of objects.
    - STRUCTURE: {{"front": "Short Concept or Question", "back": "Concise Definition or Answer"}}
    - FRONT RULE: Keep the "front" as a short term or question (under 10 words).
    - BACK RULE: Tailor the explanation depth to the user's level. (under 35 words).
    
    Format:
    [
      {{"front": "Cloud Scalability", "back": "The ability to increase or decrease IT resources as needed."}}
    ]
    
    Lecture Content:
    {truncated_text}
    """

    try:
        # Standardize model version
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        print(f"   [Gemini] Generating flashcards for topic: {topic}...")
        response = await model.generate_content_async(
            prompt, 
            generation_config={"response_mime_type": "application/json"}
        )
        
        content = response.text.strip()
        print(f"   [Gemini] Flashcards generated: {content[:100]}...")
        
        return json.loads(content)
    except Exception as e:
        print(f"\n[!!!] FLASHCARD ERROR: {e}")
        return [
            {"front": "Infrastructure as a Service (IaaS)", "back": "Provides virtualized computing resources over the internet."},
            {"front": "Platform as a Service (PaaS)", "back": "Provides a platform allowing customers to develop, run, and manage applications."},
            {"front": "Software as a Service (SaaS)", "back": "Software is licensed on a subscription basis and is centrally hosted."}
        ]
