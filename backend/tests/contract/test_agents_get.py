"""Contract tests for GET /api/agents endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_all_agents_with_pagination(client: AsyncClient):
    """Test listing all agents with pagination support."""
    # Create provider
    provider_response = await client.post(
        "/api/providers",
        json={"name": "List Test Provider", "type": "ollama", "base_url": "http://localhost:11434"},
    )
    provider_id = provider_response.json()["id"]

    # Create multiple agents
    for i in range(3):
        await client.post(
            "/api/agents",
            json={
                "name": f"Agent {i}",
                "provider_id": provider_id,
                "model_name": "llama3",
                "system_prompt": "Test prompt",
            },
        )

    # List agents
    response = await client.get("/api/agents")
    assert response.status_code == 200
    data = response.json()
    assert "agents" in data
    assert len(data["agents"]) >= 3


@pytest.mark.asyncio
async def test_get_agent_by_id_with_provider_details(client: AsyncClient):
    """Test getting agent by ID includes provider details."""
    # Create provider
    provider_response = await client.post(
        "/api/providers",
        json={"name": "Detail Provider", "type": "ollama", "base_url": "http://localhost:11434"},
    )
    provider_id = provider_response.json()["id"]

    # Create agent
    create_response = await client.post(
        "/api/agents",
        json={
            "name": "Detail Agent",
            "provider_id": provider_id,
            "model_name": "llama3",
            "system_prompt": "Test prompt",
        },
    )
    agent_id = create_response.json()["id"]

    # Get agent
    response = await client.get(f"/api/agents/{agent_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == agent_id
    assert "provider" in data or "provider_id" in data


@pytest.mark.asyncio
async def test_get_agent_not_found(client: AsyncClient):
    """Test 404 for non-existent agent."""
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"/api/agents/{fake_uuid}")
    assert response.status_code == 404
