"""Contract tests for GET /api/tasks endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_all_tasks(client: AsyncClient):
    """Test listing all tasks."""
    # Create test tasks
    for i in range(2):
        await client.post(
            "/api/tasks",
            json={
                "name": f"List Task {i}",
                "response_schema": {"type": "object", "properties": {}},
            },
        )

    response = await client.get("/api/tasks")
    assert response.status_code == 200
    data = response.json()
    assert "tasks" in data
    assert len(data["tasks"]) >= 2


@pytest.mark.asyncio
async def test_get_task_by_id(client: AsyncClient):
    """Test getting task by ID."""
    # Create task
    create_response = await client.post(
        "/api/tasks",
        json={
            "name": "Get Test Task",
            "response_schema": {
                "type": "object",
                "properties": {"result": {"type": "string"}},
            },
        },
    )
    task_id = create_response.json()["id"]

    # Get task
    response = await client.get(f"/api/tasks/{task_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == task_id
    assert data["name"] == "Get Test Task"


@pytest.mark.asyncio
async def test_get_task_not_found(client: AsyncClient):
    """Test 404 for non-existent task."""
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"/api/tasks/{fake_uuid}")
    assert response.status_code == 404
