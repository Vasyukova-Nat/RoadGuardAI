from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
import hashlib
import secrets
import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from . import models

SECRET_KEY = "secret-key-change-in-production"
REFRESH_SECRET_KEY = "refresh-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_password_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    return f"{salt}${hashlib.sha256((password + salt).encode()).hexdigest()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt, stored_hash = hashed_password.split('$')
        new_hash = hashlib.sha256((plain_password + salt).encode()).hexdigest()
        return secrets.compare_digest(new_hash, stored_hash)
    except:
        return False

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token():
    return str(uuid.uuid4())

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # тут получение пользователя из токена
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def verify_refresh_token(token: str, db: Session): 
    refresh_token = db.query(models.RefreshToken).filter(
        models.RefreshToken.token == token,
        models.RefreshToken.is_revoked == False,
        models.RefreshToken.expires_at > datetime.now(timezone.utc)
    ).first()
    
    if not refresh_token:
        return None
    
    return refresh_token.user_id

def revoke_refresh_token(token: str, db: Session): # revoke - отозвать
    refresh_token = db.query(models.RefreshToken).filter(
        models.RefreshToken.token == token
    ).first()
    
    if refresh_token:
        refresh_token.is_revoked = True
        db.commit()
    
    return refresh_token