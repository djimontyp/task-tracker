"""Contract tests for POST /api/tasks endpoint."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_task_with_valid_schema(client: AsyncClient):
    """Test task creation with valid Pydantic schema."""
    response = await client.post(
        "/api/tasks",
        json={
            "name": "Message Classification",
            "description": "Classify messages into categories",
            "response_schema": {
                "$schema": "http://json-schema.org/draft-07/schema#",
                "type": "object",
                "title": "MessageClassification",
                "properties": {
                    "category": {
                        "type": "string",
                        "enum": ["bug", "feature", "question", "discussion"],
                    },
                    "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                },
                "required": ["category", "confidence"],
            },
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Message Classification"
    assert "response_schema" in data
    assert "id" in data


@pytest.mark.asyncio
async def test_create_task_schema_validation(client: AsyncClient):
    """Test schema validation (FR-029)."""
    # Valid schema should pass
    response = await client.post(
        "/api/tasks",
        json={
            "name": "Valid Schema Task",
            "response_schema": {
                "type": "object",
                "properties": {"field": {"type": "string"}},
            },
        },
    )
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_create_task_invalid_json_schema(client: AsyncClient):
    """Test 400 error for invalid JSON Schema."""
    response = await client.post(
        "/api/tasks",
        json={
            "name": "Invalid Schema Task",
            "response_schema": {
                "type": "invalid_type",  # Invalid schema type
                "properties": "not_an_object",  # Should be object
            },
        },
    )
    assert response.status_code == 400
    data = response.json()
    assert "error" in data or "detail" in data


@pytest.mark.asyncio
async def test_create_task_duplicate_name(client: AsyncClient):
    """Test 409 conflict for duplicate task name."""
    # Create first task
    await client.post(
        "/api/tasks",
        json={
            "name": "Duplicate Task",
            "response_schema": {"type": "object", "properties": {}},
        },
    )

    # Try creating duplicate
    response = await client.post(
        "/api/tasks",
        json={
            "name": "Duplicate Task",
            "response_schema": {"type": "object", "properties": {}},
        },
    )
    assert response.status_code == 409
