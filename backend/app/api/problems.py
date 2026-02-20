from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas.schemas import ProblemCreate, ProblemResponse
from ..core.security import get_current_user
from ..models import models
from ..models.models import ProblemStatus, User, UserRole
from .auth import require_admin, require_admin_or_contractor, get_current_user

router = APIRouter(prefix="/problems", tags=["problems"])

@router.post("", response_model=ProblemResponse)
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

@router.put("/{problem_id}/status")  
def update_problem_status(problem_id: int, status: ProblemStatus, db: Session = Depends(get_db), user: models.User = Depends(require_admin_or_contractor)):
    """Обновить статус проблемы"""
    problem = db.query(models.Problem).filter(models.Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    problem.status = status
    db.commit()
    db.refresh(problem)
    return problem

@router.get("", response_model=list[ProblemResponse])
def get_problems(db: Session = Depends(get_db)):
    """Получить список всех проблем"""
    try:
        problems = db.query(models.Problem).all()
        return problems
    except Exception as e:
        print(f"Error in GET /problems: {str(e)}")  
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{problem_id}", response_model=ProblemResponse)
def get_problem(problem_id: int, db: Session = Depends(get_db)):
    """Получить проблему по ID"""
    problem = db.query(models.Problem).filter(models.Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem

@router.delete("/{problem_id}")
def delete_problem(problem_id: int, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    """Удалить проблему по ID (только для админов)"""
    problem = db.query(models.Problem).filter(models.Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    db.delete(problem)
    db.commit()
    return {"message": "Problem deleted successfully"}