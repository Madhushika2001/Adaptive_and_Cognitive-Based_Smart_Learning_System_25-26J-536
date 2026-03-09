from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path

class Settings(BaseSettings):
    app_name: str = "Model Paper Generator API"
    debug: bool = True
    gemini_api_key: str = ""

    # Data directories
    base_dir: Path = Path(__file__).parent
    data_dir: Path = Path(__file__).parent / "data"
    lectures_dir: Path = Path(__file__).parent / "data" / "lectures"
    papers_dir: Path = Path(__file__).parent / "data" / "papers"

    # Adaptive Learning Component — MongoDB
    mongodb_uri: str = ""
    mongodb_db_name: str = "adaptive_learning_gemini"

    class Config:
        env_file = ".env"
        extra = "ignore"   # silently ignore any env vars not declared above

@lru_cache()
def get_settings():
    return Settings()
