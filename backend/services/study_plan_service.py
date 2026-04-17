import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

async def generate_study_plan(module: str, lecture: str, topic: str, user_level: str = "Intermediate", lecture_content: str = ""):
    truncated_text = lecture_content[:15000] if len(lecture_content) > 15000 else lecture_content
    
    level_instruction = ""
    if user_level.lower() == "beginner":
        level_instruction = "Pace the plan very slowly. Allocate more time for foundational reading and basic fundamental concepts. Break tasks into smaller, manageable chunks (10-15 mins)."
    elif user_level.lower() == "advanced":
        level_instruction = "Assume strong prior knowledge. Focus the plan on deep architectural concepts, enterprise applications, and complex problem-solving. Longer concentrated deep-work sessions (30-45 mins)."
    else:  # Intermediate
        level_instruction = "Provide a balanced pace. Mix theory reading with practical conceptual review sessions (20-25 mins)."

    prompt = f"""
    You are an expert academic planner.
    Based on the lecture notes below, generate a highly accurate, personalized multi-day Study Plan for the topic: "{topic}".
    
    Target Level: {user_level}
    Instructions: {level_instruction}
    
    Lecture Content:
    {truncated_text}
    
    CRITICAL RESTRICTION 1: You must output ONLY valid, parseable JSON. Do not include markdown code blocks around the JSON (no ```json). Do not add any conversational text.
    CRITICAL RESTRICTION 2: The plan should span between 3 to 7 days, depending on the topic's expected complexity for the {user_level} level.
    CRITICAL RESTRICTION 3 (ACCURACY): The returned tasks MUST strictly reflect the actual sub-topics, definitions, and concepts found in the provided "Lecture Content". Do not write generic tasks. Specify exactly which concept they should review on each day.
    
    Output Format (JSON):
    {{
        "overview": "A brief encouraging overview of the study journey for this topic.",
        "total_days": 3,
        "plan": [
            {{
                "day": 1,
                "title": "Day title/theme (e.g., Foundations)",
                "tasks": [
                    {{
                        "description": "Specific actionable task",
                        "duration": "15m",
                        "type": "read"  // must be one of: read, practice, review, quiz
                    }}
                ]
            }}
        ]
    }}
    """

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        print(f"   [Gemini] Generating study plan for topic: {topic}...")
        response = await model.generate_content_async(prompt)
        
        content = response.text.strip()
        
        # Try to parse the JSON string, removing markdown wrappers if model hallucinated them
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            try:
                parsed = json.loads(json_match.group(0))
                return parsed
            except json.JSONDecodeError as e:
                print(f"[!!!] GEMINI STUDY PLAN JSON ERROR: {e}")
                
        return {
            "overview": "We couldn't generate a structured plan right now.",
            "total_days": 1,
            "plan": [
                {
                    "day": 1,
                    "title": "General Review",
                    "tasks": [
                        {"description": "Review the lecture notes generated for you.", "duration": "30m", "type": "read"}
                    ]
                }
            ]
        }

    except Exception as e:
        print(f"\n[!!!] GEMINI STUDY PLAN ERROR: {e}")
        return {
            "error": "Failed to generate study plan."
        }
