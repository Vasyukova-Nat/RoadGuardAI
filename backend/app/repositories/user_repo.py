from sqlalchemy.orm import Session
from .. import models
from ..models.models import User
from ..schemas.schemas import UserCreate

class UserRepository:
    """Работа с пользователями в БД"""
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_email(self, email: str):
        return self.db.query(User).filter(User.email == email).first()

    def get_by_id(self, user_id: int):
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_all(self):
        return self.db.query(User).all()
    
    def create(self, user_data: UserCreate, hashed_password: str):
        db_user = User(
            email=user_data.email,
            name=user_data.name,
            hashed_password=hashed_password,
            role=user_data.role,
            organization=user_data.organization
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user
    
    def update_role(self, user_id: int, new_role):
        user = self.get_by_id(user_id)
        if user:
            user.role = new_role
            self.db.commit()
            self.db.refresh(user)
        return user
        

    
