from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings

from routes.questions import router as questions_router
from routes.adaptive import router as adaptive_router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="API for generating questions and model papers from lecture notes using Gemini AI",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(questions_router)
app.include_router(adaptive_router)

@app.get("/")
async def root():
    return {
        "message": "Model Paper Generator API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}