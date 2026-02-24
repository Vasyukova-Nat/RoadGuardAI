from sqlalchemy.orm import Session
from ..models.models import UserRole
from ..repositories.problem_repo import ProblemRepository

class ProblemService:
    """Бизнес-логика работы с проблемами"""
    def __init__(self, db: Session):
        self.problem_repo = ProblemRepository(db)
    
    def get_all_problems(self):
        return self.problem_repo.get_all()
    
    def get_problems_filtered(self, status, type, is_from_inspector, search, 
                         sort_by, sort_order, page, limit):
        return self.problem_repo.get_filtered(
            status=status,
            type=type,
            is_from_inspector=is_from_inspector,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            limit=limit
        )

    def get_problem(self, problem_id: int):
        return self.problem_repo.get_by_id(problem_id)
    
    def create_problem(self, problem_data, current_user):
        is_from_inspector = (current_user.role == UserRole.INSPECTOR)
        return self.problem_repo.create(
            problem_data, 
            current_user.id, 
            is_from_inspector
        )
    
    def update_status(self, problem_id: int, status):
        return self.problem_repo.update_status(problem_id, status)
    
    def delete_problem(self, problem_id: int):
        return self.problem_repo.delete(problem_id)
    