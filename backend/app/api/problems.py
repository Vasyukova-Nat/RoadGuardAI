from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas.schemas import ProblemCreate, ProblemResponse
from ..core.security import get_current_user
from ..models.models import User
from ..services.problem_service import ProblemService
from .auth import require_admin, require_admin_or_contractor, get_current_user

router = APIRouter(prefix="/problems", tags=["problems"])

@router.post("", response_model=ProblemResponse)
def create_problem(
    problem: ProblemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создать новую проблему"""
    service = ProblemService(db)
    return service.create_problem(problem, current_user)

@router.put("/{problem_id}/status", response_model=ProblemResponse)
def update_problem_status(
    problem_id: int,
    status: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin_or_contractor)
):
    """Обновить статус проблемы (for admin/contractor)"""
    service = ProblemService(db)
    problem = service.update_status(problem_id, status)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem

@router.get("", response_model=List[ProblemResponse])
def get_problems(db: Session = Depends(get_db)):
    """Получить список всех проблем"""
    service = ProblemService(db)
    return service.get_all_problems()

@router.get("/{problem_id}", response_model=ProblemResponse)
def get_problem(problem_id: int, db: Session = Depends(get_db)):
    """Получить проблему по ID"""
    service = ProblemService(db)
    problem = service.get_problem(problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem

@router.delete("/{problem_id}")
def delete_problem(
    problem_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin)
):
    """Удалить проблему (только admin)"""
    service = ProblemService(db)
    if not service.delete_problem(problem_id):
        raise HTTPException(status_code=404, detail="Problem not found")
    return {"message": "Problem deleted successfully"}
