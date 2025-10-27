from datetime import datetime

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification_preference import NotificationPreference
from app.services.email_service import email_service
from app.services.telegram_notification_service import telegram_service
from app.services.versioning_service import VersioningService


class NotificationService:
    def __init__(self) -> None:
        self.versioning_service = VersioningService()

    async def check_and_send_alerts(self, session: AsyncSession) -> None:
        """Check thresholds and send alerts."""
        result = await session.execute(
            select(NotificationPreference).where(
                or_(
                    NotificationPreference.email_enabled == True,  # noqa: E712  # type: ignore[comparison-overlap, arg-type]
                    NotificationPreference.telegram_enabled == True,  # noqa: E712  # type: ignore[comparison-overlap, arg-type]
                )
            )
        )
        prefs = result.scalars().all()

        pending_count = await self.versioning_service.get_pending_versions_count(session)

        for pref in prefs:
            if pending_count > pref.pending_threshold:
                if pref.email_enabled and pref.email_address:
                    await email_service.send_pending_alert(pref.email_address, pending_count)

                if pref.telegram_enabled and pref.telegram_chat_id:
                    await telegram_service.send_pending_alert(pref.telegram_chat_id, pending_count)

                pref.last_notification_sent = datetime.utcnow()
                session.add(pref)

        await session.commit()

    async def send_daily_digest(self, session: AsyncSession) -> None:
        """Send daily digest (scheduled task)."""
        result = await session.execute(
            select(NotificationPreference).where(
                NotificationPreference.digest_enabled == True  # noqa: E712  # type: ignore[comparison-overlap, arg-type]
            )
        )
        prefs = result.scalars().all()

        stats = await self.versioning_service.get_daily_stats(session)

        for pref in prefs:
            if pref.email_enabled and pref.email_address:
                await email_service.send_daily_digest(pref.email_address, stats)

            if pref.telegram_enabled and pref.telegram_chat_id:
                await telegram_service.send_daily_digest(pref.telegram_chat_id, stats)

    async def send_test_email(self, email_address: str) -> None:
        """Send test email."""
        await email_service.send_test_email(email_address)

    async def send_test_telegram(self, chat_id: str) -> None:
        """Send test Telegram notification."""
        await telegram_service.send_test_notification(chat_id)


notification_service = NotificationService()
