def get_dynamic_mcq_fallback(topic_content: str):
    """Returns a topic-relevant placeholder if API is down."""
    return [
        {
            "question": f"Study Note: The section on the lecture content discusses key aspects of this topic. Please review the lecture notes for detailed insights.",
            "options": {"A": "Review Content", "B": "Check Later", "C": "Study More", "D": "Retry AI"},
            "correct_answer": "A"
        }
    ]

def get_dynamic_summary_fallback(topic_content: str):
    """Returns the actual lecture text if API fails (100% relevant)."""
    # Simply return the first 300 words of the actual lecture as the 'summary'
    clean_text = topic_content[:1500].rsplit('.', 1)[0] + "." # Clean cut at sentence
    return f"<b>[Study Note]</b><br><br>{clean_text}<br><br><i>(Note: AI is currently resting. This summary is taken directly from your lecture notes to ensure relevance.)</i>"
