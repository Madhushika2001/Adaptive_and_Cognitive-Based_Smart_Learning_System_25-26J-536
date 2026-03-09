import json
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

async def generate_mindmap(topic_text: str, user_level: str = "Intermediate"):
    truncated_text = topic_text[:10000] if len(topic_text) > 10000 else topic_text
    
    node_count_instr = "Include 8-10 nodes showing standard conceptual relationships."
    if user_level.lower() == "beginner":
        node_count_instr = "Keep it extremely simple. Include only 5-8 essential core nodes so the beginner is not overwhelmed."
    elif user_level.lower() == "advanced":
        node_count_instr = "Be highly exhaustive. Include 12-18 nodes showing complex dependencies, underlying systems, and advanced sub-topics."

    prompt = f"""
    You are a technical architect.
    Generate a JSON mindmap for the topic based on this content. The complexity of the map must precisely match the user's level.
    
    User Level: {user_level}
    Requirement: {node_count_instr}
    
    Conceptual Guidelines:
    - Beginners: Only core terms from the lecture.
    - Intermediate: Terms and their direct relationships/benefits.
    - Advanced: Technical architecture, trade-offs, and specialized mechanisms.
    
    Rules:
    - Return ONLY valid JSON for a mindmap.
    - No node positions.
    - STRUCTURE: {{"nodes": [{{"id": "1", "label": "Topic Name"}}], "edges": [{{"id": "e1-2", "source": "1", "target": "2"}}]}}
    
    Lecture Content:
    {truncated_text}
    """

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = await model.generate_content_async(prompt, generation_config={"response_mime_type": "application/json"})
        
        content = response.text.strip()
        result = json.loads(content)
        
        nodes = result.get("nodes", [])
        if len(nodes) < 3:
            raise ValueError("LLM generated an incomplete graph.")
            
        return result

    except Exception as e:
        print(f"\n[!!!] GEMINI MINDMAP ERROR: {e}")
        return {
            "title": "Cloud Computing Infrastructure",
            "nodes": [
                {"id": "1", "label": "Cloud Computing"},
                {"id": "2", "label": "IaaS (Infrastructure)"},
                {"id": "3", "label": "PaaS (Platform)"},
                {"id": "4", "label": "SaaS (Software)"}
            ],
            "edges": [
                {"id": "e1-2", "source": "1", "target": "2"},
                {"id": "e1-3", "source": "1", "target": "3"},
                {"id": "e1-4", "source": "1", "target": "4"}
            ]
        }
