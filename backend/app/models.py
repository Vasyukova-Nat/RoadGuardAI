from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.sql import func
from .database import Base
import enum

class UserRole(str, enum.Enum):
    INSPECTOR = "inspector"
    CONTRACTOR = "contractor"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default=UserRole.INSPECTOR.value)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Problem(Base):
    __tablename__ = "problems"
    
    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, nullable=False)
    description = Column(Text)
    problem_type = Column(String, default="pothole")
    status = Column(String, default="new")
    reporter_id = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())