from app.core.security import get_password_hash, verify_password, create_access_token

def test_password_hashing():
    password = "secret123"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("wrong", hashed)

def test_create_access_token():
    token = create_access_token({"sub": "test@example.com"})
    assert token is not None
    assert isinstance(token, str)

def test_register_user(client, db):
    response = client.post("/auth/register", json={
        "email": "newuser@example.com",
        "name": "New User",
        "password": "password123",
        "role": "citizen"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["name"] == "New User"

def test_register_duplicate_email(client, test_user):
    response = client.post("/auth/register", json={
        "email": "test@example.com",
        "name": "Duplicate",
        "password": "password123",
        "role": "citizen"
    })
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

def test_register_short_password(client):
    response = client.post("/auth/register", json={
        "email": "short@example.com",
        "name": "Short",
        "password": "123",
        "role": "citizen"
    })
    assert response.status_code == 400
    assert "at least 5 characters" in response.json()["detail"]

def test_login_success(client, test_user):
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(client, test_user):
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "wrong"
    })
    assert response.status_code == 401

def test_login_nonexistent_user(client):
    response = client.post("/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "password"
    })
    assert response.status_code == 401

def test_get_me(client, auth_headers):
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["role"] == "citizen"