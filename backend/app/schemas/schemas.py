from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from ..models.models import ProblemStatus, ProblemType, UserRole

class ProblemCreate(BaseModel):
    address: str
    description: Optional[str] = None
    type: ProblemType = ProblemType.POTHOLE

class ProblemResponse(BaseModel):
    id: int
    type: ProblemType
    address: str
    description: Optional[str] = None
    status: ProblemStatus
    created_at: datetime
    reporter_id: int
    is_from_inspector: bool

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: UserRole = UserRole.CITIZEN
    organization: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str
    is_active: bool
    created_at: datetime
    organization: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str

class DefectDetection(BaseModel):
    type: str  
    confidence: float
    bbox: List[int]  
    class_name: str  # оригинальное имя класса из модели

class ImageAnalysisResponse(BaseModel):
    defects: List[DefectDetection]
    detected_types: List[str]
    dominant_type: Optional[str] = None
    confidence: Optional[float] = None

class UpdateUserRoleRequest(BaseModel):
    user_id: int
    new_role: UserRole
