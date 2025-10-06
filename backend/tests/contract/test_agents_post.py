"""Contract tests for POST /api/agents endpoint."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_agent_valid(client: AsyncClient):
    """Test agent creation with valid configuration."""
    # Create provider first
    provider_response = await client.post(
        "/api/providers",
        json={"name": "Test Provider", "type": "ollama", "base_url": "http://localhost:11434"},
    )
    provider_id = provider_response.json()["id"]

    # Create agent
    response = await client.post(
        "/api/agents",
        json={
            "name": "Message Classifier",
            "description": "Classifies messages into categories",
            "provider_id": provider_id,
            "model_name": "llama3",
            "system_prompt": "You are a message classification assistant.",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Message Classifier"
    assert data["model_name"] == "llama3"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_agent_missing_system_prompt(client: AsyncClient):
    """Test validation error for missing system_prompt."""
    # Create provider
    provider_response = await client.post(
        "/api/providers",
        json={"name": "Provider for Validation", "type": "ollama", "base_url": "http://localhost:11434"},
    )
    provider_id = provider_response.json()["id"]

    # Try creating agent without system_prompt
    response = await client.post(
        "/api/agents",
        json={
            "name": "Invalid Agent",
            "provider_id": provider_id,
            "model_name": "llama3",
            # Missing system_prompt
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_agent_duplicate_name(client: AsyncClient):
    """Test 409 conflict for duplicate agent name."""
    # Create provider
    provider_response = await client.post(
        "/api/providers",
        json={"name": "Duplicate Agent Provider", "type": "ollama", "base_url": "http://localhost:11434"},
    )
    provider_id = provider_response.json()["id"]

    # Create first agent
    await client.post(
        "/api/agents",
        json={
            "name": "Duplicate Agent",
            "provider_id": provider_id,
            "model_name": "llama3",
            "system_prompt": "Test prompt",
        },
    )

    # Try creating duplicate
    response = await client.post(
        "/api/agents",
        json={
            "name": "Duplicate Agent",
            "provider_id": provider_id,
            "model_name": "llama3",
            "system_prompt": "Different prompt",
        },
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_create_agent_provider_not_found(client: AsyncClient):
    """Test 404 when provider_id doesn't exist."""
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = await client.post(
        "/api/agents",
        json={
            "name": "Orphan Agent",
            "provider_id": fake_uuid,
            "model_name": "llama3",
            "system_prompt": "Test prompt",
        },
    )
    assert response.status_code == 404
