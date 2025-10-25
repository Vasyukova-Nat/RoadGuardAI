from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Enum
from sqlalchemy.sql import func
from .database import Base
import enum

class UserRole(enum.Enum):
    INSPECTOR = "inspector"
    CONTRACTOR = "contractor"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.INSPECTOR)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ProblemType(str, enum.Enum):
    POTHOLE = "pothole"
    CRACK = "crack"
    MANHOLE = "manhole"
    OTHER = "other"

class ProblemStatus(str, enum.Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class Problem(Base):
    __tablename__ = "problems"
    
    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, nullable=False)
    description = Column(Text)
    type = Column(Enum(ProblemType), default=ProblemType.POTHOLE)
    status = Column(Enum(ProblemStatus), default=ProblemStatus.NEW)
    reporter_id = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())