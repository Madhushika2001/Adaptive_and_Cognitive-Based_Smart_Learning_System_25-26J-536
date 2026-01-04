from fastapi import APIRouter
from database import db

router = APIRouter()

@router.get("/modules")
def get_modules():
    modules = db.lectures.distinct("module")
    return modules
