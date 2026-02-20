from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.schemas import UserResponse, UpdateUserRoleRequest
from ..models import models
from ..models.models import User
from .auth import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])

@router.put("/users/role", response_model=UserResponse)
def update_user_role(
    role_data: UpdateUserRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)  # только админ
):
    """Изменение роли пользователя"""
    user = db.query(models.User).filter(models.User.id == role_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = role_data.new_role
    db.commit()
    db.refresh(user)
    
    return user

@router.get("/users", response_model=list[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)  # только админ
):
    """Получение списка всех пользователей"""
    users = db.query(models.User).all()
    return users