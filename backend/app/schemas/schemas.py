from pydantic import BaseModel, EmailStr, validator
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

class ProblemFilterParams(BaseModel):
    status: Optional[ProblemStatus] = None
    type: Optional[ProblemType] = None
    is_from_inspector: Optional[bool] = None
    search: Optional[str] = None
    sort_by: str = "created_at"
    sort_order: str = "desc"
    page: int = 1
    limit: int = 10
    
    @validator('sort_by')
    def validate_sort_by(cls, v):
        allowed = ['created_at', 'type', 'status', 'address']
        if v not in allowed:
            raise ValueError(f'sort_by must be one of {allowed}')
        return v
    
    @validator('sort_order')
    def validate_sort_order(cls, v):
        if v not in ['asc', 'desc']:
            raise ValueError('sort_order must be asc or desc')
        return v
    
    @validator('page')
    def validate_page(cls, v):
        if v < 1:
            return 1
        return v
    
    @validator('limit')
    def validate_limit(cls, v):
        if v < 1:
            return 10
        if v > 100:
            return 100
        return v

class PaginatedProblemResponse(BaseModel):
    items: List[ProblemResponse]
    total: int
    page: int
    limit: int
    total_pages: int
    
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
