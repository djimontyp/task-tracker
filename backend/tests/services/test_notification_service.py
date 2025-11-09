from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.models.notification_preference import DigestFrequency, NotificationPreference
from app.services.notification_service import notification_service
from app.services.versioning import VersioningService
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
def mock_versioning_service():
    """Mock versioning service."""
    with patch.object(notification_service, "versioning_service", spec=VersioningService) as mock:
        yield mock


@pytest.fixture
def notification_pref():
    """Create notification preference fixture."""
    return NotificationPreference(
        id=1,
        email_enabled=True,
        email_address="test@example.com",
        telegram_enabled=True,
        telegram_chat_id="123456789",
        pending_threshold=5,
        digest_enabled=True,
        digest_frequency=DigestFrequency.DAILY,
        digest_time="09:00",
    )


class TestCheckAndSendAlerts:
    """Tests for check_and_send_alerts method."""

    @pytest.mark.asyncio
    async def test_alert_sent_when_threshold_exceeded(self, mock_versioning_service, notification_pref):
        """Test that alerts are sent when pending count exceeds threshold."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [notification_pref]
        mock_session.execute.return_value = mock_result

        mock_versioning_service.get_pending_versions_count.return_value = 10

        with (
            patch("app.services.notification_service.email_service") as mock_email,
            patch("app.services.notification_service.telegram_service") as mock_telegram,
        ):
            mock_email.send_pending_alert = AsyncMock()
            mock_telegram.send_pending_alert = AsyncMock()

            await notification_service.check_and_send_alerts(mock_session)

            mock_email.send_pending_alert.assert_called_once_with("test@example.com", 10)
            mock_telegram.send_pending_alert.assert_called_once_with("123456789", 10)

    @pytest.mark.asyncio
    async def test_no_alert_when_below_threshold(self, mock_versioning_service, notification_pref):
        """Test that no alerts are sent when pending count is below threshold."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [notification_pref]
        mock_session.execute.return_value = mock_result

        mock_versioning_service.get_pending_versions_count.return_value = 3

        with (
            patch("app.services.notification_service.email_service") as mock_email,
            patch("app.services.notification_service.telegram_service") as mock_telegram,
        ):
            mock_email.send_pending_alert = AsyncMock()
            mock_telegram.send_pending_alert = AsyncMock()

            await notification_service.check_and_send_alerts(mock_session)

            mock_email.send_pending_alert.assert_not_called()
            mock_telegram.send_pending_alert.assert_not_called()

    @pytest.mark.asyncio
    async def test_email_only_when_telegram_disabled(self, mock_versioning_service, notification_pref):
        """Test that only email is sent when Telegram is disabled."""
        notification_pref.telegram_enabled = False
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [notification_pref]
        mock_session.execute.return_value = mock_result

        mock_versioning_service.get_pending_versions_count.return_value = 10

        with (
            patch("app.services.notification_service.email_service") as mock_email,
            patch("app.services.notification_service.telegram_service") as mock_telegram,
        ):
            mock_email.send_pending_alert = AsyncMock()
            mock_telegram.send_pending_alert = AsyncMock()

            await notification_service.check_and_send_alerts(mock_session)

            mock_email.send_pending_alert.assert_called_once()
            mock_telegram.send_pending_alert.assert_not_called()

    @pytest.mark.asyncio
    async def test_no_alerts_when_no_preferences(self, mock_versioning_service):
        """Test that no alerts are sent when no preferences exist."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_session.execute.return_value = mock_result

        mock_versioning_service.get_pending_versions_count.return_value = 10

        with (
            patch("app.services.notification_service.email_service") as mock_email,
            patch("app.services.notification_service.telegram_service") as mock_telegram,
        ):
            mock_email.send_pending_alert = AsyncMock()
            mock_telegram.send_pending_alert = AsyncMock()

            await notification_service.check_and_send_alerts(mock_session)

            mock_email.send_pending_alert.assert_not_called()
            mock_telegram.send_pending_alert.assert_not_called()


class TestSendDailyDigest:
    """Tests for send_daily_digest method."""

    @pytest.mark.asyncio
    async def test_digest_sent_when_enabled(self, mock_versioning_service, notification_pref):
        """Test that digest is sent when enabled."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [notification_pref]
        mock_session.execute.return_value = mock_result

        stats = {
            "approved": 10,
            "rejected": 2,
            "pending": 5,
            "auto_approval_rate": 83,
        }
        mock_versioning_service.get_daily_stats.return_value = stats

        with (
            patch("app.services.notification_service.email_service") as mock_email,
            patch("app.services.notification_service.telegram_service") as mock_telegram,
        ):
            mock_email.send_daily_digest = AsyncMock()
            mock_telegram.send_daily_digest = AsyncMock()

            await notification_service.send_daily_digest(mock_session)

            mock_email.send_daily_digest.assert_called_once_with("test@example.com", stats)
            mock_telegram.send_daily_digest.assert_called_once_with("123456789", stats)

    @pytest.mark.asyncio
    async def test_no_digest_when_disabled(self, mock_versioning_service, notification_pref):
        """Test that no digest is sent when disabled."""
        notification_pref.digest_enabled = False
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        # When digest_enabled is False, the query should return empty list
        mock_result.scalars.return_value.all.return_value = []
        mock_session.execute.return_value = mock_result

        with (
            patch("app.services.notification_service.email_service") as mock_email,
            patch("app.services.notification_service.telegram_service") as mock_telegram,
        ):
            mock_email.send_daily_digest = AsyncMock()
            mock_telegram.send_daily_digest = AsyncMock()

            await notification_service.send_daily_digest(mock_session)

            mock_email.send_daily_digest.assert_not_called()
            mock_telegram.send_daily_digest.assert_not_called()


class TestSendTestNotifications:
    """Tests for send_test_email and send_test_telegram methods."""

    @pytest.mark.asyncio
    async def test_send_test_email(self):
        """Test sending test email."""
        with patch("app.services.notification_service.email_service") as mock_email:
            mock_email.send_test_email = AsyncMock()

            await notification_service.send_test_email("test@example.com")

            mock_email.send_test_email.assert_called_once_with("test@example.com")

    @pytest.mark.asyncio
    async def test_send_test_telegram(self):
        """Test sending test Telegram notification."""
        with patch("app.services.notification_service.telegram_service") as mock_telegram:
            mock_telegram.send_test_notification = AsyncMock()

            await notification_service.send_test_telegram("123456789")

            mock_telegram.send_test_notification.assert_called_once_with("123456789")
