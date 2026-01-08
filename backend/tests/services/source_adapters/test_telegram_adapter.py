"""Tests for TelegramSourceAdapter.

Covers:
- Message count estimation (with/without time filter)
- Historical message fetching
- Connection testing
- Error handling (rate limits, auth errors)
"""

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, Mock, patch
from typing import Any

import pytest
from telethon.errors import FloodWaitError, AuthKeyError
from telethon.tl.types import Message as TelethonMessage

from app.services.source_adapters import TelegramSourceAdapter, MessageCountResult, ConnectionTestResult
from app.services.telegram_client_service import TelegramClientService


# ==================== FIXTURES ====================


@pytest.fixture
def mock_client_service():
    """Create mock TelegramClientService."""
    service = Mock(spec=TelegramClientService)
    service.client = None
    service.connect = AsyncMock()
    service.disconnect = AsyncMock()
    return service


@pytest.fixture
def mock_telethon_client():
    """Create mock Telethon client."""
    client = AsyncMock()
    client.is_user_authorized = AsyncMock(return_value=True)
    return client


@pytest.fixture
def telegram_adapter(mock_client_service):
    """Create TelegramSourceAdapter with mocked client service."""
    return TelegramSourceAdapter(client_service=mock_client_service)


@pytest.fixture
def mock_telethon_message():
    """Create mock Telethon message.

    Note: Telethon always returns timezone-aware datetimes (UTC),
    so we use datetime.now(timezone.utc) to match real behavior.
    """
    message = Mock(spec=TelethonMessage)
    message.id = 12345
    message.text = "Test message"
    message.date = datetime.now(timezone.utc)
    message.sender_id = 67890
    message.sender = Mock()
    message.sender.first_name = "John"
    message.sender.last_name = "Doe"
    message.sender.username = "johndoe"
    message.sender.lang_code = "en"
    message.sender.bot = False
    return message


# ==================== get_message_count TESTS ====================


@pytest.mark.asyncio
async def test_get_message_count_success_no_filter(telegram_adapter, mock_client_service, mock_telethon_client):
    """Test successful message count fetch without time filter."""
    # Setup
    chat_id = "-1002988379206"
    mock_client_service.client = mock_telethon_client

    # Mock get_messages response
    mock_result = Mock()
    mock_result.total = 4721
    mock_telethon_client.get_messages = AsyncMock(return_value=mock_result)

    # Execute
    result = await telegram_adapter.get_message_count(chat_id)

    # Assert
    assert result.count == 4721, f"Expected 4721, got {result.count}"
    assert result.is_estimate is False, "Total count should be exact"
    assert result.error is None, f"Expected no error, got {result.error}"
    assert result.source_id == chat_id, f"Expected {chat_id}, got {result.source_id}"

    # Verify calls
    mock_client_service.connect.assert_called_once()
    mock_telethon_client.get_messages.assert_called_once_with(int(chat_id), limit=0)
    mock_client_service.disconnect.assert_called_once()


@pytest.mark.asyncio
async def test_get_message_count_with_time_filter_exact(telegram_adapter, mock_client_service, mock_telethon_client):
    """Test message count with time filter (estimate via ID difference)."""
    # Setup
    chat_id = "-1002988379206"
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    mock_client_service.client = mock_telethon_client

    # Mock total count (first call)
    mock_total = Mock()
    mock_total.total = 4721

    # Mock first message after 'since' (second call with reverse=True)
    mock_first_msg = Mock(spec=TelethonMessage)
    mock_first_msg.id = 1000

    # Mock newest message (third call)
    mock_newest_msg = Mock(spec=TelethonMessage)
    mock_newest_msg.id = 1046  # 1046 - 1000 + 1 = 47 messages

    # Setup side_effect: [total, [first_msg], [newest_msg]]
    mock_telethon_client.get_messages = AsyncMock(side_effect=[mock_total, [mock_first_msg], [mock_newest_msg]])

    # Execute
    result = await telegram_adapter.get_message_count(chat_id, since=since)

    # Assert - count is newest_id - first_msg_id + 1 = 1046 - 1000 + 1 = 47
    assert result.count == 47, f"Expected 47, got {result.count}"
    assert result.is_estimate is True, "ID-based count should be estimate"
    assert result.error is None, f"Expected no error, got {result.error}"

    # Verify calls
    assert mock_telethon_client.get_messages.call_count == 3, "Expected 3 calls: total, first_msg, newest_msg"


@pytest.mark.asyncio
async def test_get_message_count_with_time_filter_no_messages(telegram_adapter, mock_client_service, mock_telethon_client):
    """Test message count with time filter when no messages found after since date."""
    # Setup
    chat_id = "-1002988379206"
    since = datetime.now(timezone.utc) - timedelta(hours=1)  # Very recent, no messages
    mock_client_service.client = mock_telethon_client

    # Mock total count
    mock_total = Mock()
    mock_total.total = 4721

    # Mock empty result for first message after 'since'
    empty_result = []

    # Setup side_effect: [total, empty_result]
    mock_telethon_client.get_messages = AsyncMock(side_effect=[mock_total, empty_result])

    # Execute
    result = await telegram_adapter.get_message_count(chat_id, since=since)

    # Assert
    assert result.count == 0, f"Expected 0 when no messages after since, got {result.count}"
    assert result.is_estimate is False, "Count 0 should be exact"
    assert result.error is None, f"Expected no error, got {result.error}"

    # Verify calls
    assert mock_telethon_client.get_messages.call_count == 2, "Expected 2 calls: total, first_msg (empty)"


@pytest.mark.asyncio
async def test_get_message_count_with_time_filter_fallback(telegram_adapter, mock_client_service, mock_telethon_client):
    """Test message count fallback when min_id method fails."""
    # Setup
    chat_id = "-1002988379206"
    since = datetime.now(timezone.utc) - timedelta(days=7)
    mock_client_service.client = mock_telethon_client

    # Mock total count
    mock_total = Mock()
    mock_total.total = 4721

    # Mock first call (total), then error on second call (reverse lookup)
    mock_telethon_client.get_messages = AsyncMock(side_effect=[
        mock_total,
        ValueError("Test error in reverse lookup")
    ])

    # Execute
    result = await telegram_adapter.get_message_count(chat_id, since=since)

    # Assert - should fallback to total with is_estimate=True
    assert result.count == 4721, f"Expected fallback to total, got {result.count}"
    assert result.is_estimate is True, "Fallback count should be estimate"
    assert result.error is None, f"Expected no error (fallback), got {result.error}"


@pytest.mark.asyncio
async def test_get_message_count_rate_limit(telegram_adapter, mock_client_service, mock_telethon_client):
    """Test message count with rate limit error."""
    # Setup
    chat_id = "-1002988379206"
    mock_client_service.client = mock_telethon_client

    # Mock FloodWaitError
    # FloodWaitError requires request arg and capture seconds
    mock_request = Mock()
    flood_error = FloodWaitError(request=mock_request, capture=42)
    mock_telethon_client.get_messages = AsyncMock(side_effect=flood_error)

    # Execute
    result = await telegram_adapter.get_message_count(chat_id)

    # Assert
    assert result.count is None, f"Expected None count on rate limit, got {result.count}"
    assert result.error is not None, "Expected error message on rate limit"
    assert "42" in result.error, f"Expected '42' seconds in error: {result.error}"
    assert result.source_id == chat_id


@pytest.mark.asyncio
async def test_get_message_count_auth_error(telegram_adapter, mock_client_service, mock_telethon_client):
    """Test message count with authentication error."""
    # Setup
    chat_id = "-1002988379206"
    mock_client_service.client = mock_telethon_client

    # Mock AuthKeyError
    # AuthKeyError requires request arg
    mock_request = Mock()
    auth_error = AuthKeyError(request=mock_request, message="AUTH_KEY_UNREGISTERED")
    mock_telethon_client.get_messages = AsyncMock(side_effect=auth_error)

    # Execute
    result = await telegram_adapter.get_message_count(chat_id)

    # Assert
    assert result.count is None, "Expected None count on auth error"
    assert result.error is not None, "Expected error message on auth error"
    assert "expired" in result.error.lower(), f"Expected 'expired' in error: {result.error}"


@pytest.mark.asyncio
async def test_get_message_count_client_not_connected(telegram_adapter, mock_client_service):
    """Test message count when client fails to connect."""
    # Setup
    chat_id = "-1002988379206"
    mock_client_service.client = None  # Connection failed

    # Execute
    result = await telegram_adapter.get_message_count(chat_id)

    # Assert
    assert result.count is None, "Expected None count when client not connected"
    assert result.error is not None, "Expected error message"
    assert "not connected" in result.error.lower(), f"Expected 'not connected' in error: {result.error}"


# ==================== fetch_history TESTS ====================


@pytest.mark.asyncio
async def test_fetch_history_success(telegram_adapter, mock_client_service, mock_telethon_client, mock_telethon_message):
    """Test successful historical message fetching without time filter."""
    # Setup
    chat_id = "-1002988379206"
    mock_client_service.client = mock_telethon_client

    # Mock iter_messages returning 3 messages
    messages = [mock_telethon_message for _ in range(3)]

    async def mock_iter_messages(*args, **kwargs):
        # Verify offset_id is passed (default 0)
        assert kwargs.get("offset_id", 0) == 0, "Expected offset_id=0 by default"
        # Verify NO reverse or offset_date params (removed due to incompatibility)
        assert "reverse" not in kwargs, "reverse should not be passed to iter_messages"
        assert "offset_date" not in kwargs, "offset_date should not be passed to iter_messages"
        for msg in messages:
            yield msg

    mock_telethon_client.iter_messages = mock_iter_messages

    # Execute
    fetched = []
    async for message_dict in telegram_adapter.fetch_history(chat_id, limit=100):
        fetched.append(message_dict)

    # Assert
    assert len(fetched) == 3, f"Expected 3 messages, got {len(fetched)}"
    assert fetched[0]["message_id"] == 12345, f"Expected message_id 12345, got {fetched[0]['message_id']}"
    assert fetched[0]["text"] == "Test message", f"Expected 'Test message', got {fetched[0]['text']}"
    assert fetched[0]["from"]["first_name"] == "John Doe", f"Expected 'John Doe', got {fetched[0]['from']['first_name']}"

    # Verify calls
    mock_client_service.connect.assert_called_once()
    mock_client_service.disconnect.assert_called_once()


@pytest.mark.asyncio
async def test_fetch_history_with_time_filter(telegram_adapter, mock_client_service, mock_telethon_client, mock_telethon_message):
    """Test fetching history with since parameter uses local date filtering."""
    # Setup
    chat_id = "-1002988379206"
    since = datetime.now(timezone.utc) - timedelta(days=7)
    mock_client_service.client = mock_telethon_client

    # Create messages: one newer than since, one older (should be filtered out locally)
    newer_msg = Mock(spec=TelethonMessage)
    newer_msg.id = 12345
    newer_msg.text = "Newer message"
    newer_msg.date = datetime.now(timezone.utc) - timedelta(days=1)  # 1 day ago (after since)
    newer_msg.sender_id = 67890
    newer_msg.sender = Mock()
    newer_msg.sender.first_name = "John"
    newer_msg.sender.last_name = "Doe"
    newer_msg.sender.username = "johndoe"
    newer_msg.sender.lang_code = "en"
    newer_msg.sender.bot = False

    older_msg = Mock(spec=TelethonMessage)
    older_msg.id = 12340
    older_msg.text = "Older message"
    older_msg.date = datetime.now(timezone.utc) - timedelta(days=10)  # 10 days ago (before since)
    older_msg.sender_id = 67890
    older_msg.sender = Mock()
    older_msg.sender.first_name = "John"
    older_msg.sender.last_name = "Doe"
    older_msg.sender.username = "johndoe"
    older_msg.sender.lang_code = "en"
    older_msg.sender.bot = False

    # Mock iter_messages
    async def mock_iter_messages(*args, **kwargs):
        # Verify NO reverse or offset_date params (removed due to incompatibility)
        assert "reverse" not in kwargs, "reverse should not be passed to iter_messages"
        assert "offset_date" not in kwargs, "offset_date should not be passed to iter_messages"
        # Yield newer first, then older (will be filtered by local date check)
        yield newer_msg
        yield older_msg

    mock_telethon_client.iter_messages = mock_iter_messages

    # Execute
    fetched = []
    async for message_dict in telegram_adapter.fetch_history(chat_id, since=since):
        fetched.append(message_dict)

    # Assert - only newer message should be returned (older filtered out locally)
    assert len(fetched) == 1, f"Expected 1 message (older filtered), got {len(fetched)}"
    assert fetched[0]["text"] == "Newer message", f"Expected 'Newer message', got {fetched[0]['text']}"


@pytest.mark.asyncio
async def test_fetch_history_client_not_connected(telegram_adapter, mock_client_service):
    """Test fetch_history when client fails to connect."""
    # Setup
    chat_id = "-1002988379206"
    mock_client_service.client = None  # Connection failed

    # Execute
    fetched = []
    async for message_dict in telegram_adapter.fetch_history(chat_id):
        fetched.append(message_dict)

    # Assert
    assert len(fetched) == 0, f"Expected 0 messages when client not connected, got {len(fetched)}"


# ==================== test_connection TESTS ====================


@pytest.mark.asyncio
async def test_connection_success(telegram_adapter, mock_client_service, mock_telethon_client):
    """Test successful connection test."""
    # Setup
    mock_client_service.client = mock_telethon_client
    mock_telethon_client.is_user_authorized = AsyncMock(return_value=True)

    # Execute
    result = await telegram_adapter.test_connection()

    # Assert
    assert result.success is True, f"Expected success=True, got {result.success}"
    assert result.error is None, f"Expected no error, got {result.error}"

    # Verify calls
    mock_client_service.connect.assert_called_once()
    mock_telethon_client.is_user_authorized.assert_called_once()
    mock_client_service.disconnect.assert_called_once()


@pytest.mark.asyncio
async def test_connection_not_authorized(telegram_adapter, mock_client_service, mock_telethon_client):
    """Test connection test when session expired."""
    # Setup
    mock_client_service.client = mock_telethon_client
    mock_telethon_client.is_user_authorized = AsyncMock(return_value=False)

    # Execute
    result = await telegram_adapter.test_connection()

    # Assert
    assert result.success is False, f"Expected success=False, got {result.success}"
    assert result.error is not None, "Expected error message"
    assert "expired" in result.error.lower() or "invalid" in result.error.lower(), \
        f"Expected 'expired' or 'invalid' in error: {result.error}"


@pytest.mark.asyncio
async def test_connection_client_creation_failed(telegram_adapter, mock_client_service):
    """Test connection test when client creation fails."""
    # Setup
    mock_client_service.client = None  # Client creation failed

    # Execute
    result = await telegram_adapter.test_connection()

    # Assert
    assert result.success is False, f"Expected success=False, got {result.success}"
    assert result.error is not None, "Expected error message"


@pytest.mark.asyncio
async def test_connection_missing_credentials(mock_client_service):
    """Test connection test with missing credentials."""
    # Setup
    mock_client_service.connect = AsyncMock(side_effect=ValueError("Missing API_ID"))
    adapter = TelegramSourceAdapter(client_service=mock_client_service)

    # Execute
    result = await adapter.test_connection()

    # Assert
    assert result.success is False, f"Expected success=False, got {result.success}"
    assert result.error is not None, "Expected error message"
    assert "credentials" in result.error.lower(), f"Expected 'credentials' in error: {result.error}"


# ==================== _convert_message TESTS ====================


def test_convert_message_full_data(telegram_adapter, mock_telethon_message):
    """Test message conversion with all fields populated."""
    # Execute
    result = telegram_adapter._convert_message(mock_telethon_message)

    # Assert
    assert result["message_id"] == 12345
    assert result["text"] == "Test message"
    assert result["from"]["id"] == 67890
    # first_name combines first + last name
    assert result["from"]["first_name"] == "John Doe", f"Expected 'John Doe', got {result['from']['first_name']}"
    assert result["from"]["last_name"] == "Doe"
    assert result["from"]["username"] == "johndoe"
    assert result["from"]["language_code"] == "en"
    assert result["from"]["is_bot"] is False


def test_convert_message_minimal_data(telegram_adapter):
    """Test message conversion with minimal data."""
    # Setup
    message = Mock(spec=TelethonMessage)
    message.id = 99999
    message.text = "Minimal"
    message.date = datetime.now(timezone.utc)
    message.sender_id = 11111
    message.sender = Mock()
    message.sender.first_name = None  # No first name
    message.sender.last_name = None
    message.sender.username = None
    message.sender.lang_code = None
    message.sender.bot = False

    # Execute
    result = telegram_adapter._convert_message(message)

    # Assert
    assert result["message_id"] == 99999
    assert result["text"] == "Minimal"
    assert result["from"]["first_name"] == "Unknown"  # Should default to "Unknown"
