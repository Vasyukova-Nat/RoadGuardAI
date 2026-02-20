from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.schemas import UserResponse, UpdateUserRoleRequest
from ..repositories.user_repo import UserRepository
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
    repo = UserRepository(db)
    user = repo.update_role(role_data.user_id, role_data.new_role)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/users", response_model=list[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)  # только админ
):
    """Получение списка всех пользователей"""
    repo = UserRepository(db)
    return repo.get_all()