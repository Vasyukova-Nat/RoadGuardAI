from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..schemas.schemas import LoginRequest, LogoutRequest, RefreshTokenRequest, Token, UserCreate, UserResponse
from ..repositories.user_repo import UserRepository
from ..services.auth_service import AuthService
from ..database import get_db
from ..models.models import User, UserRole
from ..core.security import get_password_hash, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

def require_admin(current_user: User = Depends(get_current_user)): 
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

def require_admin_or_contractor(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.CONTRACTOR]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Регистрация пользователя"""
    repo = UserRepository(db)

    if repo.get_by_email(user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if len(user.password) < 5:
        raise HTTPException(status_code=400, detail="Password must be at least 5 characters long")
    
    hashed_password = get_password_hash(user.password)
    return repo.create(user, hashed_password)

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Вход пользователя"""
    service = AuthService(db)
    return service.login(login_data.email, login_data.password)

@router.post("/refresh", response_model=Token)
def refresh_token(refresh_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Обновление access токена с пом. refresh токена"""
    service = AuthService(db)
    return service.refresh_access_token(refresh_data.refresh_token)

@router.post("/logout")
def logout(logout_data: LogoutRequest, db: Session = Depends(get_db)):
    """Выход и отзыв refresh токена"""
    service = AuthService(db)
    return service.logout(logout_data.refresh_token)
    
@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user