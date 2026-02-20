from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from ..models import models
from ..core.config import REFRESH_TOKEN_EXPIRE_DAYS

class TokenRepository:
    """Работа с refresh токенами в БД"""
    
    def __init__(self, db: Session):
        self.db = db

    def create_for_user(self, user_id: int, token: str):
        expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        db_token = models.RefreshToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at
        )

        self.db.add(db_token)
        self.db.commit()
        return db_token
    
    def verify(self, token: str): # проверка валидности
        db_token = self.db.query(models.RefreshToken).filter(
            models.RefreshToken.token == token,
            models.RefreshToken.is_revoked == False,
            models.RefreshToken.expires_at > datetime.now(timezone.utc)
        ).first()
        return db_token.user_id if db_token else None
    
    def revoke(self, token: str): # отозвать
        db_token = self.db.query(models.RefreshToken).filter(
            models.RefreshToken.token == token
        ).first()
        if db_token:
            db_token.is_revoked = True
            self.db.commit()
        return db_token
    
