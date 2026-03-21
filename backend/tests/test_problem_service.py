def test_create_problem(client, auth_headers):
    response = client.post("/problems", headers=auth_headers, json={
        "address": "ул. Тестовая, 1",
        "description": "Тестовая проблема",
        "type": "pothole"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["address"] == "ул. Тестовая, 1"
    assert data["description"] == "Тестовая проблема"
    assert data["type"] == "pothole"
    assert data["status"] == "new"

def test_get_problems(client, auth_headers):
    client.post("/problems", headers=auth_headers, json={ # созд. проблему
        "address": "ул. Тестовая, 1",
        "type": "pothole"
    })
    
    response = client.get("/problems", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1

def test_get_problems_with_filter(client, auth_headers):
    response = client.get("/problems", headers=auth_headers, params={
        "status": "new",
        "page": 1,
        "limit": 10
    })
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["limit"] == 10

def test_update_status_contractor(client, auth_headers, contractor_auth_headers):
    create_resp = client.post("/problems", headers=auth_headers, json={ # созд. проблему как citizen
        "address": "ул. Тестовая",
        "type": "pothole"
    })
    problem_id = create_resp.json()["id"]
    
    response = client.put(f"/problems/{problem_id}/status", # меняем статус как contractor 
                          headers=contractor_auth_headers,
                          params={"status": "in_progress"})
    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"

def test_update_status_unauthorized(client, auth_headers):
    create_resp = client.post("/problems", headers=auth_headers, json={
        "address": "ул. Тестовая",
        "type": "pothole"
    })
    problem_id = create_resp.json()["id"]
    
    response = client.put(f"/problems/{problem_id}/status", # citizen не может менять статус
                          headers=auth_headers,
                          params={"status": "in_progress"})
    assert response.status_code == 403

def test_delete_problem_admin(client, admin_auth_headers):
    create_resp = client.post("/problems", headers=admin_auth_headers, json={
        "address": "ул. Тестовая",
        "type": "pothole"
    })
    problem_id = create_resp.json()["id"]
    
    response = client.delete(f"/problems/{problem_id}", headers=admin_auth_headers) # удал. как admin
    assert response.status_code == 200
    assert "успешно удалены" in response.json()["message"]

def test_create_problem_empty_address(client, auth_headers): # ошибка валидации
    response = client.post("/problems", headers=auth_headers, json={
        "address": "",
        "type": "pothole"
    })
    assert response.status_code == 422

def test_create_problem_invalid_type(client, auth_headers):
    response = client.post("/problems", headers=auth_headers, json={
        "address": "ул. Тест",
        "type": "invalid_type"
    })
    assert response.status_code == 422

def test_update_nonexistent_problem(client, admin_auth_headers):
    response = client.put("/problems/99999/status", 
                          headers=admin_auth_headers,
                          params={"status": "in_progress"})
    assert response.status_code == 404

def test_delete_nonexistent_problem(client, admin_auth_headers):
    response = client.delete("/problems/99999", headers=admin_auth_headers)
    assert response.status_code == 410