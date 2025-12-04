from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Enum, ForeignKey
from sqlalchemy.sql import func
from .database import Base
import enum

class UserRole(enum.Enum):
    CITIZEN = "citizen"
    INSPECTOR = "inspector"
    CONTRACTOR = "contractor"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CITIZEN)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    organization = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ProblemType(str, enum.Enum):
    LONG_CRACK = "long_crack"
    TRANSVERSE_CRACK = "transverse_crack"
    ALLIGATOR_CRACK = "alligator_crack"
    POTHOLE = "pothole"
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
    type = Column(Enum(ProblemType, create_type=False), default=ProblemType.POTHOLE)
    status = Column(Enum(ProblemStatus, create_type=False), default=ProblemStatus.NEW)
    reporter_id = Column(Integer, nullable=False)
    is_from_inspector = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_revoked = Column(Boolean, default=False)