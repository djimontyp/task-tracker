"""Tests for Ingestion API endpoints.

Covers:
- Message count estimation endpoint (POST /telegram/estimate)
- Depth to datetime mapping
- Multiple chat parallel fetching
- Error handling (rate limits, auth errors)
"""

from datetime import datetime, timedelta
from unittest.mock import AsyncMock, Mock, patch

import pytest
from httpx import AsyncClient

from app.api.v1.ingestion import _estimate_depth_to_datetime
from app.services.source_adapters import MessageCountResult


# ==================== DEPTH MAPPING TESTS ====================


class TestDepthToDatetime:
    """Tests for _estimate_depth_to_datetime helper function."""

    def test_depth_24h_returns_correct_datetime(self):
        """Test 24h depth returns datetime ~24 hours ago."""
        before = datetime.utcnow() - timedelta(hours=24, seconds=5)
        result = _estimate_depth_to_datetime("24h")
        after = datetime.utcnow() - timedelta(hours=24)

        assert result is not None, "Expected datetime, got None"
        assert before <= result <= after, f"24h depth out of range: {result}"

    def test_depth_7d_returns_correct_datetime(self):
        """Test 7d depth returns datetime ~7 days ago."""
        before = datetime.utcnow() - timedelta(days=7, seconds=5)
        result = _estimate_depth_to_datetime("7d")
        after = datetime.utcnow() - timedelta(days=7)

        assert result is not None, "Expected datetime, got None"
        assert before <= result <= after, f"7d depth out of range: {result}"

    def test_depth_30d_returns_correct_datetime(self):
        """Test 30d depth returns datetime ~30 days ago."""
        before = datetime.utcnow() - timedelta(days=30, seconds=5)
        result = _estimate_depth_to_datetime("30d")
        after = datetime.utcnow() - timedelta(days=30)

        assert result is not None, "Expected datetime, got None"
        assert before <= result <= after, f"30d depth out of range: {result}"

    def test_depth_all_returns_none(self):
        """Test 'all' depth returns None (no time filter)."""
        result = _estimate_depth_to_datetime("all")
        assert result is None, f"Expected None for 'all' depth, got {result}"


# ==================== ESTIMATE ENDPOINT TESTS ====================


@pytest.fixture
def mock_adapter():
    """Create mock TelegramSourceAdapter."""
    with patch("app.api.v1.ingestion.TelegramSourceAdapter") as MockAdapter:
        adapter_instance = Mock()
        MockAdapter.return_value = adapter_instance
        yield adapter_instance


@pytest.mark.asyncio
async def test_estimate_single_chat_success(client: AsyncClient, mock_adapter):
    """Test successful message count estimate for single chat."""
    # Setup
    chat_id = "-1002988379206"
    mock_adapter.get_message_count = AsyncMock(
        return_value=MessageCountResult(
            count=4721,
            is_estimate=False,
            error=None,
            source_id=chat_id,
        )
    )

    # Execute
    response = await client.post(
        "/api/v1/ingestion/telegram/estimate",
        json={"chat_ids": [chat_id], "depth": "7d"},
    )

    # Assert
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"
    data = response.json()

    assert data["depth"] == "7d", f"Expected depth '7d', got {data['depth']}"
    assert len(data["estimates"]) == 1, f"Expected 1 estimate, got {len(data['estimates'])}"

    estimate = data["estimates"][0]
    assert estimate["source_id"] == chat_id, f"Expected source_id {chat_id}, got {estimate['source_id']}"
    assert estimate["count"] == 4721, f"Expected count 4721, got {estimate['count']}"
    assert estimate["is_estimate"] is False, "Expected is_estimate=False"
    assert estimate["error"] is None, f"Expected no error, got {estimate['error']}"

    assert data["total_count"] == 4721, f"Expected total_count 4721, got {data['total_count']}"


@pytest.mark.asyncio
async def test_estimate_multiple_chats_success(client: AsyncClient, mock_adapter):
    """Test successful message count estimate for multiple chats."""
    # Setup
    chat_ids = ["-1001", "-1002", "-1003"]
    counts = [100, 200, 300]

    async def mock_get_count(chat_id, since=None):
        idx = chat_ids.index(chat_id)
        return MessageCountResult(
            count=counts[idx],
            is_estimate=False,
            error=None,
            source_id=chat_id,
        )

    mock_adapter.get_message_count = AsyncMock(side_effect=mock_get_count)

    # Execute
    response = await client.post(
        "/api/v1/ingestion/telegram/estimate",
        json={"chat_ids": chat_ids, "depth": "24h"},
    )

    # Assert
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"
    data = response.json()

    assert len(data["estimates"]) == 3, f"Expected 3 estimates, got {len(data['estimates'])}"
    assert data["total_count"] == 600, f"Expected total 600, got {data['total_count']}"


@pytest.mark.asyncio
async def test_estimate_with_rate_limit_error(client: AsyncClient, mock_adapter):
    """Test estimate with rate limit error returns error per-chat."""
    # Setup
    chat_id = "-1002988379206"
    mock_adapter.get_message_count = AsyncMock(
        return_value=MessageCountResult(
            count=None,
            is_estimate=False,
            error="Rate limited. Try again in 42 seconds.",
            source_id=chat_id,
        )
    )

    # Execute
    response = await client.post(
        "/api/v1/ingestion/telegram/estimate",
        json={"chat_ids": [chat_id], "depth": "7d"},
    )

    # Assert
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"
    data = response.json()

    estimate = data["estimates"][0]
    assert estimate["count"] is None, f"Expected None count on error, got {estimate['count']}"
    assert estimate["error"] is not None, "Expected error message"
    assert "42" in estimate["error"], f"Expected '42' in error, got {estimate['error']}"

    # Total should be None when any chat failed
    assert data["total_count"] is None, f"Expected None total on error, got {data['total_count']}"


@pytest.mark.asyncio
async def test_estimate_mixed_success_and_error(client: AsyncClient, mock_adapter):
    """Test estimate with some successes and some errors."""
    # Setup
    async def mock_get_count(chat_id, since=None):
        if chat_id == "-1001":
            return MessageCountResult(count=500, is_estimate=False, error=None, source_id=chat_id)
        else:
            return MessageCountResult(count=None, is_estimate=False, error="Auth error", source_id=chat_id)

    mock_adapter.get_message_count = AsyncMock(side_effect=mock_get_count)

    # Execute
    response = await client.post(
        "/api/v1/ingestion/telegram/estimate",
        json={"chat_ids": ["-1001", "-1002"], "depth": "30d"},
    )

    # Assert
    assert response.status_code == 200
    data = response.json()

    assert len(data["estimates"]) == 2
    # Total should be None because one failed
    assert data["total_count"] is None, f"Expected None when one failed, got {data['total_count']}"


@pytest.mark.asyncio
async def test_estimate_default_depth_is_7d(client: AsyncClient, mock_adapter):
    """Test that default depth is 7d when not specified."""
    # Setup
    mock_adapter.get_message_count = AsyncMock(
        return_value=MessageCountResult(count=100, is_estimate=False, error=None, source_id="-1001")
    )

    # Execute (no depth specified)
    response = await client.post(
        "/api/v1/ingestion/telegram/estimate",
        json={"chat_ids": ["-1001"]},
    )

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["depth"] == "7d", f"Expected default depth '7d', got {data['depth']}"


@pytest.mark.asyncio
async def test_estimate_depth_all_passes_none_to_adapter(client: AsyncClient, mock_adapter):
    """Test that depth=all passes None (no time filter) to adapter."""
    # Setup
    captured_since = None

    async def capture_since(chat_id, since=None):
        nonlocal captured_since
        captured_since = since
        return MessageCountResult(count=1000, is_estimate=False, error=None, source_id=chat_id)

    mock_adapter.get_message_count = AsyncMock(side_effect=capture_since)

    # Execute
    response = await client.post(
        "/api/v1/ingestion/telegram/estimate",
        json={"chat_ids": ["-1001"], "depth": "all"},
    )

    # Assert
    assert response.status_code == 200
    assert captured_since is None, f"Expected None (no filter) for 'all', got {captured_since}"


@pytest.mark.asyncio
async def test_estimate_depth_24h_passes_datetime_to_adapter(client: AsyncClient, mock_adapter):
    """Test that depth=24h passes correct datetime to adapter."""
    # Setup
    captured_since = None

    async def capture_since(chat_id, since=None):
        nonlocal captured_since
        captured_since = since
        return MessageCountResult(count=50, is_estimate=False, error=None, source_id=chat_id)

    mock_adapter.get_message_count = AsyncMock(side_effect=capture_since)

    # Execute
    before = datetime.utcnow() - timedelta(hours=24)
    response = await client.post(
        "/api/v1/ingestion/telegram/estimate",
        json={"chat_ids": ["-1001"], "depth": "24h"},
    )
    after = datetime.utcnow() - timedelta(hours=24)

    # Assert
    assert response.status_code == 200
    assert captured_since is not None, "Expected datetime for '24h' depth"
    # Allow 5 second tolerance
    assert before - timedelta(seconds=5) <= captured_since <= after + timedelta(seconds=5), (
        f"Expected datetime ~24h ago, got {captured_since}"
    )


@pytest.mark.asyncio
async def test_estimate_is_estimate_flag_preserved(client: AsyncClient, mock_adapter):
    """Test that is_estimate flag is preserved from adapter."""
    # Setup
    mock_adapter.get_message_count = AsyncMock(
        return_value=MessageCountResult(
            count=4721,
            is_estimate=True,  # Adapter says this is approximate
            error=None,
            source_id="-1001",
        )
    )

    # Execute
    response = await client.post(
        "/api/v1/ingestion/telegram/estimate",
        json={"chat_ids": ["-1001"], "depth": "30d"},
    )

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["estimates"][0]["is_estimate"] is True, "Expected is_estimate=True to be preserved"


@pytest.mark.asyncio
async def test_estimate_empty_chat_ids_rejected(client: AsyncClient):
    """Test that empty chat_ids list is rejected."""
    # Execute
    response = await client.post(
        "/api/v1/ingestion/telegram/estimate",
        json={"chat_ids": [], "depth": "7d"},
    )

    # Assert
    assert response.status_code == 422, f"Expected 422 for empty list, got {response.status_code}"


@pytest.mark.asyncio
async def test_estimate_invalid_depth_rejected(client: AsyncClient):
    """Test that invalid depth value is rejected."""
    # Execute
    response = await client.post(
        "/api/v1/ingestion/telegram/estimate",
        json={"chat_ids": ["-1001"], "depth": "1y"},
    )

    # Assert
    assert response.status_code == 422, f"Expected 422 for invalid depth, got {response.status_code}"


@pytest.mark.asyncio
async def test_estimate_skip_depth_not_allowed(client: AsyncClient):
    """Test that 'skip' depth is not allowed for estimate endpoint."""
    # Execute
    response = await client.post(
        "/api/v1/ingestion/telegram/estimate",
        json={"chat_ids": ["-1001"], "depth": "skip"},
    )

    # Assert - 'skip' is not in EstimateDepth
    assert response.status_code == 422, f"Expected 422 for 'skip' depth, got {response.status_code}"


# ==================== GET ESTIMATE ENDPOINT TESTS ====================


@pytest.mark.asyncio
async def test_get_estimate_single_chat_success(client: AsyncClient, mock_adapter):
    """Test GET estimate for single chat returns correct response."""
    # Setup
    chat_id = "-1002988379206"
    mock_adapter.get_message_count = AsyncMock(
        return_value=MessageCountResult(
            count=4721,
            is_estimate=False,
            error=None,
            source_id=chat_id,
        )
    )

    # Execute - use chat_ids[] query param syntax
    response = await client.get(
        "/api/v1/ingestion/telegram/estimate",
        params={"chat_ids[]": [chat_id], "depth": "7d"},
    )

    # Assert
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"
    data = response.json()

    assert len(data) == 1, f"Expected 1 estimate, got {len(data)}"
    estimate = data[0]
    assert estimate["chat_id"] == chat_id, f"Expected chat_id {chat_id}, got {estimate['chat_id']}"
    assert estimate["count"] == 4721, f"Expected count 4721, got {estimate['count']}"
    assert estimate["is_estimate"] is False, "Expected is_estimate=False"
    assert estimate["error"] is None, f"Expected no error, got {estimate['error']}"


@pytest.mark.asyncio
async def test_get_estimate_multiple_chats_success(client: AsyncClient, mock_adapter):
    """Test GET estimate for multiple chats returns all results."""
    # Setup
    chat_ids = ["-1001", "-1002", "-1003"]
    counts = [100, 200, 300]

    async def mock_get_count(chat_id, since=None):
        idx = chat_ids.index(chat_id)
        return MessageCountResult(
            count=counts[idx],
            is_estimate=False,
            error=None,
            source_id=chat_id,
        )

    mock_adapter.get_message_count = AsyncMock(side_effect=mock_get_count)

    # Execute
    response = await client.get(
        "/api/v1/ingestion/telegram/estimate",
        params={"chat_ids[]": chat_ids, "depth": "24h"},
    )

    # Assert
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"
    data = response.json()

    assert len(data) == 3, f"Expected 3 estimates, got {len(data)}"

    # Verify each estimate
    for i, estimate in enumerate(data):
        assert estimate["chat_id"] == chat_ids[i], f"Expected chat_id {chat_ids[i]}"
        assert estimate["count"] == counts[i], f"Expected count {counts[i]}"


@pytest.mark.asyncio
async def test_get_estimate_skip_depth_returns_zero_counts(client: AsyncClient, mock_adapter):
    """Test GET estimate with skip depth returns zero counts without API calls."""
    # Setup
    chat_ids = ["-1001", "-1002"]

    # Execute
    response = await client.get(
        "/api/v1/ingestion/telegram/estimate",
        params={"chat_ids[]": chat_ids, "depth": "skip"},
    )

    # Assert
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"
    data = response.json()

    assert len(data) == 2, f"Expected 2 estimates, got {len(data)}"
    for estimate in data:
        assert estimate["count"] == 0, f"Expected count=0 for skip, got {estimate['count']}"
        assert estimate["is_estimate"] is False, "Expected is_estimate=False for skip"
        assert estimate["error"] is None, "Expected no error for skip"

    # Verify adapter was NOT called (skip bypasses API)
    mock_adapter.get_message_count.assert_not_called()


@pytest.mark.asyncio
async def test_get_estimate_rate_limit_returns_error_per_chat(client: AsyncClient, mock_adapter):
    """Test GET estimate with rate limit returns error in response, not HTTP error."""
    # Setup
    chat_id = "-1002988379206"
    mock_adapter.get_message_count = AsyncMock(
        return_value=MessageCountResult(
            count=None,
            is_estimate=False,
            error="Rate limited. Try again in 42 seconds.",
            source_id=chat_id,
        )
    )

    # Execute
    response = await client.get(
        "/api/v1/ingestion/telegram/estimate",
        params={"chat_ids[]": [chat_id], "depth": "7d"},
    )

    # Assert - Should be 200 with error in response body
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"
    data = response.json()

    estimate = data[0]
    assert estimate["count"] is None, f"Expected None count on error, got {estimate['count']}"
    assert estimate["error"] is not None, "Expected error message"
    assert "42" in estimate["error"], f"Expected '42' in error, got {estimate['error']}"


@pytest.mark.asyncio
async def test_get_estimate_partial_results_on_mixed_errors(client: AsyncClient, mock_adapter):
    """Test GET estimate returns partial results when some chats fail."""
    # Setup
    async def mock_get_count(chat_id, since=None):
        if chat_id == "-1001":
            return MessageCountResult(count=500, is_estimate=False, error=None, source_id=chat_id)
        else:
            return MessageCountResult(count=None, is_estimate=False, error="Auth error", source_id=chat_id)

    mock_adapter.get_message_count = AsyncMock(side_effect=mock_get_count)

    # Execute
    response = await client.get(
        "/api/v1/ingestion/telegram/estimate",
        params={"chat_ids[]": ["-1001", "-1002"], "depth": "30d"},
    )

    # Assert
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()

    assert len(data) == 2, f"Expected 2 estimates, got {len(data)}"

    # First chat succeeded
    assert data[0]["count"] == 500, f"Expected 500, got {data[0]['count']}"
    assert data[0]["error"] is None

    # Second chat failed
    assert data[1]["count"] is None
    assert data[1]["error"] == "Auth error"


@pytest.mark.asyncio
async def test_get_estimate_default_depth_is_7d(client: AsyncClient, mock_adapter):
    """Test GET estimate uses 7d as default depth."""
    # Setup
    captured_since = None

    async def capture_since(chat_id, since=None):
        nonlocal captured_since
        captured_since = since
        return MessageCountResult(count=100, is_estimate=False, error=None, source_id=chat_id)

    mock_adapter.get_message_count = AsyncMock(side_effect=capture_since)

    # Execute (no depth specified)
    response = await client.get(
        "/api/v1/ingestion/telegram/estimate",
        params={"chat_ids[]": ["-1001"]},
    )

    # Assert
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    # Verify since is approximately 7 days ago
    assert captured_since is not None, "Expected datetime for default 7d depth"
    expected = datetime.utcnow() - timedelta(days=7)
    assert abs((captured_since - expected).total_seconds()) < 10, (
        f"Expected datetime ~7d ago, got {captured_since}"
    )


@pytest.mark.asyncio
async def test_get_estimate_all_depth_passes_none(client: AsyncClient, mock_adapter):
    """Test GET estimate with depth=all passes None to adapter (no time filter)."""
    # Setup
    captured_since = None

    async def capture_since(chat_id, since=None):
        nonlocal captured_since
        captured_since = since
        return MessageCountResult(count=1000, is_estimate=False, error=None, source_id=chat_id)

    mock_adapter.get_message_count = AsyncMock(side_effect=capture_since)

    # Execute
    response = await client.get(
        "/api/v1/ingestion/telegram/estimate",
        params={"chat_ids[]": ["-1001"], "depth": "all"},
    )

    # Assert
    assert response.status_code == 200
    assert captured_since is None, f"Expected None (no filter) for 'all', got {captured_since}"


@pytest.mark.asyncio
async def test_get_estimate_is_estimate_flag_preserved(client: AsyncClient, mock_adapter):
    """Test GET estimate preserves is_estimate flag from adapter."""
    # Setup
    mock_adapter.get_message_count = AsyncMock(
        return_value=MessageCountResult(
            count=4721,
            is_estimate=True,  # Adapter says this is approximate
            error=None,
            source_id="-1001",
        )
    )

    # Execute
    response = await client.get(
        "/api/v1/ingestion/telegram/estimate",
        params={"chat_ids[]": ["-1001"], "depth": "30d"},
    )

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data[0]["is_estimate"] is True, "Expected is_estimate=True to be preserved"


@pytest.mark.asyncio
async def test_get_estimate_empty_chat_ids_rejected(client: AsyncClient):
    """Test GET estimate rejects empty chat_ids list."""
    # Execute - empty list
    response = await client.get(
        "/api/v1/ingestion/telegram/estimate",
        params={"depth": "7d"},
    )

    # Assert - Should be 422 (validation error)
    assert response.status_code == 422, f"Expected 422 for empty list, got {response.status_code}"


@pytest.mark.asyncio
async def test_get_estimate_invalid_depth_rejected(client: AsyncClient):
    """Test GET estimate rejects invalid depth value."""
    # Execute
    response = await client.get(
        "/api/v1/ingestion/telegram/estimate",
        params={"chat_ids[]": ["-1001"], "depth": "1y"},
    )

    # Assert
    assert response.status_code == 422, f"Expected 422 for invalid depth, got {response.status_code}"


@pytest.mark.asyncio
async def test_get_estimate_24h_passes_correct_datetime(client: AsyncClient, mock_adapter):
    """Test GET estimate with depth=24h passes datetime ~24 hours ago."""
    # Setup
    captured_since = None

    async def capture_since(chat_id, since=None):
        nonlocal captured_since
        captured_since = since
        return MessageCountResult(count=50, is_estimate=False, error=None, source_id=chat_id)

    mock_adapter.get_message_count = AsyncMock(side_effect=capture_since)

    # Execute
    before = datetime.utcnow() - timedelta(hours=24)
    response = await client.get(
        "/api/v1/ingestion/telegram/estimate",
        params={"chat_ids[]": ["-1001"], "depth": "24h"},
    )
    after = datetime.utcnow() - timedelta(hours=24)

    # Assert
    assert response.status_code == 200
    assert captured_since is not None, "Expected datetime for '24h' depth"
    # Allow 5 second tolerance
    assert before - timedelta(seconds=5) <= captured_since <= after + timedelta(seconds=5), (
        f"Expected datetime ~24h ago, got {captured_since}"
    )


# ==================== INGESTION ENDPOINT TESTS ====================


from app.api.v1.ingestion import DEPTH_TO_TIMEDELTA, depth_to_offset_date


class TestDepthToOffsetDate:
    """Tests for depth_to_offset_date conversion function."""

    def test_depth_skip_returns_none(self) -> None:
        """Skip depth should return None (special case - no import)."""
        result = depth_to_offset_date("skip")
        assert result is None, "Skip depth should return None"

    def test_depth_all_returns_none(self) -> None:
        """All depth should return None (no time filter)."""
        result = depth_to_offset_date("all")
        assert result is None, "All depth should return None for no time filter"

    def test_depth_24h_returns_correct_datetime(self) -> None:
        """24h depth should return datetime ~24 hours ago."""
        before = datetime.utcnow() - timedelta(hours=24, seconds=5)
        result = depth_to_offset_date("24h")
        after = datetime.utcnow() - timedelta(hours=24)

        assert result is not None, "Expected datetime, got None"
        assert before <= result <= after, f"24h depth out of range: {result}"

    def test_depth_7d_returns_correct_datetime(self) -> None:
        """7d depth should return datetime ~7 days ago."""
        before = datetime.utcnow() - timedelta(days=7, seconds=5)
        result = depth_to_offset_date("7d")
        after = datetime.utcnow() - timedelta(days=7)

        assert result is not None, "Expected datetime, got None"
        assert before <= result <= after, f"7d depth out of range: {result}"

    def test_depth_30d_returns_correct_datetime(self) -> None:
        """30d depth should return datetime ~30 days ago."""
        before = datetime.utcnow() - timedelta(days=30, seconds=5)
        result = depth_to_offset_date("30d")
        after = datetime.utcnow() - timedelta(days=30)

        assert result is not None, "Expected datetime, got None"
        assert before <= result <= after, f"30d depth out of range: {result}"


class TestDepthToTimedeltaMapping:
    """Tests for DEPTH_TO_TIMEDELTA constant mapping."""

    def test_skip_maps_to_none(self) -> None:
        """Skip should map to None."""
        assert DEPTH_TO_TIMEDELTA["skip"] is None

    def test_all_maps_to_none(self) -> None:
        """All should map to None (no time filter)."""
        assert DEPTH_TO_TIMEDELTA["all"] is None

    def test_24h_maps_to_24_hours(self) -> None:
        """24h should map to timedelta of 24 hours."""
        assert DEPTH_TO_TIMEDELTA["24h"] == timedelta(hours=24)

    def test_7d_maps_to_7_days(self) -> None:
        """7d should map to timedelta of 7 days."""
        assert DEPTH_TO_TIMEDELTA["7d"] == timedelta(days=7)

    def test_30d_maps_to_30_days(self) -> None:
        """30d should map to timedelta of 30 days."""
        assert DEPTH_TO_TIMEDELTA["30d"] == timedelta(days=30)

    def test_all_depth_options_covered(self) -> None:
        """All DepthOption values should be covered in mapping."""
        expected_keys = {"skip", "24h", "7d", "30d", "all"}
        assert set(DEPTH_TO_TIMEDELTA.keys()) == expected_keys, (
            f"Missing keys: {expected_keys - set(DEPTH_TO_TIMEDELTA.keys())}"
        )


class TestStartTelegramIngestion:
    """Tests for POST /api/v1/ingestion/telegram endpoint with depth parameter."""

    @pytest.mark.asyncio
    @patch("app.api.v1.ingestion.ingest_telegram_messages_task")
    async def test_skip_depth_returns_skipped_status(
        self, mock_task: AsyncMock, client: AsyncClient
    ) -> None:
        """Skip depth should return immediately without creating job."""
        mock_task.kiq = AsyncMock()

        response = await client.post(
            "/api/v1/ingestion/telegram",
            json={"chat_ids": ["-1001234567890"], "depth": "skip"},
        )

        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"
        data = response.json()
        assert data["status"] == "skipped", f"Expected 'skipped', got '{data['status']}'"
        assert data["job_id"] == 0, "Skip should return job_id=0"
        assert "skipped" in data["message"].lower(), f"Message should mention 'skipped': {data['message']}"

        # Task should NOT be called for skip
        mock_task.kiq.assert_not_called()

    @pytest.mark.asyncio
    @patch("app.api.v1.ingestion.ingest_telegram_messages_task")
    async def test_default_depth_is_7d(
        self, mock_task: AsyncMock, client: AsyncClient
    ) -> None:
        """Default depth should be 7d when not specified."""
        mock_task.kiq = AsyncMock()

        response = await client.post(
            "/api/v1/ingestion/telegram",
            json={"chat_ids": ["-1001234567890"]},
        )

        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"
        data = response.json()
        assert data["status"] == "pending", f"Expected 'pending', got '{data['status']}'"
        assert data["job_id"] > 0, "Should create a job with valid ID"
        assert "7d" in data["message"], f"Message should mention '7d': {data['message']}"

        # Verify task was called with offset_date_iso
        mock_task.kiq.assert_called_once()
        call_kwargs = mock_task.kiq.call_args.kwargs
        assert "offset_date_iso" in call_kwargs, "Should pass offset_date_iso to task"
        assert call_kwargs["offset_date_iso"] is not None, "7d should have offset_date"

    @pytest.mark.asyncio
    @patch("app.api.v1.ingestion.ingest_telegram_messages_task")
    async def test_all_depth_has_no_offset_date(
        self, mock_task: AsyncMock, client: AsyncClient
    ) -> None:
        """All depth should not have offset_date filter."""
        mock_task.kiq = AsyncMock()

        response = await client.post(
            "/api/v1/ingestion/telegram",
            json={"chat_ids": ["-1001234567890"], "depth": "all"},
        )

        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"
        data = response.json()
        assert data["status"] == "pending"
        assert "all available" in data["message"], f"Message should mention 'all available': {data['message']}"

        # Verify task was called with offset_date_iso=None
        mock_task.kiq.assert_called_once()
        call_kwargs = mock_task.kiq.call_args.kwargs
        assert call_kwargs["offset_date_iso"] is None, "All depth should have offset_date_iso=None"

    @pytest.mark.asyncio
    @patch("app.api.v1.ingestion.ingest_telegram_messages_task")
    async def test_24h_depth_creates_correct_offset(
        self, mock_task: AsyncMock, client: AsyncClient
    ) -> None:
        """24h depth should create offset_date ~24 hours ago."""
        mock_task.kiq = AsyncMock()

        before = datetime.utcnow() - timedelta(hours=24)
        response = await client.post(
            "/api/v1/ingestion/telegram",
            json={"chat_ids": ["-1001234567890"], "depth": "24h"},
        )
        after = datetime.utcnow() - timedelta(hours=24)

        assert response.status_code == 200
        data = response.json()
        assert "24h" in data["message"]

        # Verify offset_date_iso is correct (within tolerance)
        call_kwargs = mock_task.kiq.call_args.kwargs
        offset_date = datetime.fromisoformat(call_kwargs["offset_date_iso"])
        assert before - timedelta(seconds=5) <= offset_date <= after + timedelta(seconds=5), (
            f"Expected offset_date ~24h ago, got {offset_date}"
        )

    @pytest.mark.asyncio
    async def test_invalid_depth_returns_validation_error(
        self, client: AsyncClient
    ) -> None:
        """Invalid depth value should return 422 validation error."""
        response = await client.post(
            "/api/v1/ingestion/telegram",
            json={"chat_ids": ["-1001234567890"], "depth": "invalid"},
        )

        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.json()}"

    @pytest.mark.asyncio
    @patch("app.api.v1.ingestion.ingest_telegram_messages_task")
    async def test_job_stores_depth_metadata(
        self, mock_task: AsyncMock, client: AsyncClient
    ) -> None:
        """Job should store depth in source_identifiers metadata."""
        mock_task.kiq = AsyncMock()

        response = await client.post(
            "/api/v1/ingestion/telegram",
            json={"chat_ids": ["-1001234567890"], "depth": "30d"},
        )

        assert response.status_code == 200
        job_id = response.json()["job_id"]

        # Verify job was created with depth metadata
        job_response = await client.get(f"/api/v1/ingestion/jobs/{job_id}")
        assert job_response.status_code == 200
        job_data = job_response.json()

        source_identifiers = job_data.get("source_identifiers", {})
        assert source_identifiers.get("depth") == "30d", (
            f"Job should store depth=30d in source_identifiers, got: {source_identifiers}"
        )
        assert "offset_date" in source_identifiers, (
            "Job should store offset_date in source_identifiers"
        )

    @pytest.mark.asyncio
    @patch("app.api.v1.ingestion.ingest_telegram_messages_task")
    async def test_multiple_chat_ids_with_depth(
        self, mock_task: AsyncMock, client: AsyncClient
    ) -> None:
        """Multiple chat IDs should all use the same depth."""
        mock_task.kiq = AsyncMock()

        chat_ids = ["-1001234567890", "-1009876543210", "-1001111111111"]
        response = await client.post(
            "/api/v1/ingestion/telegram",
            json={"chat_ids": chat_ids, "depth": "7d"},
        )

        assert response.status_code == 200
        data = response.json()
        assert f"{len(chat_ids)} chat(s)" in data["message"]

        # Verify task was called with all chat_ids
        call_kwargs = mock_task.kiq.call_args.kwargs
        assert call_kwargs["chat_ids"] == chat_ids


class TestListIngestionJobs:
    """Tests for GET /api/v1/ingestion/jobs endpoint."""

    @pytest.mark.asyncio
    @patch("app.api.v1.ingestion.ingest_telegram_messages_task")
    async def test_list_jobs_includes_depth_metadata(
        self, mock_task: AsyncMock, client: AsyncClient
    ) -> None:
        """Listed jobs should include depth in source_identifiers."""
        mock_task.kiq = AsyncMock()

        # Create jobs with different depths
        for depth in ["24h", "7d", "30d"]:
            await client.post(
                "/api/v1/ingestion/telegram",
                json={"chat_ids": [f"-100{depth}"], "depth": depth},
            )

        response = await client.get("/api/v1/ingestion/jobs")
        assert response.status_code == 200
        jobs = response.json()

        assert len(jobs) >= 3, f"Expected at least 3 jobs, got {len(jobs)}"

        # Verify each job has depth in source_identifiers
        for job in jobs[:3]:  # Check the 3 we created
            source_identifiers = job.get("source_identifiers", {})
            assert "depth" in source_identifiers, f"Job {job['id']} missing depth in source_identifiers"
