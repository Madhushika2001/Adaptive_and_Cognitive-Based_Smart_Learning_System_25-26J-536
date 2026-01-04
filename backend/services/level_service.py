# backend/services/level_service.py
import json

def calculate_level(confidence: int, mcq_score: int):
    if mcq_score == 0:
        return "Beginner"

    if mcq_score == 1:
        return "Beginner" if confidence <= 2 else "Intermediate"

    if mcq_score == 2:
        return "Intermediate"

    if mcq_score == 3:
        return "Advanced" if confidence >= 4 else "Intermediate"
