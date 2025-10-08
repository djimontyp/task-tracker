"""Contract tests for PUT /api/tasks/{id} endpoint."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_update_task_configuration(client: AsyncClient):
    """Test updating task configuration."""
    # Create task
    create_response = await client.post(
        "/api/tasks",
        json={
            "name": "Update Test Task",
            "description": "Original description",
            "response_schema": {"type": "object", "properties": {}},
        },
    )
    task_id = create_response.json()["id"]

    # Update task
    response = await client.put(
        f"/api/tasks/{task_id}",
        json={"description": "Updated description"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["description"] == "Updated description"


@pytest.mark.asyncio
async def test_update_task_schema_validation(client: AsyncClient):
    """Test schema validation on update."""
    # Create task
    create_response = await client.post(
        "/api/tasks",
        json={
            "name": "Schema Update Task",
            "response_schema": {"type": "object", "properties": {}},
        },
    )
    task_id = create_response.json()["id"]

    # Update with valid schema
    response = await client.put(
        f"/api/tasks/{task_id}",
        json={
            "response_schema": {
                "type": "object",
                "properties": {"new_field": {"type": "number"}},
            }
        },
    )
    assert response.status_code == 200

    # Update with invalid schema should fail
    response = await client.put(
        f"/api/tasks/{task_id}",
        json={"response_schema": {"type": "invalid_type"}},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_update_task_not_found(client: AsyncClient):
    """Test 404 for updating non-existent task."""
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = await client.put(
        f"/api/tasks/{fake_uuid}",
        json={"description": "New description"},
    )
    assert response.status_code == 404
