import os
import json
from dotenv import load_dotenv
from openai import OpenAI

# =====================================================
# LOAD ENV
# =====================================================
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# =====================================================
# CENTRAL LLM CALL
# =====================================================
def call_llm(prompt: str, max_tokens: int = 400) -> str:
    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt,
        max_output_tokens=max_tokens
    )
    return response.output_text.strip()


# =====================================================
# LEVEL ADAPTATION LOGIC (CORE PART)
# =====================================================
def get_level_instruction(level: str) -> str:
    level = level.lower()

    if level == "beginner":
        return (
            "Explain in very simple language. "
            "Use analogies, real-world examples, and step-by-step explanations. "
            "Avoid technical jargon. Be very descriptive."
        )

    elif level == "intermediate":
        return (
            "Explain clearly with moderate technical depth. "
            "Use structured bullet points and brief examples."
        )

    else:  # Advanced
        return (
            "Explain concisely and technically. "
            "Assume prior knowledge. "
            "Avoid basic definitions and keep it short."
        )


def get_max_tokens(level: str) -> int:
    level = level.lower()

    if level == "beginner":
        return 600
    elif level == "intermediate":
        return 350
    else:
        return 200


# =====================================================
# MCQs (LEVEL-INDEPENDENT)
# =====================================================
def generate_mcqs(topic: str):
    prompt = f"""
Generate EXACTLY 3 multiple choice questions for the topic "{topic}".

Rules:
- Each question must have exactly 4 options
- Only ONE correct answer
- Output MUST be valid JSON
- Do NOT include explanations

Format:
[
  {{
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correct": 1
  }}
]
"""
    response = call_llm(prompt, max_tokens=300)
    return json.loads(response)


# =====================================================
# SUMMARY (LEVEL-AWARE)
# =====================================================
def generate_summary(topic: str, level: str):
    instruction = get_level_instruction(level)
    max_tokens = get_max_tokens(level)

    prompt = f"""
Topic: {topic}

Instruction:
{instruction}

Generate a study summary appropriate for the learner level.
"""
    return call_llm(prompt, max_tokens=max_tokens)


# =====================================================
# FLASHCARDS (LEVEL-AWARE)
# =====================================================
def generate_flashcards(topic: str, level: str):
    instruction = get_level_instruction(level)
    max_tokens = get_max_tokens(level)

    prompt = f"""
Topic: {topic}

Instruction:
{instruction}

Create 5 flashcards.

Rules:
- Beginner: include explanations in answers
- Advanced: keep answers short and precise
- Output MUST be valid JSON only

Format:
[
  {{
    "question": "...",
    "answer": "..."
  }}
]
"""
    return call_llm(prompt, max_tokens=max_tokens)


# =====================================================
# MIND MAP (LEVEL-AWARE)
# =====================================================
def generate_mindmap(topic: str, level: str):
    instruction = get_level_instruction(level)
    max_tokens = get_max_tokens(level)

    prompt = f"""
Topic: {topic}

Instruction:
{instruction}

Create a hierarchical mind map.

Rules:
- Beginner: more branches and subtopics
- Advanced: fewer, compact branches
- Output MUST be valid JSON only

Format:
{{
  "topic": "{topic}",
  "branches": [
    {{
      "title": "...",
      "subtopics": ["...", "..."]
    }}
  ]
}}
"""
    return call_llm(prompt, max_tokens=max_tokens)
