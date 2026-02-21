from fastapi import HTTPException
import os
import torch
import torch.serialization
from ultralytics import YOLO
from ultralytics.nn.tasks import DetectionModel
from pathlib import Path
import contextlib
from ..core.config import MODEL_PATH
from ..schemas.schemas import DefectDetection
from tempfile import NamedTemporaryFile
import asyncio

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

class MLService: # для работы с нейросетью
    def __init__(self):
        self.model = None
        self.available = False
        self._load_model() # загрузка модели при инициализации
    
    def _load_model(self): 
        with disable_weights_only_check():
            if Path(MODEL_PATH).exists():
                self.model = YOLO(str(MODEL_PATH))
                print(f"Модель загружена!")
                self.available = True
            else:
                print("Модель не найдена")
                self.available = False
    
    def map_class_to_problem_type(self, class_name: str) -> str: # маппинг
        mapping = {
            'D00': 'long_crack',      
            'D10': 'transverse_crack', 
            'D20': 'alligator_crack', 
            'D40': 'pothole'         
        }
        return mapping.get(class_name, 'other')
    
    async def analyze_image(self, file):
        if not self.available or self.model is None:
            raise HTTPException(status_code=503, detail="ML сервис временно недоступен")

        temp_path = None
        try:
            # Сначала читаем содержимое файла и закрываем его
            file_content = await file.read()

            # Создаем временный файл и записываем в него содержимое
            with NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                temp_file.write(file_content)
                temp_path = temp_file.name
            
            # Теперь можно безопасно использовать временный файл для анализа
            results = self.model.predict(
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
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        confidence = float(box.conf[0])
                        class_id = int(box.cls[0])
                        
                        class_name = result.names[class_id]  # D00, D10, D20, D40
                        
                        # Маппим на наш тип
                        problem_type = self.map_class_to_problem_type(class_name)

                        defect = DefectDetection(
                            type=problem_type,
                            confidence=confidence,
                            bbox=[x1, y1, x2, y2],
                            class_name=class_name
                        )
                        defects.append(defect)
                        detected_types.add(problem_type)
                
            dominant_type = None # доминирующий тип
            if defects:
                # Группируем по типам и находим самый частый
                type_counts = {}
                for defect in defects:
                    type_counts[defect.type] = type_counts.get(defect.type, 0) + 1
                
                dominant_type = max(type_counts, key=type_counts.get)
                
            return {
                "defects": defects,
                "detected_types": list(detected_types),
                "dominant_type": dominant_type,
                "confidence": defects[0].confidence if defects else None
            }
            
        finally:            
            if temp_path and os.path.exists(temp_path):
                try:
                    await asyncio.sleep(0.1) # небольшая задержка для гарантии освобождения файла
                    os.unlink(temp_path) # удал. временный файл
                except Exception as e:
                    print(f"Ошибка при удалении временного файла: {e}")

ml_service = MLService() # глобальный экземпляр



