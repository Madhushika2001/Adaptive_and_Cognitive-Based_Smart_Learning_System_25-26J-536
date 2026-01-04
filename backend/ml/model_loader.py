import joblib
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

model = joblib.load(
    os.path.join(BASE_DIR, "model/personalization_model.pkl")
)

label_encoder = joblib.load(
    os.path.join(BASE_DIR, "model/label_encoder2.pkl")
)
