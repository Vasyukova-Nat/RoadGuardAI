from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from ..services.ml_service import ml_service
from ..core.security import get_current_user
from ..models import models
from ..models.models import User
from ..schemas.schemas import ImageAnalysisResponse

router = APIRouter(prefix="/api", tags=["ml"])

@router.post("/analyze-image", response_model=ImageAnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Анализ изображения дороги для обнаружения дефектов"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Файл должен быть изображением")
    try:
        return await ml_service.analyze_image(file)
    except Exception as e:
        print(f"Ошибка анализа изображения: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка обработки изображения: {str(e)}")
        
