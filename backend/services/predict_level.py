import joblib

model = joblib.load("model/personalization_model.pkl")
le = joblib.load("model/label_encoder2.pkl")

def predict_level(confidence, quiz_score, time_spent):
    pred = model.predict([[confidence, quiz_score, time_spent]])
    return le.inverse_transform(pred)[0]
