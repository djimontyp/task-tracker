"""Contract tests for GET /api/v1/providers endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_all_providers(client: AsyncClient):
    """Test listing all providers."""
    # Create test providers
    await client.post(
        "/api/v1/providers",
        json={"name": "Test Provider 1", "type": "ollama", "base_url": "http://localhost:11434"},
    )
    await client.post(
        "/api/v1/providers",
        json={"name": "Test Provider 2", "type": "openai", "api_key": "sk-test"},
    )

    response = await client.get("/api/v1/providers")
    assert response.status_code == 200
    data = response.json()
    assert "providers" in data
    assert len(data["providers"]) >= 2


@pytest.mark.asyncio
async def test_get_provider_by_id(client: AsyncClient):
    """Test getting provider by ID."""
    # Create provider
    create_response = await client.post(
        "/api/v1/providers",
        json={"name": "Get Test Provider", "type": "ollama", "base_url": "http://localhost:11434"},
    )
    provider_id = create_response.json()["id"]

    # Get provider
    response = await client.get(f"/api/v1/providers/{provider_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == provider_id
    assert data["name"] == "Get Test Provider"


@pytest.mark.asyncio
async def test_get_provider_not_found(client: AsyncClient):
    """Test 404 for non-existent provider."""
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"/api/v1/providers/{fake_uuid}")
    assert response.status_code == 404
