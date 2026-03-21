def test_full_problem_flow(client, auth_headers, admin_auth_headers):
    # Создание проблемы
    create_resp = client.post("/problems", headers=auth_headers, json={
        "address": "ул. Интеграционная, 1",
        "description": "Тест интеграции",
        "type": "long_crack"
    })
    assert create_resp.status_code == 200
    problem_id = create_resp.json()["id"]
    
    # Проверка, что проблема появилась в списке
    list_resp = client.get("/problems", headers=auth_headers)
    problems = list_resp.json()["items"]
    assert any(p["id"] == problem_id for p in problems)
    
    # Обновление статуса (админ)
    update_resp = client.put(f"/problems/{problem_id}/status", 
                             headers=admin_auth_headers,
                             params={"status": "in_progress"})
    assert update_resp.status_code == 200
    
    # Проверка изменения статуса
    get_resp = client.get(f"/problems/{problem_id}", headers=auth_headers)
    assert get_resp.json()["status"] == "in_progress"
    
    # Удаление
    delete_resp = client.delete(f"/problems/{problem_id}", headers=admin_auth_headers)
    assert delete_resp.status_code == 200

def test_pagination_and_filters(client, auth_headers):
    for i in range(5):
        client.post("/problems", headers=auth_headers, json={
            "address": f"ул. {i}",
            "type": "pothole"
        })
    
    response = client.get("/problems", headers=auth_headers, params={"page": 1, "limit": 3})
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) <= 3
    assert data["page"] == 1
    assert data["limit"] == 3