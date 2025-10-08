"""Contract tests for POST /api/agents/{id}/tasks endpoint."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_assign_task_to_agent(client: AsyncClient):
    """Test assigning task to agent."""
    # Create provider
    provider_response = await client.post(
        "/api/providers",
        json={"name": "Task Provider", "type": "ollama", "base_url": "http://localhost:11434"},
    )
    provider_id = provider_response.json()["id"]

    # Create agent
    agent_response = await client.post(
        "/api/agents",
        json={
            "name": "Task Agent",
            "provider_id": provider_id,
            "model_name": "llama3",
            "system_prompt": "Test prompt",
        },
    )
    agent_id = agent_response.json()["id"]

    # Create task
    task_response = await client.post(
        "/api/tasks",
        json={
            "name": "Classify Message",
            "description": "Categorize messages",
            "response_schema": {
                "$schema": "http://json-schema.org/draft-07/schema#",
                "type": "object",
                "properties": {"category": {"type": "string"}},
                "required": ["category"],
            },
        },
    )
    task_id = task_response.json()["id"]

    # Assign task to agent
    response = await client.post(
        f"/api/agents/{agent_id}/tasks",
        json={"task_id": task_id},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["agent_id"] == agent_id
    assert data["task_id"] == task_id
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_assign_task_duplicate_conflict(client: AsyncClient):
    """Test 409 conflict for duplicate task assignment."""
    # Create provider, agent, task
    provider_response = await client.post(
        "/api/providers",
        json={"name": "Duplicate Provider", "type": "ollama", "base_url": "http://localhost:11434"},
    )
    provider_id = provider_response.json()["id"]

    agent_response = await client.post(
        "/api/agents",
        json={
            "name": "Duplicate Agent",
            "provider_id": provider_id,
            "model_name": "llama3",
            "system_prompt": "Test prompt",
        },
    )
    agent_id = agent_response.json()["id"]

    task_response = await client.post(
        "/api/tasks",
        json={
            "name": "Duplicate Task",
            "response_schema": {"type": "object", "properties": {}},
        },
    )
    task_id = task_response.json()["id"]

    # Assign task
    await client.post(f"/api/agents/{agent_id}/tasks", json={"task_id": task_id})

    # Try assigning again
    response = await client.post(
        f"/api/agents/{agent_id}/tasks",
        json={"task_id": task_id},
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_assign_task_agent_not_found(client: AsyncClient):
    """Test 404 when agent doesn't exist."""
    # Create task
    task_response = await client.post(
        "/api/tasks",
        json={
            "name": "Orphan Task",
            "response_schema": {"type": "object", "properties": {}},
        },
    )
    task_id = task_response.json()["id"]

    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = await client.post(
        f"/api/agents/{fake_uuid}/tasks",
        json={"task_id": task_id},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_assign_task_task_not_found(client: AsyncClient):
    """Test 404 when task doesn't exist."""
    # Create provider and agent
    provider_response = await client.post(
        "/api/providers",
        json={"name": "Taskless Provider", "type": "ollama", "base_url": "http://localhost:11434"},
    )
    provider_id = provider_response.json()["id"]

    agent_response = await client.post(
        "/api/agents",
        json={
            "name": "Taskless Agent",
            "provider_id": provider_id,
            "model_name": "llama3",
            "system_prompt": "Test prompt",
        },
    )
    agent_id = agent_response.json()["id"]

    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = await client.post(
        f"/api/agents/{agent_id}/tasks",
        json={"task_id": fake_uuid},
    )
    assert response.status_code == 404
