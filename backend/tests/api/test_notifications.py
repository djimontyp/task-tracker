from unittest.mock import AsyncMock, patch

import pytest
from app.models.notification_preference import DigestFrequency
from httpx import AsyncClient


@pytest.mark.asyncio
class TestNotificationPreferencesAPI:
    """Tests for notification preferences API endpoints."""

    async def test_get_preferences_creates_default(self, client: AsyncClient):
        """Test GET /api/v1/notifications/preferences creates default if not exists."""
        response = await client.get("/api/v1/notifications/preferences")
        assert response.status_code == 200
        data = response.json()

        assert data["email_enabled"] is False
        assert data["telegram_enabled"] is False
        assert data["pending_threshold"] == 10
        assert data["digest_enabled"] is False
        assert data["digest_frequency"] == DigestFrequency.DAILY.value

    async def test_update_preferences(self, client: AsyncClient):
        """Test PUT /api/v1/notifications/preferences updates settings."""
        update_data = {
            "email_enabled": True,
            "email_address": "test@example.com",
            "telegram_enabled": True,
            "telegram_chat_id": "123456789",
            "pending_threshold": 15,
            "digest_enabled": True,
            "digest_frequency": "weekly",
            "digest_time": "08:00",
        }

        response = await client.put("/api/v1/notifications/preferences", json=update_data)
        assert response.status_code == 200
        data = response.json()

        assert data["email_enabled"] is True
        assert data["email_address"] == "test@example.com"
        assert data["telegram_enabled"] is True
        assert data["telegram_chat_id"] == "123456789"
        assert data["pending_threshold"] == 15
        assert data["digest_enabled"] is True
        assert data["digest_frequency"] == "weekly"
        assert data["digest_time"] == "08:00"

    async def test_update_preferences_partial(self, client: AsyncClient):
        """Test PUT /api/v1/notifications/preferences with partial data."""
        update_data = {"email_enabled": True, "pending_threshold": 20}

        response = await client.put("/api/v1/notifications/preferences", json=update_data)
        assert response.status_code == 200
        data = response.json()

        assert data["email_enabled"] is True
        assert data["pending_threshold"] == 20

    async def test_get_preferences_returns_existing(self, client: AsyncClient):
        """Test GET /api/v1/notifications/preferences returns existing settings."""
        update_data = {
            "email_enabled": True,
            "email_address": "existing@example.com",
        }
        await client.put("/api/v1/notifications/preferences", json=update_data)

        response = await client.get("/api/v1/notifications/preferences")
        assert response.status_code == 200
        data = response.json()

        assert data["email_enabled"] is True
        assert data["email_address"] == "existing@example.com"


@pytest.mark.asyncio
class TestTestNotificationsAPI:
    """Tests for test notification API endpoints."""

    async def test_send_test_email_success(self, client: AsyncClient):
        """Test POST /api/v1/notifications/test-email sends test email."""
        with patch("app.api.v1.notifications.notification_service") as mock_service:
            mock_service.send_test_email = AsyncMock()

            response = await client.post(
                "/api/v1/notifications/test-email",
                json={"email_address": "test@example.com"},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Test email sent successfully"

            mock_service.send_test_email.assert_called_once_with("test@example.com")

    async def test_send_test_email_invalid_format(self, client: AsyncClient):
        """Test POST /api/v1/notifications/test-email with invalid email."""
        response = await client.post(
            "/api/v1/notifications/test-email",
            json={"email_address": "invalid-email"},
        )
        assert response.status_code == 422

    async def test_send_test_email_service_error(self, client: AsyncClient):
        """Test POST /api/v1/notifications/test-email handles service errors."""
        with patch("app.api.v1.notifications.notification_service") as mock_service:
            mock_service.send_test_email = AsyncMock(side_effect=ValueError("SMTP not configured"))

            response = await client.post(
                "/api/v1/notifications/test-email",
                json={"email_address": "test@example.com"},
            )
            assert response.status_code == 500
            assert "SMTP not configured" in response.json()["detail"]

    async def test_send_test_telegram_success(self, client: AsyncClient):
        """Test POST /api/v1/notifications/test-telegram sends test notification."""
        with patch("app.api.v1.notifications.notification_service") as mock_service:
            mock_service.send_test_telegram = AsyncMock()

            response = await client.post(
                "/api/v1/notifications/test-telegram",
                json={"chat_id": "123456789"},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Test Telegram notification sent successfully"

            mock_service.send_test_telegram.assert_called_once_with("123456789")

    async def test_send_test_telegram_empty_chat_id(self, client: AsyncClient):
        """Test POST /api/v1/notifications/test-telegram with empty chat_id."""
        response = await client.post(
            "/api/v1/notifications/test-telegram",
            json={"chat_id": ""},
        )
        assert response.status_code == 422

    async def test_send_test_telegram_service_error(self, client: AsyncClient):
        """Test POST /api/v1/notifications/test-telegram handles service errors."""
        with patch("app.api.v1.notifications.notification_service") as mock_service:
            mock_service.send_test_telegram = AsyncMock(side_effect=ValueError("TELEGRAM_BOT_TOKEN not configured"))

            response = await client.post(
                "/api/v1/notifications/test-telegram",
                json={"chat_id": "123456789"},
            )
            assert response.status_code == 500
            assert "TELEGRAM_BOT_TOKEN not configured" in response.json()["detail"]
