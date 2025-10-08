"""Contract tests for DELETE /api/providers/{id} endpoint."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_delete_provider_success(client: AsyncClient):
    """Test successful provider deletion."""
    # Create provider
    create_response = await client.post(
        "/api/providers",
        json={"name": "Delete Test", "type": "ollama", "base_url": "http://localhost:11434"},
    )
    provider_id = create_response.json()["id"]

    # Delete provider
    response = await client.delete(f"/api/providers/{provider_id}")
    assert response.status_code == 204

    # Verify deleted
    get_response = await client.get(f"/api/providers/{provider_id}")
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_delete_provider_with_agent_references(client: AsyncClient):
    """Test soft delete when agents reference provider."""
    # Create provider
    provider_response = await client.post(
        "/api/providers",
        json={"name": "Referenced Provider", "type": "ollama", "base_url": "http://localhost:11434"},
    )
    provider_id = provider_response.json()["id"]

    # Create agent referencing provider
    await client.post(
        "/api/agents",
        json={
            "name": "Test Agent",
            "provider_id": provider_id,
            "model_name": "llama3",
            "system_prompt": "Test prompt",
        },
    )

    # Delete provider should still work (soft delete or cascade depends on FR)
    response = await client.delete(f"/api/providers/{provider_id}")
    assert response.status_code == 204
