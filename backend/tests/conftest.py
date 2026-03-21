import pytest
import sys
import os

class MockMagic: # мок для python-magic для избежания ошибок библиотек
    def from_buffer(self, *args, **kwargs):
        return 'image/jpeg'
    
    def __call__(self, *args, **kwargs):
        return self

sys.modules['magic'] = MockMagic() # подменяем модуль magic до импорта

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) # путь к app

from app.database import Base, get_db
from app.main import app
from app.core.security import get_password_hash
from app.models.models import User, UserRole

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db" # тестовая БД
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(db):
    return TestClient(app)

@pytest.fixture
def test_problem(db, test_user): # создаёт тестовую проблему
    from app.models.models import Problem
    problem = Problem(
        address="ул. Тестовая, 1",
        type="pothole",
        reporter_id=test_user.id,
        is_from_inspector=False
    )
    db.add(problem)
    db.commit()
    db.refresh(problem)
    return problem

@pytest.fixture
def test_user(db):
    user = User(
        email="test@example.com",
        name="Test User",
        hashed_password=get_password_hash("password123"),
        role=UserRole.CITIZEN,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def test_admin(db):
    user = User(
        email="admin@example.com",
        name="Admin User",
        hashed_password=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def test_contractor(db):
    user = User(
        email="contractor@example.com",
        name="Contractor",
        hashed_password=get_password_hash("contractor123"),
        role=UserRole.CONTRACTOR,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def auth_headers(client, test_user):
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_auth_headers(client, test_admin):
    response = client.post("/auth/login", json={
        "email": "admin@example.com",
        "password": "admin123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def contractor_auth_headers(client, test_contractor):
    response = client.post("/auth/login", json={
        "email": "contractor@example.com",
        "password": "contractor123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}