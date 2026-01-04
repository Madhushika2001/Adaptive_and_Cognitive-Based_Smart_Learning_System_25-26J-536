from fastapi import APIRouter
from backend.data.module_topics import module_topics

router = APIRouter(prefix="/catalog", tags=["Catalog"])

@router.get("/modules")
def get_modules():
    return list(module_topics.keys())

@router.get("/lectures/{module}")
def get_lectures(module: str):
    return list(module_topics.get(module, {}).keys())

@router.get("/topics/{module}/{lecture}")
def get_topics(module: str, lecture: str):
    return module_topics.get(module, {}).get(lecture, [])
