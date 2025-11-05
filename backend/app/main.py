from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta, timezone
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .models import ProblemStatus, ProblemType, User, UserRole
from .database import get_db, engine
from .auth import get_password_hash, verify_password, create_access_token, get_current_user, create_refresh_token, verify_refresh_token, revoke_refresh_token, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS

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

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str
    is_active: bool
    created_at: datetime

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

def require_admin(current_user: User = Depends(get_current_user)): 
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

def require_admin_or_contractor(current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.CONTRACTOR]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

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
        role=user.role 
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)