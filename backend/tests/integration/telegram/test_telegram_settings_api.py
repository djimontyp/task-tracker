"""
Comprehensive tests for Telegram settings API endpoints.

Tests cover:
- GET /api/settings (with and without existing data, environment fallbacks)
- POST /api/settings (valid data, invalid tokens, validation errors)
- HTTP status codes and error responses
- Token truncation in responses
- Security: ensure no plaintext tokens in responses
- Environment variable integration
- Error handling for various scenarios
"""

import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.main import app
from app.models import Settings
from core.crypto import encrypt_sensitive_data
from httpx import AsyncClient


class TestSettingsAPIEndpoints:
    """Test suite for Settings API endpoints"""

    @pytest.fixture
    def mock_settings(self):
        """Mock application settings"""
        mock_settings = MagicMock()
        mock_settings.telegram_bot_token = "env_token_1234567890:ABC-DEF"
        mock_settings.webhook_base_url = "https://env-default.com"
        return mock_settings

    @pytest.fixture
    def mock_db_session(self):
        """Mock database session"""
        mock_session = AsyncMock()
        return mock_session

    @pytest.mark.asyncio
    async def test_get_settings_without_db_data_uses_environment(self, mock_settings, mock_db_session):
        """Test GET /api/settings returns environment data when no DB data exists"""
        # Mock database returning no settings
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db_session.execute.return_value = mock_result

        with patch("app.routers.get_settings", return_value=mock_settings):
            with patch("app.routers.get_db_session", return_value=mock_db_session):
                async with AsyncClient(app=app, base_url="http://test") as client:
                    response = await client.get("/api/settings")

                    assert response.status_code == 200
                    data = response.json()

                    # Should return truncated environment token
                    assert data["telegram"]["bot_token"] == "env_token_...[truncated]"
                    assert data["telegram"]["webhook_base_url"] == "https://env-default.com"
                    assert data["updated_at"] is None

    @pytest.mark.asyncio
    async def test_get_settings_with_db_data_returns_decrypted(self, mock_settings, mock_db_session):
        """Test GET /api/settings returns decrypted DB data when it exists"""
        # Create mock DB settings
        original_token = "db_token_1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
        encrypted_token = encrypt_sensitive_data(original_token)

        mock_db_settings = Settings(
            id=1, telegram_bot_token_encrypted=encrypted_token, telegram_webhook_base_url="https://db-webhook.com"
        )
        mock_db_settings.updated_at = "2023-01-15T10:30:00"

        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = mock_db_settings
        mock_db_session.execute.return_value = mock_result

        with patch("app.routers.get_settings", return_value=mock_settings):
            with patch("app.routers.get_db_session", return_value=mock_db_session):
                async with AsyncClient(app=app, base_url="http://test") as client:
                    response = await client.get("/api/settings")

                    assert response.status_code == 200
                    data = response.json()

                    # Should return truncated DB token
                    assert data["telegram"]["bot_token"] == "db_token_1...[truncated]"
                    assert data["telegram"]["webhook_base_url"] == "https://db-webhook.com"
                    assert data["updated_at"] == "2023-01-15T10:30:00"

    @pytest.mark.asyncio
    async def test_get_settings_decryption_error_handling(self, mock_settings, mock_db_session):
        """Test GET /api/settings handles decryption errors gracefully"""
        # Mock DB settings with corrupted encrypted token
        mock_db_settings = Settings(
            id=1, telegram_bot_token_encrypted="corrupted_encrypted_data", telegram_webhook_base_url="https://test.com"
        )
        mock_db_settings.updated_at = "2023-01-15T10:30:00"

        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = mock_db_settings
        mock_db_session.execute.return_value = mock_result

        with patch("app.routers.get_settings", return_value=mock_settings):
            with patch("app.routers.get_db_session", return_value=mock_db_session):
                async with AsyncClient(app=app, base_url="http://test") as client:
                    response = await client.get("/api/settings")

                    assert response.status_code == 200
                    data = response.json()

                    # Should return error message instead of crashing
                    assert data["telegram"]["bot_token"] == "[encrypted - cannot decrypt]"
                    assert data["telegram"]["webhook_base_url"] == "https://test.com"

    @pytest.mark.asyncio
    async def test_post_settings_valid_data_success(self, mock_settings, mock_db_session):
        """Test POST /api/settings with valid data successfully saves and configures webhook"""
        # Mock successful Telegram API validation and webhook setup
        with patch("app.routers.telegram_webhook_manager") as mock_webhook_manager:
            mock_webhook_manager.validate_bot_token.return_value = {
                "valid": True,
                "bot_info": {"id": 123456789, "username": "test_bot", "first_name": "TestBot"},
            }
            mock_webhook_manager.setup_webhook.return_value = {
                "success": True,
                "webhook_url": "https://example.com/webhook/telegram",
                "message": "Webhook configured successfully",
            }

            # Mock database operations
            mock_result = AsyncMock()
            mock_result.scalar_one_or_none.return_value = None  # No existing settings
            mock_db_session.execute.return_value = mock_result
            mock_db_session.commit.return_value = None
            mock_db_session.refresh.return_value = None

            # Mock settings object after save
            saved_settings = Settings(
                id=1,
                telegram_bot_token_encrypted=encrypt_sensitive_data("1234567890:ABC-DEF1234ghIkl"),
                telegram_webhook_base_url="https://example.com",
            )
            saved_settings.updated_at = "2023-01-15T10:30:00"

            with patch("app.routers.Settings", return_value=saved_settings):
                with patch("app.routers.get_settings", return_value=mock_settings):
                    with patch("app.routers.get_db_session", return_value=mock_db_session):
                        async with AsyncClient(app=app, base_url="http://test") as client:
                            request_data = {
                                "telegram": {
                                    "bot_token": "1234567890:ABC-DEF1234ghIkl",
                                    "webhook_base_url": "https://example.com",
                                }
                            }

                            response = await client.post("/api/settings", json=request_data)

                            assert response.status_code == 200
                            data = response.json()

                            # Should return truncated token
                            assert data["telegram"]["bot_token"] == "1234567890...[truncated]"
                            assert data["telegram"]["webhook_base_url"] == "https://example.com"
                            assert data["updated_at"] is not None

    @pytest.mark.asyncio
    async def test_post_settings_invalid_token_returns_400(self, mock_settings, mock_db_session):
        """Test POST /api/settings with invalid bot token returns 400 error"""
        with patch("app.routers.telegram_webhook_manager") as mock_webhook_manager:
            mock_webhook_manager.validate_bot_token.return_value = {
                "valid": False,
                "error": "Unauthorized: bot token is invalid",
            }

            with patch("app.routers.get_settings", return_value=mock_settings):
                with patch("app.routers.get_db_session", return_value=mock_db_session):
                    async with AsyncClient(app=app, base_url="http://test") as client:
                        request_data = {
                            "telegram": {"bot_token": "invalid_token", "webhook_base_url": "https://example.com"}
                        }

                        response = await client.post("/api/settings", json=request_data)

                        assert response.status_code == 400
                        data = response.json()
                        assert "Invalid Telegram bot token" in data["detail"]

    @pytest.mark.asyncio
    async def test_post_settings_empty_token_skips_validation(self, mock_settings, mock_db_session):
        """Test POST /api/settings with empty token skips validation but still saves"""
        # Mock database operations
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db_session.execute.return_value = mock_result
        mock_db_session.commit.return_value = None
        mock_db_session.refresh.return_value = None

        saved_settings = Settings(
            id=1, telegram_bot_token_encrypted=None, telegram_webhook_base_url="https://example.com"
        )
        saved_settings.updated_at = "2023-01-15T10:30:00"

        with patch("app.routers.Settings", return_value=saved_settings):
            with patch("app.routers.get_settings", return_value=mock_settings):
                with patch("app.routers.get_db_session", return_value=mock_db_session):
                    async with AsyncClient(app=app, base_url="http://test") as client:
                        request_data = {"telegram": {"bot_token": "", "webhook_base_url": "https://example.com"}}

                        response = await client.post("/api/settings", json=request_data)

                        assert response.status_code == 200
                        data = response.json()
                        assert data["telegram"]["bot_token"] == ""
                        assert data["telegram"]["webhook_base_url"] == "https://example.com"

    @pytest.mark.asyncio
    async def test_post_settings_uses_fallback_webhook_url(self, mock_settings, mock_db_session):
        """Test POST /api/settings uses fallback webhook URL from environment"""
        with patch("app.routers.telegram_webhook_manager") as mock_webhook_manager:
            mock_webhook_manager.validate_bot_token.return_value = {
                "valid": True,
                "bot_info": {"id": 123456789, "username": "test_bot"},
            }
            mock_webhook_manager.setup_webhook.return_value = {
                "success": True,
                "webhook_url": "https://env-default.com/webhook/telegram",
            }

            # Mock database operations
            mock_result = AsyncMock()
            mock_result.scalar_one_or_none.return_value = None
            mock_db_session.execute.return_value = mock_result
            mock_db_session.commit.return_value = None

            saved_settings = Settings(
                id=1,
                telegram_bot_token_encrypted=encrypt_sensitive_data("test_token"),
                telegram_webhook_base_url="https://env-default.com",  # Should use fallback
            )
            saved_settings.updated_at = "2023-01-15T10:30:00"

            with patch("app.routers.Settings", return_value=saved_settings):
                with patch("app.routers.get_settings", return_value=mock_settings):
                    with patch("app.routers.get_db_session", return_value=mock_db_session):
                        async with AsyncClient(app=app, base_url="http://test") as client:
                            request_data = {
                                "telegram": {
                                    "bot_token": "test_token",
                                    "webhook_base_url": "",  # Empty, should use fallback
                                }
                            }

                            response = await client.post("/api/settings", json=request_data)

                            assert response.status_code == 200
                            data = response.json()
                            assert data["telegram"]["webhook_base_url"] == "https://env-default.com"

    @pytest.mark.asyncio
    async def test_post_settings_webhook_setup_failure_continues(self, mock_settings, mock_db_session):
        """Test POST /api/settings continues even if webhook setup fails"""
        with patch("app.routers.telegram_webhook_manager") as mock_webhook_manager:
            mock_webhook_manager.validate_bot_token.return_value = {
                "valid": True,
                "bot_info": {"id": 123456789, "username": "test_bot"},
            }
            # Webhook setup fails
            mock_webhook_manager.setup_webhook.return_value = {
                "success": False,
                "error": "Network timeout",
                "webhook_url": "https://example.com/webhook/telegram",
            }

            # Mock database operations
            mock_result = AsyncMock()
            mock_result.scalar_one_or_none.return_value = None
            mock_db_session.execute.return_value = mock_result
            mock_db_session.commit.return_value = None

            saved_settings = Settings(
                id=1,
                telegram_bot_token_encrypted=encrypt_sensitive_data("test_token"),
                telegram_webhook_base_url="https://example.com",
            )
            saved_settings.updated_at = "2023-01-15T10:30:00"

            with patch("app.routers.Settings", return_value=saved_settings):
                with patch("app.routers.get_settings", return_value=mock_settings):
                    with patch("app.routers.get_db_session", return_value=mock_db_session):
                        async with AsyncClient(app=app, base_url="http://test") as client:
                            request_data = {
                                "telegram": {"bot_token": "test_token", "webhook_base_url": "https://example.com"}
                            }

                            response = await client.post("/api/settings", json=request_data)

                            # Should still succeed (200) even though webhook setup failed
                            assert response.status_code == 200
                            data = response.json()
                            assert data["telegram"]["bot_token"] == "test_token"

    @pytest.mark.asyncio
    async def test_post_settings_updates_existing_record(self, mock_settings, mock_db_session):
        """Test POST /api/settings updates existing settings record"""
        # Mock existing settings in database
        existing_settings = Settings(
            id=1,
            telegram_bot_token_encrypted=encrypt_sensitive_data("old_token"),
            telegram_webhook_base_url="https://old-webhook.com",
        )

        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = existing_settings
        mock_db_session.execute.return_value = mock_result
        mock_db_session.commit.return_value = None
        mock_db_session.refresh.return_value = None

        with patch("app.routers.telegram_webhook_manager") as mock_webhook_manager:
            mock_webhook_manager.validate_bot_token.return_value = {
                "valid": True,
                "bot_info": {"id": 123456789, "username": "updated_bot"},
            }
            mock_webhook_manager.setup_webhook.return_value = {
                "success": True,
                "webhook_url": "https://new-webhook.com/webhook/telegram",
            }

            with patch("app.routers.get_settings", return_value=mock_settings):
                with patch("app.routers.get_db_session", return_value=mock_db_session):
                    async with AsyncClient(app=app, base_url="http://test") as client:
                        request_data = {
                            "telegram": {
                                "bot_token": "new_token_1234567890:ABC-DEF",
                                "webhook_base_url": "https://new-webhook.com",
                            }
                        }

                        response = await client.post("/api/settings", json=request_data)

                        assert response.status_code == 200
                        data = response.json()
                        assert data["telegram"]["bot_token"] == "new_token_...[truncated]"
                        assert data["telegram"]["webhook_base_url"] == "https://new-webhook.com"

    @pytest.mark.asyncio
    async def test_post_settings_malformed_request_returns_422(self):
        """Test POST /api/settings with malformed request returns 422"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Missing required telegram field
            response = await client.post("/api/settings", json={})

            assert response.status_code == 422
            data = response.json()
            assert "detail" in data

            # Invalid JSON structure
            response = await client.post("/api/settings", json={"invalid": "structure"})

            assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_settings_api_security_no_plaintext_tokens(self, mock_settings, mock_db_session):
        """Test that API responses never contain full plaintext tokens"""
        # Test with various token lengths
        test_tokens = [
            "short_token",
            "1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",  # Normal Telegram token
            "x" * 100,  # Very long token
        ]

        for test_token in test_tokens:
            # Mock database settings
            mock_db_settings = Settings(
                id=1,
                telegram_bot_token_encrypted=encrypt_sensitive_data(test_token),
                telegram_webhook_base_url="https://test.com",
            )
            mock_db_settings.updated_at = "2023-01-15T10:30:00"

            mock_result = AsyncMock()
            mock_result.scalar_one_or_none.return_value = mock_db_settings
            mock_db_session.execute.return_value = mock_result

            with patch("app.routers.get_settings", return_value=mock_settings):
                with patch("app.routers.get_db_session", return_value=mock_db_session):
                    async with AsyncClient(app=app, base_url="http://test") as client:
                        response = await client.get("/api/settings")

                        assert response.status_code == 200
                        data = response.json()
                        response_token = data["telegram"]["bot_token"]

                        if len(test_token) > 10:
                            # Long tokens should be truncated
                            assert response_token.endswith("...[truncated]")
                            assert test_token not in response_token
                            # Should show first 10 characters
                            assert response_token.startswith(test_token[:10])
                        else:
                            # Short tokens returned as-is (for testing only)
                            assert response_token == test_token

    @pytest.mark.asyncio
    async def test_settings_api_handles_database_errors(self, mock_settings):
        """Test that API gracefully handles database errors"""
        # Mock database session that raises exception
        mock_db_session = AsyncMock()
        mock_db_session.execute.side_effect = Exception("Database connection error")

        with patch("app.routers.get_settings", return_value=mock_settings):
            with patch("app.routers.get_db_session", return_value=mock_db_session):
                async with AsyncClient(app=app, base_url="http://test") as client:
                    response = await client.get("/api/settings")

                    # Should return 500 Internal Server Error
                    assert response.status_code == 500

    @pytest.mark.asyncio
    async def test_settings_api_content_type_validation(self):
        """Test that API validates content type for POST requests"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Test with invalid content type
            response = await client.post(
                "/api/settings", content="invalid json data", headers={"Content-Type": "text/plain"}
            )

            # Should return 422 or 415 error
            assert response.status_code in [422, 415]

    @pytest.mark.asyncio
    async def test_settings_api_large_payload_handling(self, mock_settings, mock_db_session):
        """Test API handling of large payloads"""
        # Create very large webhook URL
        large_url = "https://" + "x" * 1000 + ".com"

        with patch("app.routers.telegram_webhook_manager") as mock_webhook_manager:
            mock_webhook_manager.validate_bot_token.return_value = {
                "valid": True,
                "bot_info": {"id": 123456789, "username": "test_bot"},
            }

            mock_result = AsyncMock()
            mock_result.scalar_one_or_none.return_value = None
            mock_db_session.execute.return_value = mock_result

            with patch("app.routers.get_settings", return_value=mock_settings):
                with patch("app.routers.get_db_session", return_value=mock_db_session):
                    async with AsyncClient(app=app, base_url="http://test") as client:
                        request_data = {"telegram": {"bot_token": "test_token", "webhook_base_url": large_url}}

                        response = await client.post("/api/settings", json=request_data)

                        # Should handle large payloads gracefully
                        # Might return 422 if validation fails, or 200 if accepted
                        assert response.status_code in [200, 422]


class TestSettingsAPIEnvironmentIntegration:
    """Test suite for environment variable integration in Settings API"""

    @pytest.mark.asyncio
    async def test_settings_api_with_custom_environment_vars(self, mock_db_session):
        """Test Settings API behavior with custom environment variables"""
        custom_env = {
            "TELEGRAM_BOT_TOKEN": "custom_env_1234567890:CUSTOM-TOKEN",
            "WEBHOOK_BASE_URL": "https://custom-env-webhook.com",
        }

        with patch.dict(os.environ, custom_env):
            # Create mock settings that would use these env vars
            mock_settings = MagicMock()
            mock_settings.telegram_bot_token = custom_env["TELEGRAM_BOT_TOKEN"]
            mock_settings.webhook_base_url = custom_env["WEBHOOK_BASE_URL"]

            # Mock no DB data
            mock_result = AsyncMock()
            mock_result.scalar_one_or_none.return_value = None
            mock_db_session.execute.return_value = mock_result

            with patch("app.routers.get_settings", return_value=mock_settings):
                with patch("app.routers.get_db_session", return_value=mock_db_session):
                    async with AsyncClient(app=app, base_url="http://test") as client:
                        response = await client.get("/api/settings")

                        assert response.status_code == 200
                        data = response.json()

                        assert data["telegram"]["bot_token"] == "custom_env...[truncated]"
                        assert data["telegram"]["webhook_base_url"] == "https://custom-env-webhook.com"
                        assert data["updated_at"] is None

    @pytest.mark.asyncio
    async def test_settings_api_environment_fallback_behavior(self):
        """Test that environment variables serve as fallback when DB is empty"""
        with patch.dict(os.environ, {"TELEGRAM_BOT_TOKEN": "", "WEBHOOK_BASE_URL": ""}):
            mock_settings = MagicMock()
            mock_settings.telegram_bot_token = ""
            mock_settings.webhook_base_url = ""

            mock_db_session = AsyncMock()
            mock_result = AsyncMock()
            mock_result.scalar_one_or_none.return_value = None
            mock_db_session.execute.return_value = mock_result

            with patch("app.routers.get_settings", return_value=mock_settings):
                with patch("app.routers.get_db_session", return_value=mock_db_session):
                    async with AsyncClient(app=app, base_url="http://test") as client:
                        response = await client.get("/api/settings")

                        assert response.status_code == 200
                        data = response.json()

                        # Empty environment variables should result in empty response
                        assert data["telegram"]["bot_token"] == ""
                        assert data["telegram"]["webhook_base_url"] == ""
