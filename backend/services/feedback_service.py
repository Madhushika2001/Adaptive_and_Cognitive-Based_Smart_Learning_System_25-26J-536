import json
import urllib.request
import asyncio

async def generate_feedback(lecture_content: str, quiz_results: list):
    """
    Generates personalized feedback based on MCQ performance using local Ollama.
    quiz_results: list of dicts with {'question', 'user_answer', 'correct_answer', 'is_correct'}
    """

    total = len(quiz_results)
    correct = sum(1 for r in quiz_results if r.get('is_correct'))
    score_pct = (correct / total) * 100 if total > 0 else 0
    
    level = "Needs Improvement"
    if score_pct >= 80:
        level = "Strong Understanding"
    elif score_pct >= 60:
        level = "Moderate Understanding"
        
    wrong_questions = [r for r in quiz_results if not r.get('is_correct')]
    right_questions = [r for r in quiz_results if r.get('is_correct')]

    prompt = f"""
    You are an Adaptive Learning Specialist. 

    USER STATS:
    - Score: {correct}/{total} ({score_pct:.1f}%)
    - Level: {level}
    
    QUESTIONS THEY GOT RIGHT:
    {json.dumps(right_questions)}
    
    QUESTIONS THEY MISSED:
    {json.dumps(wrong_questions)}

    LECTURE REFERENCE:
    {lecture_content[:1500]}

    YOUR TASK:
    Generate a highly accurate, interactive educational report in EXACTLY this HTML structure. Do not deviate. Provide specific explanations based on the lecture and the questions.

    <b>1. Overall Performance</b>
    <p>Score: {correct} / {total} ({score_pct:.1f}%)<br>Performance Level: {level}<br>
    [Write a 2-sentence summary of their performance.]</p>

    <b>2. Grip Strength (Strong Areas)</b>
    <ul>
    <li>[Brief summary of a concept they got right]</li>
    <li>[Brief summary of another concept they got right]</li>
    </ul>
    <p>[Write a 2-sentence explanation of why they are strong here.]</p>

    <b>3. Knowledge Gaps (Weak Areas)</b>
    <ul>
    <li>[Brief summary of a missed concept]</li>
    </ul>
    <p>[Write a 2-sentence explanation of what they misunderstood.]</p>

    <b>4. Question-Level Feedback</b>
    <ul>
    <li>Question 1: Correct/Incorrect - [1 sentence explaining why their answer was right/wrong based on the lecture.]</li>
    <li>Question 2: Correct/Incorrect - [Explanation...]</li>
    </ul>

    <b>5. Improvement Suggestions</b>
    <ul>
    <li>[Actionable advice 1]</li>
    <li>[Actionable advice 2]</li>
    </ul>
    <p>[1 concluding sentence of encouragement.]</p>

    RULES:
    - Base your feedback strictly on the provided questions and lecture content.
    - Only output the EXACT HTML structure provided above. No markdown, no ```html.
    """

    def fetch_ollama():
        url = "http://localhost:11434/api/generate"

        data = json.dumps({
            "model": "llama3",
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": 700,      
                "temperature": 0.3
            }
        }).encode('utf-8')
        
        req = urllib.request.Request(
            url,
            data=data,
            headers={'Content-Type': 'application/json'}
        )

        try:
            with urllib.request.urlopen(req, timeout=120) as response:
                result = json.loads(response.read().decode('utf-8'))
                return result.get("response", "").strip()
        except Exception as e:
            print(f"OLLAMA HTTP ERROR: {e}")
            return None

    try:
        response_text = await asyncio.to_thread(fetch_ollama)
        if response_text and "<b>" in response_text:
            return {"feedback": response_text}
        raise Exception("Invalid or empty response from Ollama")
    except Exception as e:
        print(f"OLLAMA FEEDBACK GENERATION ERROR: {e}")
        
        # Build an EXACT replica of the requested format as a dynamically generated fallback
        q_feedback = ""
        for i, q in enumerate(quiz_results):
            status = "Correct" if q.get("is_correct") else "Incorrect"
            icon = "✔" if q.get("is_correct") else "✘"
            detail = f"You correctly understood this concept." if q.get("is_correct") else f"The correct answer was: {q.get('correct_answer')}."
            q_feedback += f"<li>{icon} Question {i+1}: {status}<br><span style='font-size: 0.9em; color: #555;'>{detail}</span></li>\n"

        strong_areas = "".join([f"<li>Understood concept from: <i>{q.get('question')}</i></li>" for q in right_questions[:2]])
        if not strong_areas: strong_areas = "<li>Basic foundational concepts introduced in the lecture.</li>"
        
        weak_areas = "".join([f"<li>Missed concept from: <i>{q.get('question')}</i></li>" for q in wrong_questions[:2]])
        if not weak_areas: weak_areas = "<li>Advanced topic applications and edge cases.</li>"
        
        actions = "".join([f"<li>Review the lecture section explaining: <b>{q.get('correct_answer')}</b></li>" for q in wrong_questions[:2]])
        if not actions: actions = "<li>Practice with additional materials to maintain your strong understanding.</li>"

        fallback_html = f"""
        <b>1. Overall Performance</b>
        <p>Score: {correct} / {total} ({score_pct:.1f}%)<br>
        Performance Level: <b>{level}</b><br>
        You answered {correct} out of {total} questions correctly. This shows a {level.lower()} of the lecture content. Some concepts are clear, but a few areas need more attention.</p>

        <b>2. Grip Strength (Strong Areas)</b>
        <ul>
        {strong_areas}
        </ul>
        <p>Your answers show a good grasp of these areas. This indicates you understand the main idea of these topics and can apply them correctly.</p>

        <b>3. Knowledge Gaps (Weak Areas)</b>
        <ul>
        {weak_areas}
        </ul>
        <p>You missed these questions. This suggests that the concept may not be fully clear. Reviewing these sections would help strengthen your understanding.</p>

        <b>4. Question-Level Feedback</b>
        <ul style="list-style-type: none; padding-left: 0; line-height: 1.8;">
        {q_feedback}
        </ul>

        <b>5. Improvement Suggestions</b>
        <ul>
        {actions}
        </ul>
        <p>To improve your performance, revisit the recommended lecture content and practice more questions on that concept. This will help close the identified knowledge gaps.</p>
        """
        
        return {"feedback": fallback_html}
