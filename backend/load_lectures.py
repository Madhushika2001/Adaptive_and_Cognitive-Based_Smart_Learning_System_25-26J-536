import os
from services.pdf_loader import extract_text
from database import db

BASE_PATH = os.path.join(os.path.dirname(__file__), "..", "LectureSlides")

for module in os.listdir(BASE_PATH):
    module_path = os.path.join(BASE_PATH, module)

    if not os.path.isdir(module_path):
        continue

    for pdf in os.listdir(module_path):
        if pdf.endswith(".pdf"):
            lecture = pdf.replace(".pdf", "")
            pdf_path = os.path.join(module_path, pdf)

            text = extract_text(pdf_path)

            db.lectures.insert_one({
                "module": module,
                "lecture": lecture,
                "content": text
            })

            print(f"Inserted {module} - {lecture}")
