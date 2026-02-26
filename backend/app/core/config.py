import os
from pathlib import Path

SECRET_KEY = os.getenv("SECRET_KEY", "secret-key-change-in-production")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", "refresh-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

MODEL_PATH = os.getenv("MODEL_PATH")
BASE_DIR = Path("/app")
if not MODEL_PATH:
    MODEL_PATH = str(BASE_DIR / "ml_module" / "roadguard_models" / "v2" / "weights" / "best.pt")