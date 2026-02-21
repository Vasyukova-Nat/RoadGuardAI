from sqlalchemy.orm import Session
from ..models.models import Problem, ProblemStatus
from ..schemas.schemas import ProblemCreate

class ProblemRepository:
    """Работа с проблемами в БД"""
    def __init__(self, db: Session):
        self.db = db

    def get_all(self):
        return self.db.query(Problem).all()
    
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
    