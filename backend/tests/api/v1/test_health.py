"""Comprehensive tests for Health API endpoints.

This test module provides complete coverage for all /api/v1/health endpoints including:
- Health check endpoint (GET /api/v1/health)
- Client config endpoint (GET /api/v1/config)
- Test task endpoint (POST /api/v1/test-task)
"""

from datetime import datetime

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check_returns_healthy_status(client: AsyncClient) -> None:
    """Test health check returns 200 with healthy status."""
    response = await client.get("/api/v1/health")

    assert response.status_code == 200, f"Health check failed: {response.json()}"
    data = response.json()
    assert "status" in data, "Response missing 'status' field"
    assert data["status"] == "healthy", f"Expected 'healthy', got '{data['status']}'"


@pytest.mark.asyncio
async def test_health_check_includes_timestamp(client: AsyncClient) -> None:
    """Test health check response includes timestamp."""
    response = await client.get("/api/v1/health")

    assert response.status_code == 200, f"Health check failed: {response.json()}"
    data = response.json()
    assert "timestamp" in data, "Response missing 'timestamp' field"

    # Verify timestamp is a valid ISO format datetime string
    timestamp_str = data["timestamp"]
    try:
        parsed_timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        assert isinstance(parsed_timestamp, datetime), "Timestamp is not a valid datetime"
    except ValueError as e:
        pytest.fail(f"Invalid timestamp format: {timestamp_str}, error: {e}")


@pytest.mark.asyncio
async def test_health_check_response_structure(client: AsyncClient) -> None:
    """Test health check response has correct structure."""
    response = await client.get("/api/v1/health")

    assert response.status_code == 200
    data = response.json()

    # Verify required fields
    assert "status" in data
    assert "timestamp" in data

    # Verify field types
    assert isinstance(data["status"], str)
    assert isinstance(data["timestamp"], str)


@pytest.mark.asyncio
async def test_health_check_multiple_requests(client: AsyncClient) -> None:
    """Test health check can handle multiple consecutive requests."""
    responses = []

    # Make 5 consecutive health check requests
    for _ in range(5):
        response = await client.get("/api/v1/health")
        responses.append(response)

    # All requests should succeed
    for i, response in enumerate(responses):
        assert response.status_code == 200, f"Request {i + 1} failed: {response.json()}"
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data


@pytest.mark.asyncio
async def test_config_returns_websocket_url(client: AsyncClient) -> None:
    """Test config endpoint returns WebSocket URL."""
    response = await client.get("/api/v1/config")

    assert response.status_code == 200, f"Config request failed: {response.json()}"
    data = response.json()
    assert "wsUrl" in data, "Response missing 'wsUrl' field"
    assert data["wsUrl"].startswith("ws://") or data["wsUrl"].startswith("wss://"), \
        f"Invalid WebSocket URL scheme: {data['wsUrl']}"


@pytest.mark.asyncio
async def test_config_returns_api_base_url(client: AsyncClient) -> None:
    """Test config endpoint returns API base URL."""
    response = await client.get("/api/v1/config")

    assert response.status_code == 200
    data = response.json()
    assert "apiBaseUrl" in data, "Response missing 'apiBaseUrl' field"
    assert data["apiBaseUrl"].startswith("http://") or data["apiBaseUrl"].startswith("https://"), \
        f"Invalid API base URL scheme: {data['apiBaseUrl']}"


@pytest.mark.asyncio
async def test_config_response_structure(client: AsyncClient) -> None:
    """Test config endpoint response has correct structure."""
    response = await client.get("/api/v1/config")

    assert response.status_code == 200
    data = response.json()

    # Verify required fields
    assert "wsUrl" in data
    assert "apiBaseUrl" in data

    # Verify field types
    assert isinstance(data["wsUrl"], str)
    assert isinstance(data["apiBaseUrl"], str)


@pytest.mark.asyncio
async def test_config_without_nginx_proxy(client: AsyncClient) -> None:
    """Test config endpoint without X-Forwarded-* headers (local development)."""
    response = await client.get("/api/v1/config")

    assert response.status_code == 200
    data = response.json()

    # Without nginx proxy, should fall back to localhost
    assert "localhost" in data["wsUrl"] or "test" in data["wsUrl"], \
        f"Expected localhost/test in wsUrl, got: {data['wsUrl']}"
    assert "localhost" in data["apiBaseUrl"] or "test" in data["apiBaseUrl"], \
        f"Expected localhost/test in apiBaseUrl, got: {data['apiBaseUrl']}"


@pytest.mark.asyncio
async def test_config_with_forwarded_host_header(client: AsyncClient) -> None:
    """Test config endpoint with X-Forwarded-Host header (nginx proxy)."""
    headers = {"X-Forwarded-Host": "example.com"}
    response = await client.get("/api/v1/config", headers=headers)

    assert response.status_code == 200
    data = response.json()

    # Should use forwarded host
    assert "example.com" in data["wsUrl"], f"Expected example.com in wsUrl, got: {data['wsUrl']}"
    assert "example.com" in data["apiBaseUrl"], f"Expected example.com in apiBaseUrl, got: {data['apiBaseUrl']}"


@pytest.mark.asyncio
async def test_config_with_forwarded_proto_https(client: AsyncClient) -> None:
    """Test config endpoint with X-Forwarded-Proto: https."""
    headers = {
        "X-Forwarded-Host": "secure.example.com",
        "X-Forwarded-Proto": "https"
    }
    response = await client.get("/api/v1/config", headers=headers)

    assert response.status_code == 200
    data = response.json()

    # Should use wss:// for WebSocket and https:// for API
    assert data["wsUrl"].startswith("wss://"), f"Expected wss:// scheme, got: {data['wsUrl']}"
    assert data["apiBaseUrl"].startswith("https://"), f"Expected https:// scheme, got: {data['apiBaseUrl']}"


@pytest.mark.asyncio
async def test_config_with_forwarded_proto_http(client: AsyncClient) -> None:
    """Test config endpoint with X-Forwarded-Proto: http."""
    headers = {
        "X-Forwarded-Host": "example.com",
        "X-Forwarded-Proto": "http"
    }
    response = await client.get("/api/v1/config", headers=headers)

    assert response.status_code == 200
    data = response.json()

    # Should use ws:// for WebSocket and http:// for API
    assert data["wsUrl"].startswith("ws://"), f"Expected ws:// scheme, got: {data['wsUrl']}"
    assert data["apiBaseUrl"].startswith("http://"), f"Expected http:// scheme, got: {data['apiBaseUrl']}"


@pytest.mark.asyncio
@pytest.mark.skip(reason="Requires NATS broker connection - integration test only")
async def test_test_task_endpoint_with_default_message_id(client: AsyncClient) -> None:
    """Test triggering a test task with default message_id."""
    response = await client.post("/api/v1/test-task", json={})

    assert response.status_code == 200, f"Test task trigger failed: {response.json()}"
    data = response.json()

    # Verify response structure
    assert "status" in data, "Response missing 'status' field"
    assert data["status"] == "triggered", f"Expected status 'triggered', got '{data['status']}'"
    assert "task_id" in data, "Response missing 'task_id' field"
    assert "message" in data, "Response missing 'message' field"


@pytest.mark.asyncio
@pytest.mark.skip(reason="Requires NATS broker connection - integration test only")
async def test_test_task_endpoint_with_custom_message_id(client: AsyncClient) -> None:
    """Test triggering a test task with custom message_id."""
    payload = {"message_id": 42}
    response = await client.post("/api/v1/test-task", json=payload)

    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "triggered"
    assert "task_id" in data
    assert isinstance(data["task_id"], str), "Task ID should be a string"


@pytest.mark.asyncio
@pytest.mark.skip(reason="Requires NATS broker connection - integration test only")
async def test_test_task_response_includes_monitoring_hint(client: AsyncClient) -> None:
    """Test that test-task response includes monitoring dashboard hint."""
    response = await client.post("/api/v1/test-task", json={})

    assert response.status_code == 200
    data = response.json()

    assert "message" in data
    # Message should mention monitoring dashboard
    assert "monitoring" in data["message"].lower(), \
        f"Expected monitoring hint in message, got: {data['message']}"


@pytest.mark.asyncio
async def test_test_task_with_invalid_message_id_type(client: AsyncClient) -> None:
    """Test validation error for invalid message_id type."""
    payload = {"message_id": "not-a-number"}
    response = await client.post("/api/v1/test-task", json=payload)

    # Should return 422 for validation error
    assert response.status_code == 422, f"Expected 422, got {response.status_code}"
