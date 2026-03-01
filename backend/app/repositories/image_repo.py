from typing import List
from sqlalchemy.orm import Session
from ..models.models import ProblemImage

class ImageRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_problem(self, problem_id: int) -> List[ProblemImage]: # получает изображения проблемы
        return self.db.query(ProblemImage).filter(
            ProblemImage.problem_id == problem_id
        ).all()

    def create(self, problem_id: int, file_key: str, original_filename: str, 
               file_size: int, content_type: str, uploaded_by: int) -> ProblemImage:
        db_image = ProblemImage(
            problem_id=problem_id,
            file_key=file_key,
            original_filename=original_filename,
            file_size=file_size,
            content_type=content_type,
            uploaded_by=uploaded_by
        )
        self.db.add(db_image)
        self.db.commit()
        self.db.refresh(db_image)
        return db_image
    
    def delete_by_problem(self, problem_id: int) -> int: # удал все записи изображений для проблемы
        result = self.db.query(ProblemImage).filter(
            ProblemImage.problem_id == problem_id
        ).delete(synchronize_session=False)
        self.db.commit()
        return result