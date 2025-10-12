"""Contract tests for DELETE /api/tasks/{id} endpoint."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_delete_task_success(client: AsyncClient):
    """Test successful task deletion."""
    # Create task
    create_response = await client.post(
        "/api/tasks",
        json={
            "name": "Delete Test Task",
            "response_schema": {"type": "object", "properties": {}},
        },
    )
    task_id = create_response.json()["id"]

    # Delete task
    response = await client.delete(f"/api/tasks/{task_id}")
    assert response.status_code == 204

    # Verify deleted
    get_response = await client.get(f"/api/tasks/{task_id}")
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_delete_task_with_agent_assignments(client: AsyncClient):
    """Test deleting task when assigned to agents."""
    # Create provider, agent, and task
    provider_response = await client.post(
        "/api/providers",
        json={"name": "Delete Task Provider", "type": "ollama", "base_url": "http://localhost:11434"},
    )
    provider_id = provider_response.json()["id"]

    agent_response = await client.post(
        "/api/agents",
        json={
            "name": "Delete Task Agent",
            "provider_id": provider_id,
            "model_name": "llama3",
            "system_prompt": "Test prompt",
        },
    )
    agent_id = agent_response.json()["id"]

    task_response = await client.post(
        "/api/tasks",
        json={
            "name": "Assigned Task",
            "response_schema": {"type": "object", "properties": {}},
        },
    )
    task_id = task_response.json()["id"]

    # Assign task to agent
    await client.post(f"/api/agents/{agent_id}/tasks", json={"task_id": task_id})

    # Delete task (should handle assignments gracefully)
    response = await client.delete(f"/api/tasks/{task_id}")
    assert response.status_code == 204
