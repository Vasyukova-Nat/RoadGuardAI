from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from ..repositories.user_repo import UserRepository
from ..repositories.refresh_token_repo import TokenRepository
from ..core.security import verify_password, create_access_token, create_refresh_token
from ..core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta

class AuthService:
    """Логика аутентификации"""
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
        self.token_repo = TokenRepository(db)

    def login(self, email: str, password: str):
        user = self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        
        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        refresh_token = create_refresh_token()
        self.token_repo.create_for_user(user.id, refresh_token)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    
    def refresh_access_token(self, refresh_token: str):
        user_id = self.token_repo.verify(refresh_token)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )
        
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        
        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        new_refresh_token = create_refresh_token()
        self.token_repo.revoke(refresh_token)
        self.token_repo.create_for_user(user.id, new_refresh_token)
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token, 
            "token_type": "bearer"
        }
    
    def logout(self, refresh_token: str):
        revoked = self.token_repo.revoke(refresh_token)
        if revoked:
            return {"message": "Successfully logged out"}
        return {"message": "Token not found or already revoked"}