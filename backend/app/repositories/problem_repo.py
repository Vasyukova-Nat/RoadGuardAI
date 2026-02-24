from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..models.models import Problem, ProblemStatus, ProblemType
from ..schemas.schemas import ProblemCreate

class ProblemRepository:
    """Работа с проблемами в БД"""
    def __init__(self, db: Session):
        self.db = db

    def get_all(self):
        return self.db.query(Problem).all()
    
    def get_filtered(
        self,
        status: Optional[ProblemStatus] = None,
        type: Optional[ProblemType] = None,
        is_from_inspector: Optional[bool] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 10
    ):
        """Получение проблем с фильтрацией, сортировкой и пагинацией"""
        
        query = self.db.query(Problem)
        
        if status:
            query = query.filter(Problem.status == status)
        if type:
            query = query.filter(Problem.type == type)
        if is_from_inspector is not None:
            query = query.filter(Problem.is_from_inspector == is_from_inspector)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Problem.address.ilike(search_pattern),
                    Problem.description.ilike(search_pattern)
                )
            )
        
        total = query.count() # общее кол-во
        
        if sort_by == 'created_at':
            order_column = Problem.created_at
        elif sort_by == 'type':
            order_column = Problem.type
        elif sort_by == 'status':
            order_column = Problem.status
        elif sort_by == 'address':
            order_column = Problem.address
        else:
            order_column = Problem.created_at 
        
        if sort_order == 'desc':
            query = query.order_by(order_column.desc())
        else:
            query = query.order_by(order_column.asc())
        
        offset = (page - 1) * limit # пагинация
        items = query.offset(offset).limit(limit).all()

        total_pages = (total + limit - 1) // limit if total > 0 else 1
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
    
    def get_by_id(self, problem_id: int):
        return self.db.query(Problem).filter(Problem.id == problem_id).first()
    
    def create(self, problem_data: ProblemCreate, reporter_id: int, is_from_inspector: bool):
        db_problem = Problem(
            address=problem_data.address,
            description=problem_data.description,
            type=problem_data.type,
            reporter_id=reporter_id,
            is_from_inspector=is_from_inspector
        )
        self.db.add(db_problem)
        self.db.commit()
        self.db.refresh(db_problem)
        return db_problem

    def update_status(self, problem_id: int, status: ProblemStatus):
        problem = self.get_by_id(problem_id)
        if problem:
            problem.status = status
            self.db.commit()
            self.db.refresh(problem)
        return problem
    
    def delete(self, problem_id: int):
        problem = self.get_by_id(problem_id)
        if problem:
            self.db.delete(problem)
            self.db.commit()
            return True
        return False
    