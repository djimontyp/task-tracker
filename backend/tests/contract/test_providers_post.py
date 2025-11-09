"""Contract tests for POST /api/v1/providers endpoint."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_provider_ollama_valid(client: AsyncClient):
    """Test provider creation with valid Ollama configuration."""
    response = await client.post(
        "/api/v1/providers",
        json={
            "name": "Ollama Local",
            "type": "ollama",
            "base_url": "http://localhost:11434",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Ollama Local"
    assert data["type"] == "ollama"
    assert data["validation_status"] == "validating"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_provider_openai_valid(client: AsyncClient):
    """Test provider creation with valid OpenAI configuration."""
    response = await client.post(
        "/api/v1/providers",
        json={
            "name": "OpenAI GPT-4",
            "type": "openai",
            "api_key": "sk-test-key-12345",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "OpenAI GPT-4"
    assert data["type"] == "openai"
    assert data["validation_status"] == "validating"
    assert "api_key_encrypted" not in data  # Should not expose encrypted key


@pytest.mark.asyncio
async def test_create_provider_missing_required_fields(client: AsyncClient):
    """Test validation error for missing required fields."""
    response = await client.post(
        "/api/v1/providers",
        json={
            "name": "Invalid Provider",
            # Missing 'type' field
        },
    )
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_create_provider_duplicate_name(client: AsyncClient):
    """Test 409 conflict for duplicate provider name."""
    # Create first provider
    await client.post(
        "/api/v1/providers",
        json={
            "name": "Duplicate Test",
            "type": "ollama",
            "base_url": "http://localhost:11434",
        },
    )

    # Try creating duplicate
    response = await client.post(
        "/api/v1/providers",
        json={
            "name": "Duplicate Test",
            "type": "ollama",
            "base_url": "http://localhost:11434",
        },
    )
    assert response.status_code == 409
    data = response.json()
    assert "error" in data or "detail" in data
