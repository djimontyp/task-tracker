"""Contract tests for PUT /api/providers/{id} endpoint."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_update_provider_configuration(client: AsyncClient):
    """Test updating provider configuration."""
    # Create provider
    create_response = await client.post(
        "/api/providers",
        json={"name": "Update Test", "type": "ollama", "base_url": "http://localhost:11434"},
    )
    provider_id = create_response.json()["id"]

    # Update provider
    response = await client.put(
        f"/api/providers/{provider_id}",
        json={"base_url": "http://localhost:11435"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["base_url"] == "http://localhost:11435"


@pytest.mark.asyncio
async def test_update_triggers_revalidation(client: AsyncClient):
    """Test that update triggers async re-validation."""
    # Create provider
    create_response = await client.post(
        "/api/providers",
        json={"name": "Revalidation Test", "type": "ollama", "base_url": "http://localhost:11434"},
    )
    provider_id = create_response.json()["id"]

    # Update provider
    response = await client.put(
        f"/api/providers/{provider_id}",
        json={"base_url": "http://localhost:11435"},
    )
    assert response.status_code == 200
    data = response.json()
    # Should reset validation status to 'validating'
    assert data["validation_status"] in ["validating", "pending"]


@pytest.mark.asyncio
async def test_update_provider_not_found(client: AsyncClient):
    """Test 404 for updating non-existent provider."""
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = await client.put(
        f"/api/providers/{fake_uuid}",
        json={"base_url": "http://localhost:11435"},
    )
    assert response.status_code == 404
