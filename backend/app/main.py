from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from .database import get_db
from . import models
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

app = FastAPI(
    title="RoadGuard AI API",
    description="API для системы мониторинга дорожного покрытия",
    version="1.0.0",
    docs_url="/docs"
)

class ProblemCreate(BaseModel):
    address: str
    description: Optional[str] = None

class ProblemResponse(BaseModel):
    id: int
    address: str
    description: Optional[str] = None
    created_at: datetime  

    class Config:
        from_attributes = True

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
def create_problem(problem: ProblemCreate, db: Session = Depends(get_db)):
    """Создать новую проблему"""
    try:
        db_problem = models.Problem(
            address=problem.address,
            description=problem.description
        )
        db.add(db_problem)
        db.commit()
        db.refresh(db_problem)
        return db_problem
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/problems", response_model=list[ProblemResponse])
def get_problems(db: Session = Depends(get_db)):
    """Получить список всех проблем"""
    try:
        problems = db.query(models.Problem).all()
        return problems
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/problems/{problem_id}", response_model=ProblemResponse)
def get_problem(problem_id: int, db: Session = Depends(get_db)):
    """Получить проблему по ID"""
    problem = db.query(models.Problem).filter(models.Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem

@app.delete("/problems/{problem_id}")
def delete_problem(problem_id: int, db: Session = Depends(get_db)):
    """Удалить проблему по ID"""
    problem = db.query(models.Problem).filter(models.Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    db.delete(problem)
    db.commit()
    return {"message": "Problem deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)