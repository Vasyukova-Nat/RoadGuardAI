from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..schemas.schemas import ProblemCreate, ProblemResponse, PaginatedProblemResponse
from ..core.security import get_current_user
from ..models.models import User, ProblemStatus, ProblemType
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

@router.get("", response_model=PaginatedProblemResponse)
def get_problems(
    db: Session = Depends(get_db),
    status: Optional[ProblemStatus] = Query(None, description="Фильтр по статусу"),
    type: Optional[ProblemType] = Query(None, description="Фильтр по типу"),
    is_from_inspector: Optional[bool] = Query(None, description="Только от инспекторов"),
    search: Optional[str] = Query(None, description="Поиск по адресу или описанию"),
    sort_by: str = Query("created_at", description="Поле для сортировки"),
    sort_order: str = Query("desc", description="Направление сортировки (asc/desc)"),
    page: int = Query(1, ge=1, description="Номер страницы"),
    limit: int = Query(10, ge=1, le=100, description="Элементов на странице")
):
    """Получить список всех проблем (с фильтрацией, сортировкой, пагинацией)"""
    service = ProblemService(db)
    return service.get_problems_filtered(
        status=status,
        type=type,
        is_from_inspector=is_from_inspector,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit
    )

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
