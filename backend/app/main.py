from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import shutil
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, timezone
from . import models
from .models import ProblemStatus, ProblemType, User, UserRole
from .database import get_db, engine
from tempfile import NamedTemporaryFile
from .auth import get_password_hash, verify_password, create_access_token, get_current_user, create_refresh_token, verify_refresh_token, revoke_refresh_token, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
import os
import torch
import torch.serialization
from ultralytics import YOLO
from ultralytics.nn.tasks import DetectionModel
from pathlib import Path
import contextlib

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


MODEL_PATH = r"C:\Users\lucky\Desktop\РПЦ\RoadGuardAI\ml_module\roadguard_models\v2\weights\best.pt"
with disable_weights_only_check():
    if Path(MODEL_PATH).exists():
        model = YOLO(str(MODEL_PATH))
        print(f"Модель загружена!")
        ML_AVAILABLE = True
    else:
        print("Модель не найдена")
        model = None
        ML_AVAILABLE = False

try:
    models.Base.metadata.create_all(bind=engine)
    print("Таблицы созданы успешно!")
except Exception as e:
    print(f"Ошибка создания таблиц: {e}")

app = FastAPI(
    title="RoadGuard AI API",
    description="API для системы мониторинга дорожного покрытия",
    version="1.0.0",
    docs_url="/docs"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],  # Разрешаем все HTTP методы
    allow_headers=["*"],  # Разрешаем все заголовки
)

class ProblemCreate(BaseModel):
    address: str
    description: Optional[str] = None
    type: ProblemType = ProblemType.POTHOLE

class ProblemResponse(BaseModel):
    id: int
    type: ProblemType
    address: str
    description: Optional[str] = None
    status: ProblemStatus
    created_at: datetime
    reporter_id: int
    is_from_inspector: bool

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: UserRole = UserRole.CITIZEN
    organization: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str
    is_active: bool
    created_at: datetime
    organization: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str

class DefectDetection(BaseModel):
    type: str  
    confidence: float
    bbox: List[int]  
    class_name: str  # оригинальное имя класса из модели

class ImageAnalysisResponse(BaseModel):
    defects: List[DefectDetection]
    detected_types: List[str]
    dominant_type: Optional[str] = None
    confidence: Optional[float] = None

def require_admin(current_user: User = Depends(get_current_user)): 
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

def require_admin_or_contractor(current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.CONTRACTOR]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

def map_model_class_to_problem_type(class_name: str) -> str: # маппинг
    mapping = {
        'D00': 'long_crack',      
        'D10': 'transverse_crack', 
        'D20': 'alligator_crack', 
        'D40': 'pothole',         
    }
    return mapping.get(class_name, 'other')

@app.get("/")
def read_root():
    return {"message": "RoadGuard AI API работает!", "docs": "/docs"}

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Проверка здоровья БД"""
    try:
        db.execute(text("SELECT 1"))
        result = db.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'problems')"))
        tables_exist = result.scalar()
        return {
            "status": "healthy", 
            "database": "connected",
            "tables_exist": tables_exist
        }
    except Exception as e:
        return {"status": "unhealthy", "database": "error", "error": str(e)}

@app.post("/problems", response_model=ProblemResponse)
def create_problem(problem: ProblemCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Создать новую проблему"""
    try:
        db_problem = models.Problem(
            address=problem.address,
            description=problem.description,
            type=problem.type,
            reporter_id=current_user.id,
            is_from_inspector=(current_user.role == UserRole.INSPECTOR)
        )

        db.add(db_problem)
        db.commit()
        db.refresh(db_problem)

        return db_problem
    
    except Exception as e:
        db.rollback()
        print(f"Error creating problem: {str(e)}") 
        print(f"Error type: {type(e)}")   
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.put("/problems/{problem_id}/status")  
def update_problem_status(problem_id: int, status: ProblemStatus, db: Session = Depends(get_db), user: models.User = Depends(require_admin_or_contractor)):
    """Обновить статус проблемы"""
    problem = db.query(models.Problem).filter(models.Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    problem.status = status
    db.commit()
    db.refresh(problem)
    return problem

@app.get("/problems", response_model=list[ProblemResponse])
def get_problems(db: Session = Depends(get_db)):
    """Получить список всех проблем"""
    try:
        problems = db.query(models.Problem).all()
        return problems
    except Exception as e:
        print(f"Error in GET /problems: {str(e)}")  
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/problems/{problem_id}", response_model=ProblemResponse)
def get_problem(problem_id: int, db: Session = Depends(get_db)):
    """Получить проблему по ID"""
    problem = db.query(models.Problem).filter(models.Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem

@app.delete("/problems/{problem_id}")
def delete_problem(problem_id: int, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    """Удалить проблему по ID (только для админов)"""
    problem = db.query(models.Problem).filter(models.Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    db.delete(problem)
    db.commit()
    return {"message": "Problem deleted successfully"}

@app.post("/auth/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if len(user.password) < 5:
        raise HTTPException(status_code=400, detail="Password must be at least 5 characters long")
    
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        role=user.role,
        organization=user.organization
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/auth/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    refresh_token = create_refresh_token()
    refresh_token_expires = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    db_refresh_token = models.RefreshToken(
        user_id=user.id,
        token=refresh_token,
        expires_at=refresh_token_expires
    )
    db.add(db_refresh_token)
    db.commit()
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@app.post("/auth/refresh", response_model=Token)
def refresh_token(refresh_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Обновление access токена с помощью refresh токена"""
    user_id = verify_refresh_token(refresh_data.refresh_token, db)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES) 
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_data.refresh_token,  # Возвращаем тот же refresh токен
        "token_type": "bearer"
    }

@app.post("/auth/logout")
def logout(logout_data: LogoutRequest, db: Session = Depends(get_db)):
    """Выход и отзыв refresh токена"""
    revoked_token = revoke_refresh_token(logout_data.refresh_token, db)
    if revoked_token:
        return {"message": "Successfully logged out"}
    else:
        return {"message": "Token not found or already revoked"}

@app.get("/auth/me", response_model=UserResponse)
def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/api/analyze-image", response_model=ImageAnalysisResponse)
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
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)