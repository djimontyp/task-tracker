"""Base versioning service with shared utilities."""

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.atom_version import AtomVersion
from app.models.topic_version import TopicVersion
from app.services.websocket_manager import websocket_manager


class BaseVersioningService:
    """Base service with shared versioning utilities."""

    async def get_pending_versions_count(self, db: AsyncSession) -> int:
        """
        Get total count of pending (unapproved) versions across all entities.

        Args:
            db: Database session

        Returns:
            Total count of pending versions
        """
        topic_stmt = select(func.count()).select_from(TopicVersion).where(TopicVersion.approved == False)  # noqa: E712
        atom_stmt = select(func.count()).select_from(AtomVersion).where(AtomVersion.approved == False)  # noqa: E712

        topic_count = await db.scalar(topic_stmt) or 0
        atom_count = await db.scalar(atom_stmt) or 0

        return topic_count + atom_count

    async def get_pending_count(self, db: AsyncSession) -> dict[str, int]:
        """
        Get detailed count of pending (unapproved) versions by entity type.

        Args:
            db: Database session

        Returns:
            Dictionary with count, topics, atoms counts
        """
        topic_stmt = select(func.count()).select_from(TopicVersion).where(TopicVersion.approved == False)  # noqa: E712
        atom_stmt = select(func.count()).select_from(AtomVersion).where(AtomVersion.approved == False)  # noqa: E712

        topic_count = await db.scalar(topic_stmt) or 0
        atom_count = await db.scalar(atom_stmt) or 0

        return {
            "count": topic_count + atom_count,
            "topics": topic_count,
            "atoms": atom_count,
        }

    async def broadcast_pending_count_update(self, db: AsyncSession) -> None:
        """
        Broadcast WebSocket event for pending version count update.

        Args:
            db: Database session
        """
        pending_count = await self.get_pending_versions_count(db)

        await websocket_manager.broadcast(
            "versions",
            {
                "event": "pending_count_updated",
                "count": pending_count,
                "last_updated": datetime.now(UTC).isoformat(),
            },
        )

    async def get_daily_stats(self, db: AsyncSession) -> dict[str, int]:
        """
        Get daily statistics for version approvals (last 24 hours).

        Args:
            db: Database session

        Returns:
            Dictionary with approved, rejected, pending counts and auto-approval rate
        """
        from datetime import timedelta

        twenty_four_hours_ago = datetime.now(UTC) - timedelta(days=1)

        topic_approved = (
            select(func.count())
            .select_from(TopicVersion)
            .where(TopicVersion.approved == True)  # noqa: E712  # type: ignore[arg-type]
            .where(TopicVersion.approved_at >= twenty_four_hours_ago)  # type: ignore[arg-type, operator]
        )
        atom_approved = (
            select(func.count())
            .select_from(AtomVersion)
            .where(AtomVersion.approved == True)  # noqa: E712  # type: ignore[arg-type]
            .where(AtomVersion.approved_at >= twenty_four_hours_ago)  # type: ignore[arg-type, operator]
        )

        approved_count = (await db.scalar(topic_approved) or 0) + (await db.scalar(atom_approved) or 0)

        topic_total = (
            select(func.count()).select_from(TopicVersion).where(TopicVersion.created_at >= twenty_four_hours_ago)  # type: ignore[arg-type, operator]
        )
        atom_total = (
            select(func.count()).select_from(AtomVersion).where(AtomVersion.created_at >= twenty_four_hours_ago)  # type: ignore[arg-type, operator]
        )

        total_count = (await db.scalar(topic_total) or 0) + (await db.scalar(atom_total) or 0)

        rejected_count = total_count - approved_count
        pending_count = await self.get_pending_versions_count(db)

        auto_approval_rate = int((approved_count / total_count) * 100) if total_count > 0 else 0

        return {
            "approved": approved_count,
            "rejected": rejected_count,
            "pending": pending_count,
            "auto_approval_rate": auto_approval_rate,
        }
