import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from ..schemas.schemas import ImageAnalysisResponse
# from ..services.ml_service import ml_service
from ..core.security import get_current_user
import shutil
from ..models import models
from ..schemas.schemas import DefectDetection, ImageAnalysisResponse
from tempfile import NamedTemporaryFile
from ..core.security import get_current_user
import torch
import torch.serialization
from ultralytics import YOLO
from ultralytics.nn.tasks import DetectionModel
from pathlib import Path
import contextlib
from ..core.config import MODEL_PATH

router = APIRouter(prefix="/api", tags=["ml"])

@contextlib.contextmanager
def disable_weights_only_check(): # безопасная загрузка нейросети
    torch.serialization.add_safe_globals([DetectionModel])
    original_load = torch.load
    def custom_load(*args, **kwargs):
        kwargs['weights_only'] = False
        return original_load(*args, **kwargs)
    torch.load = custom_load
    
    try:
        yield
    finally:
        torch.load = original_load

with disable_weights_only_check():
    if Path(MODEL_PATH).exists():
        model = YOLO(str(MODEL_PATH))
        print(f"Модель загружена!")
        ML_AVAILABLE = True
    else:
        print("Модель не найдена")
        model = None
        ML_AVAILABLE = False

def map_model_class_to_problem_type(class_name: str) -> str: # маппинг
    mapping = {
        'D00': 'long_crack',      
        'D10': 'transverse_crack', 
        'D20': 'alligator_crack', 
        'D40': 'pothole',         
    }
    return mapping.get(class_name, 'other')

@router.post("/analyze-image", response_model=ImageAnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    """Анализ изображения дороги для обнаружения дефектов"""
    if not ML_AVAILABLE or model is None:
        raise HTTPException(
            status_code=503,
            detail="ML сервис временно недоступен"
        )
    
    # Проверяем тип файла
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail="Файл должен быть изображением"
        )
    
    try:
        # Сохраняем временный файл
        with NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name
        
        # Запускаем модель
        results = model.predict(
            source=temp_path,
            conf=0.3,  # Порог уверенности
            save=False,
            verbose=False
        )
        
        # Обрабатываем результаты
        defects = []
        detected_types = set()
        
        for result in results:
            if result.boxes is not None:
                boxes = result.boxes.cpu().numpy()
                for box in boxes:
                    # Получаем данные бокса
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    confidence = float(box.conf[0])
                    class_id = int(box.cls[0])
                    
                    # Получаем имя класса из модели
                    class_name = result.names[class_id]  # D00, D10, D20, D40
                    
                    # Маппим на наш тип
                    problem_type = map_model_class_to_problem_type(class_name)
                    
                    defect = DefectDetection(
                        type=problem_type,
                        confidence=confidence,
                        bbox=[x1, y1, x2, y2],
                        class_name=class_name
                    )
                    defects.append(defect)
                    detected_types.add(problem_type)
        
        # Определяем доминирующий тип
        dominant_type = None
        if defects:
            # Группируем по типам и находим самый частый
            type_counts = {}
            for defect in defects:
                type_counts[defect.type] = type_counts.get(defect.type, 0) + 1
            
            dominant_type = max(type_counts, key=type_counts.get)
        
        os.unlink(temp_path) # удаляем временный файл
        
        return ImageAnalysisResponse(
            defects=defects,
            detected_types=list(detected_types),
            dominant_type=dominant_type,
            confidence=defects[0].confidence if defects else None
        )
        
    except Exception as e:
        print(f"Ошибка анализа изображения: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка обработки изображения: {str(e)}"
        )