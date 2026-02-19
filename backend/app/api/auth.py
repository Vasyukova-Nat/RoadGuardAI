from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from ..schemas.schemas import LoginRequest, LogoutRequest, RefreshTokenRequest, Token, UserCreate, UserResponse
from ..database import get_db
from ..models import models
from ..models.models import User, UserRole
from ..core.config import ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
from ..core.security import get_password_hash, verify_password, create_access_token, get_current_user, create_refresh_token, verify_refresh_token, revoke_refresh_token

router = APIRouter(prefix="/auth", tags=["auth"])

def require_admin(current_user: User = Depends(get_current_user)): 
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

def require_admin_or_contractor(current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.CONTRACTOR]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

@router.post("/register", response_model=UserResponse)
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

@router.post("/login", response_model=Token)
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

@router.post("/refresh", response_model=Token)
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
    
    new_refresh_token = create_refresh_token()
    revoke_refresh_token(refresh_data.refresh_token, db)
    
    refresh_token_expires = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    db_refresh_token = models.RefreshToken(
        user_id=user.id,
        token=new_refresh_token,
        expires_at=refresh_token_expires
    )
    db.add(db_refresh_token)
    db.commit()

    return {
        "access_token": access_token, 
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.post("/logout")
def logout(logout_data: LogoutRequest, db: Session = Depends(get_db)):
    """Выход и отзыв refresh токена"""
    revoked_token = revoke_refresh_token(logout_data.refresh_token, db)
    if revoked_token:
        return {"message": "Successfully logged out"}
    else:
        return {"message": "Token not found or already revoked"}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    return current_user