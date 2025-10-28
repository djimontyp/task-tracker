"""Contract tests for GET /api/agents/{id}/tasks endpoint."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_assigned_tasks_for_agent(client: AsyncClient):
    """Test listing assigned tasks for an agent."""
    # Create provider and agent
    provider_response = await client.post(
        "/api/v1/providers",
        json={"name": "List Tasks Provider", "type": "ollama", "base_url": "http://localhost:11434"},
    )
    provider_id = provider_response.json()["id"]

    agent_response = await client.post(
        "/api/v1/agents",
        json={
            "name": "List Tasks Agent",
            "provider_id": provider_id,
            "model_name": "llama3",
            "system_prompt": "Test prompt",
        },
    )
    agent_id = agent_response.json()["id"]

    # Create and assign multiple tasks
    for i in range(2):
        task_response = await client.post(
            "/api/v1/task-configs",
            json={
                "name": f"Task {i}",
                "response_schema": {"type": "object", "properties": {}},
            },
        )
        task_id = task_response.json()["id"]
        await client.post(f"/api/v1/agents/{agent_id}/tasks", json={"task_id": task_id})

    # List tasks
    response = await client.get(f"/api/v1/agents/{agent_id}/tasks")
    assert response.status_code == 200
    data = response.json()
    # API returns list directly, not wrapped in dict
    assert isinstance(data, list)
    # Should have at least 2 tasks
    assert len(data) >= 2


@pytest.mark.asyncio
async def test_list_tasks_empty_for_new_agent(client: AsyncClient):
    """Test returns empty array for agent with no tasks."""
    # Create provider and agent
    provider_response = await client.post(
        "/api/v1/providers",
        json={"name": "Empty Provider", "type": "ollama", "base_url": "http://localhost:11434"},
    )
    provider_id = provider_response.json()["id"]

    agent_response = await client.post(
        "/api/v1/agents",
        json={
            "name": "Empty Agent",
            "provider_id": provider_id,
            "model_name": "llama3",
            "system_prompt": "Test prompt",
        },
    )
    agent_id = agent_response.json()["id"]

    # List tasks (should be empty)
    response = await client.get(f"/api/v1/agents/{agent_id}/tasks")
    assert response.status_code == 200
    data = response.json()
    # API returns list directly, not wrapped in dict
    assert isinstance(data, list)
    assert len(data) == 0
