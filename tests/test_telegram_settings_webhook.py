"""
Comprehensive tests for Telegram webhook manager.

Tests cover:
- Bot token validation with various scenarios
- Webhook setup functionality with mock API responses
- Webhook info retrieval and deletion
- Timeout handling and network error scenarios
- HTTP error codes and malformed responses
- Integration with real-world Telegram API response patterns
"""
import pytest
import httpx
from unittest.mock import AsyncMock, patch, MagicMock
import json

from core.telegram import TelegramWebhookManager


class TestTelegramWebhookManager:
    """Test suite for TelegramWebhookManager class"""

    @pytest.fixture
    def webhook_manager(self):
        """Create webhook manager instance with default timeout"""
        return TelegramWebhookManager(timeout=5)

    @pytest.fixture
    def webhook_manager_short_timeout(self):
        """Create webhook manager instance with short timeout for timeout tests"""
        return TelegramWebhookManager(timeout=1)

    def test_initialization(self):
        """Test webhook manager initialization"""
        manager = TelegramWebhookManager(timeout=10)
        assert manager.timeout == 10

        # Test default timeout
        default_manager = TelegramWebhookManager()
        assert default_manager.timeout == 5

    @pytest.mark.asyncio
    async def test_validate_bot_token_success(self, webhook_manager):
        """Test successful bot token validation"""
        mock_response_data = {
            "ok": True,
            "result": {
                "id": 123456789,
                "is_bot": True,
                "first_name": "TestBot",
                "username": "test_bot",
                "can_join_groups": True,
                "can_read_all_group_messages": False,
                "supports_inline_queries": False
            }
        }

        with patch("httpx.AsyncClient") as mock_client:
            mock_response = AsyncMock()
            mock_response.json.return_value = mock_response_data
            mock_response.raise_for_status = AsyncMock(return_value=None)

            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response

            result = await webhook_manager.validate_bot_token("1234567890:ABC-DEF1234ghIkl")

            assert result["valid"] is True
            assert result["bot_info"]["id"] == 123456789
            assert result["bot_info"]["username"] == "test_bot"
            assert result["bot_info"]["first_name"] == "TestBot"
            assert result["bot_info"]["is_bot"] is True

    @pytest.mark.asyncio
    async def test_validate_bot_token_empty(self, webhook_manager):
        """Test bot token validation with empty token"""
        result = await webhook_manager.validate_bot_token("")

        assert result["valid"] is False
        assert result["error"] == "Bot token is required"

    @pytest.mark.asyncio
    async def test_validate_bot_token_none(self, webhook_manager):
        """Test bot token validation with None token"""
        result = await webhook_manager.validate_bot_token(None)

        assert result["valid"] is False
        assert result["error"] == "Bot token is required"

    @pytest.mark.asyncio
    async def test_validate_bot_token_unauthorized(self, webhook_manager):
        """Test bot token validation with unauthorized response (invalid token)"""
        with patch("httpx.AsyncClient") as mock_client:
            mock_response = AsyncMock()
            mock_response.status_code = 401
            mock_response.text = "Unauthorized"

            mock_client.return_value.__aenter__.return_value.get.side_effect = httpx.HTTPStatusError(
                "Unauthorized", request=MagicMock(), response=mock_response
            )

            result = await webhook_manager.validate_bot_token("invalid_token")

            assert result["valid"] is False
            assert result["error"] == "Unauthorized: Invalid bot token"

    @pytest.mark.asyncio
    async def test_validate_bot_token_api_error_response(self, webhook_manager):
        """Test bot token validation when API returns error in response body"""
        mock_response_data = {
            "ok": False,
            "error_code": 401,
            "description": "Unauthorized: bot token is invalid"
        }

        with patch("httpx.AsyncClient") as mock_client:
            mock_response = AsyncMock()
            mock_response.json.return_value = mock_response_data
            mock_response.raise_for_status = AsyncMock(return_value=None)

            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response

            result = await webhook_manager.validate_bot_token("invalid_token")

            assert result["valid"] is False
            assert result["error"] == "Unauthorized: bot token is invalid"

    @pytest.mark.asyncio
    async def test_validate_bot_token_http_error(self, webhook_manager):
        """Test bot token validation with general HTTP error"""
        with patch("httpx.AsyncClient") as mock_client:
            mock_response = AsyncMock()
            mock_response.status_code = 500
            mock_response.text = "Internal Server Error"

            mock_client.return_value.__aenter__.return_value.get.side_effect = httpx.HTTPStatusError(
                "Server Error", request=MagicMock(), response=mock_response
            )

            result = await webhook_manager.validate_bot_token("some_token")

            assert result["valid"] is False
            assert "HTTP 500" in result["error"]

    @pytest.mark.asyncio
    async def test_validate_bot_token_timeout(self, webhook_manager_short_timeout):
        """Test bot token validation timeout"""
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get.side_effect = httpx.TimeoutException("Timeout")

            result = await webhook_manager_short_timeout.validate_bot_token("test_token")

            assert result["valid"] is False
            assert "Token validation failed" in result["error"]

    @pytest.mark.asyncio
    async def test_setup_webhook_success(self, webhook_manager):
        """Test successful webhook setup"""
        mock_response_data = {
            "ok": True,
            "result": True,
            "description": "Webhook was set"
        }

        with patch("httpx.AsyncClient") as mock_client:
            mock_response = AsyncMock()
            mock_response.json.return_value = mock_response_data
            mock_response.raise_for_status = AsyncMock(return_value=None)

            mock_client.return_value.__aenter__.return_value.post.return_value = mock_response

            result = await webhook_manager.setup_webhook(
                "1234567890:ABC-DEF1234ghIkl",
                "https://example.com"
            )

            assert result["success"] is True
            assert result["webhook_url"] == "https://example.com/webhook/telegram"
            assert result["message"] == "Webhook configured successfully"
            assert result["telegram_response"] == mock_response_data

            # Verify API call was made with correct data
            call_args = mock_client.return_value.__aenter__.return_value.post.call_args
            assert "/setWebhook" in call_args[0][0]
            webhook_data = call_args[1]["json"]
            assert webhook_data["url"] == "https://example.com/webhook/telegram"
            assert webhook_data["drop_pending_updates"] is True
            assert webhook_data["allowed_updates"] == ["message"]

    @pytest.mark.asyncio
    async def test_setup_webhook_empty_token(self, webhook_manager):
        """Test webhook setup with empty bot token"""
        with pytest.raises(ValueError, match="Bot token is required"):
            await webhook_manager.setup_webhook("", "https://example.com")

    @pytest.mark.asyncio
    async def test_setup_webhook_empty_url(self, webhook_manager):
        """Test webhook setup with empty URL"""
        with pytest.raises(ValueError, match="Webhook base URL is required"):
            await webhook_manager.setup_webhook("1234567890:ABC-DEF", "")

    @pytest.mark.asyncio
    async def test_setup_webhook_url_normalization(self, webhook_manager):
        """Test that webhook URL is properly normalized (trailing slash removal)"""
        mock_response_data = {"ok": True, "result": True}

        with patch("httpx.AsyncClient") as mock_client:
            mock_response = AsyncMock()
            mock_response.json.return_value = mock_response_data
            mock_response.raise_for_status = AsyncMock(return_value=None)
            mock_client.return_value.__aenter__.return_value.post.return_value = mock_response

            # Test with trailing slash
            result = await webhook_manager.setup_webhook(
                "1234567890:ABC-DEF",
                "https://example.com/"
            )

            assert result["webhook_url"] == "https://example.com/webhook/telegram"

            # Test without trailing slash
            result = await webhook_manager.setup_webhook(
                "1234567890:ABC-DEF",
                "https://example.com"
            )

            assert result["webhook_url"] == "https://example.com/webhook/telegram"

    @pytest.mark.asyncio
    async def test_setup_webhook_api_error(self, webhook_manager):
        """Test webhook setup when Telegram API returns error"""
        mock_response_data = {
            "ok": False,
            "error_code": 400,
            "description": "Bad Request: invalid webhook URL"
        }

        with patch("httpx.AsyncClient") as mock_client:
            mock_response = AsyncMock()
            mock_response.json.return_value = mock_response_data
            mock_response.raise_for_status = AsyncMock(return_value=None)
            mock_client.return_value.__aenter__.return_value.post.return_value = mock_response

            result = await webhook_manager.setup_webhook(
                "1234567890:ABC-DEF",
                "https://invalid-url"
            )

            assert result["success"] is False
            assert result["error"] == "Bad Request: invalid webhook URL"
            assert result["telegram_response"] == mock_response_data

    @pytest.mark.asyncio
    async def test_setup_webhook_timeout(self, webhook_manager_short_timeout):
        """Test webhook setup timeout"""
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post.side_effect = httpx.TimeoutException("Timeout")

            result = await webhook_manager_short_timeout.setup_webhook(
                "1234567890:ABC-DEF",
                "https://example.com"
            )

            assert result["success"] is False
            assert "Timeout connecting to Telegram API" in result["error"]
            assert result["webhook_url"] == "https://example.com/webhook/telegram"

    @pytest.mark.asyncio
    async def test_setup_webhook_http_error(self, webhook_manager):
        """Test webhook setup with HTTP error"""
        with patch("httpx.AsyncClient") as mock_client:
            mock_response = AsyncMock()
            mock_response.status_code = 403
            mock_response.text = "Forbidden"

            mock_client.return_value.__aenter__.return_value.post.side_effect = httpx.HTTPStatusError(
                "Forbidden", request=MagicMock(), response=mock_response
            )

            result = await webhook_manager.setup_webhook(
                "1234567890:ABC-DEF",
                "https://example.com"
            )

            assert result["success"] is False
            assert "HTTP 403: Forbidden" in result["error"]

    @pytest.mark.asyncio
    async def test_get_webhook_info_success(self, webhook_manager):
        """Test successful webhook info retrieval"""
        mock_response_data = {
            "ok": True,
            "result": {
                "url": "https://example.com/webhook/telegram",
                "has_custom_certificate": False,
                "pending_update_count": 0,
                "max_connections": 40
            }
        }

        with patch("httpx.AsyncClient") as mock_client:
            mock_response = AsyncMock()
            mock_response.json.return_value = mock_response_data
            mock_response.raise_for_status = AsyncMock(return_value=None)
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response

            result = await webhook_manager.get_webhook_info("1234567890:ABC-DEF")

            assert result["success"] is True
            assert result["info"]["url"] == "https://example.com/webhook/telegram"
            assert result["info"]["pending_update_count"] == 0

    @pytest.mark.asyncio
    async def test_get_webhook_info_empty_token(self, webhook_manager):
        """Test get webhook info with empty token"""
        with pytest.raises(ValueError, match="Bot token is required"):
            await webhook_manager.get_webhook_info("")

    @pytest.mark.asyncio
    async def test_get_webhook_info_api_error(self, webhook_manager):
        """Test get webhook info when API returns error"""
        mock_response_data = {
            "ok": False,
            "description": "Unauthorized"
        }

        with patch("httpx.AsyncClient") as mock_client:
            mock_response = AsyncMock()
            mock_response.json.return_value = mock_response_data
            mock_response.raise_for_status = AsyncMock(return_value=None)
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response

            result = await webhook_manager.get_webhook_info("invalid_token")

            assert result["success"] is False
            assert result["error"] == "Unauthorized"

    @pytest.mark.asyncio
    async def test_get_webhook_info_exception(self, webhook_manager):
        """Test get webhook info with network exception"""
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get.side_effect = Exception("Network error")

            result = await webhook_manager.get_webhook_info("test_token")

            assert result["success"] is False
            assert "Failed to get webhook info" in result["error"]

    @pytest.mark.asyncio
    async def test_delete_webhook_success(self, webhook_manager):
        """Test successful webhook deletion"""
        mock_response_data = {
            "ok": True,
            "result": True,
            "description": "Webhook was deleted"
        }

        with patch("httpx.AsyncClient") as mock_client:
            mock_response = AsyncMock()
            mock_response.json.return_value = mock_response_data
            mock_response.raise_for_status = AsyncMock(return_value=None)
            mock_client.return_value.__aenter__.return_value.post.return_value = mock_response

            result = await webhook_manager.delete_webhook("1234567890:ABC-DEF")

            assert result["success"] is True
            assert result["message"] == "Webhook deleted successfully"

            # Verify correct API call
            call_args = mock_client.return_value.__aenter__.return_value.post.call_args
            assert "/deleteWebhook" in call_args[0][0]
            delete_data = call_args[1]["json"]
            assert delete_data["drop_pending_updates"] is True

    @pytest.mark.asyncio
    async def test_delete_webhook_empty_token(self, webhook_manager):
        """Test webhook deletion with empty token"""
        with pytest.raises(ValueError, match="Bot token is required"):
            await webhook_manager.delete_webhook("")

    @pytest.mark.asyncio
    async def test_delete_webhook_api_error(self, webhook_manager):
        """Test webhook deletion when API returns error"""
        mock_response_data = {
            "ok": False,
            "description": "Bad Request: webhook not found"
        }

        with patch("httpx.AsyncClient") as mock_client:
            mock_response = AsyncMock()
            mock_response.json.return_value = mock_response_data
            mock_response.raise_for_status = AsyncMock(return_value=None)
            mock_client.return_value.__aenter__.return_value.post.return_value = mock_response

            result = await webhook_manager.delete_webhook("1234567890:ABC-DEF")

            assert result["success"] is False
            assert result["error"] == "Bad Request: webhook not found"

    @pytest.mark.asyncio
    async def test_delete_webhook_exception(self, webhook_manager):
        """Test webhook deletion with exception"""
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post.side_effect = Exception("Connection failed")

            result = await webhook_manager.delete_webhook("test_token")

            assert result["success"] is False
            assert "Failed to delete webhook" in result["error"]


class TestTelegramWebhookManagerIntegration:
    """Integration tests for webhook manager with realistic scenarios"""

    @pytest.fixture
    def webhook_manager(self):
        """Create webhook manager instance"""
        return TelegramWebhookManager(timeout=5)

    @pytest.mark.asyncio
    async def test_complete_webhook_workflow(self, webhook_manager):
        """Test complete workflow: validate -> setup -> get info -> delete"""
        bot_token = "1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
        webhook_url = "https://myapp.example.com"

        # Mock responses for each step
        validate_response = {
            "ok": True,
            "result": {"id": 123456789, "is_bot": True, "first_name": "MyBot", "username": "my_bot"}
        }
        setup_response = {"ok": True, "result": True}
        info_response = {
            "ok": True,
            "result": {"url": f"{webhook_url}/webhook/telegram", "pending_update_count": 0}
        }
        delete_response = {"ok": True, "result": True}

        with patch("httpx.AsyncClient") as mock_client:
            mock_async_client = mock_client.return_value.__aenter__.return_value

            # Setup responses for different endpoints
            def mock_request(*args, **kwargs):
                mock_response = AsyncMock()
                if "/getMe" in args[0]:
                    mock_response.json.return_value = validate_response
                elif "/setWebhook" in args[0]:
                    mock_response.json.return_value = setup_response
                elif "/getWebhookInfo" in args[0]:
                    mock_response.json.return_value = info_response
                elif "/deleteWebhook" in args[0]:
                    mock_response.json.return_value = delete_response
                mock_response.raise_for_status = AsyncMock(return_value=None)
                return mock_response

            mock_async_client.get.side_effect = mock_request
            mock_async_client.post.side_effect = mock_request

            # Step 1: Validate token
            validate_result = await webhook_manager.validate_bot_token(bot_token)
            assert validate_result["valid"] is True
            assert validate_result["bot_info"]["username"] == "my_bot"

            # Step 2: Setup webhook
            setup_result = await webhook_manager.setup_webhook(bot_token, webhook_url)
            assert setup_result["success"] is True
            assert setup_result["webhook_url"] == f"{webhook_url}/webhook/telegram"

            # Step 3: Get webhook info
            info_result = await webhook_manager.get_webhook_info(bot_token)
            assert info_result["success"] is True
            assert info_result["info"]["url"] == f"{webhook_url}/webhook/telegram"

            # Step 4: Delete webhook
            delete_result = await webhook_manager.delete_webhook(bot_token)
            assert delete_result["success"] is True

    @pytest.mark.asyncio
    async def test_error_cascade_handling(self, webhook_manager):
        """Test how system handles cascading errors"""
        invalid_token = "invalid_token"

        with patch("httpx.AsyncClient") as mock_client:
            # Simulate 401 error for all endpoints
            mock_response = AsyncMock()
            mock_response.status_code = 401
            mock_response.text = "Unauthorized"

            mock_client.return_value.__aenter__.return_value.get.side_effect = httpx.HTTPStatusError(
                "Unauthorized", request=MagicMock(), response=mock_response
            )
            mock_client.return_value.__aenter__.return_value.post.side_effect = httpx.HTTPStatusError(
                "Unauthorized", request=MagicMock(), response=mock_response
            )

            # All operations should fail gracefully
            validate_result = await webhook_manager.validate_bot_token(invalid_token)
            assert validate_result["valid"] is False

            setup_result = await webhook_manager.setup_webhook(invalid_token, "https://example.com")
            assert setup_result["success"] is False

            info_result = await webhook_manager.get_webhook_info(invalid_token)
            assert info_result["success"] is False

            delete_result = await webhook_manager.delete_webhook(invalid_token)
            assert delete_result["success"] is False

    @pytest.mark.asyncio
    async def test_timeout_scenarios(self):
        """Test various timeout scenarios"""
        webhook_manager = TelegramWebhookManager(timeout=0.1)  # Very short timeout

        with patch("httpx.AsyncClient") as mock_client:
            # Simulate timeout for different operations
            mock_client.return_value.__aenter__.return_value.get.side_effect = httpx.TimeoutException("Request timeout")
            mock_client.return_value.__aenter__.return_value.post.side_effect = httpx.TimeoutException("Request timeout")

            # Test timeout handling across all methods
            token = "test_token"
            url = "https://example.com"

            validate_result = await webhook_manager.validate_bot_token(token)
            assert validate_result["valid"] is False
            assert "Token validation failed" in validate_result["error"]

            setup_result = await webhook_manager.setup_webhook(token, url)
            assert setup_result["success"] is False
            assert "Timeout connecting to Telegram API" in setup_result["error"]

            info_result = await webhook_manager.get_webhook_info(token)
            assert info_result["success"] is False
            assert "Failed to get webhook info" in info_result["error"]

            delete_result = await webhook_manager.delete_webhook(token)
            assert delete_result["success"] is False
            assert "Failed to delete webhook" in delete_result["error"]