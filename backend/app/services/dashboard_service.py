"""Dashboard service for aggregating metrics for Daily Review Epic."""

from __future__ import annotations

from datetime import datetime, time, timedelta

from sqlalchemy import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.v1.schemas.dashboard import (
    AtomStats,
    DashboardMetricsResponse,
    MessageStats,
    TopicStats,
    TrendData,
)
from app.models.atom import Atom
from app.models.message import Message
from app.models.topic import Topic


class DashboardService:
    """Service for aggregating dashboard metrics.

    Provides aggregated statistics for messages, atoms, and topics
    with auto-detection of period (today/yesterday) and trend calculation.
    """

    def __init__(self, session: AsyncSession):
        """Initialize dashboard service.

        Args:
            session: Async database session
        """
        self.session = session

    async def get_metrics(self, period: str = "auto") -> DashboardMetricsResponse:
        """Get aggregated dashboard metrics.

        Args:
            period: Time period - "auto", "today", or "yesterday"
                   "auto" uses yesterday if no messages today (before noon)

        Returns:
            Complete dashboard metrics with trends
        """
        now = datetime.utcnow()
        today_start = datetime.combine(now.date(), time.min)
        yesterday_start = today_start - timedelta(days=1)

        if period == "auto":
            today_count = await self._count_messages_for_period(today_start, now)
            if today_count == 0 and now.hour < 12:
                period = "yesterday"
            else:
                period = "today"

        if period == "today":
            period_start = today_start
            period_end = now
            prev_start = yesterday_start
            prev_end = today_start
            period_label = "Дані за сьогодні"
        else:
            period_start = yesterday_start
            period_end = today_start
            prev_start = yesterday_start - timedelta(days=1)
            prev_end = yesterday_start
            period_label = "Дані за вчора"

        messages = await self._get_message_stats(period_start, period_end)
        atoms = await self._get_atom_stats(period_start, period_end)
        topics = await self._get_topic_stats(period_start, period_end)

        prev_messages = await self._get_message_stats(prev_start, prev_end)
        prev_atoms = await self._get_atom_stats(prev_start, prev_end)

        trends = {
            "messages": self._calculate_trend(messages.total, prev_messages.total),
            "atoms": self._calculate_trend(atoms.total, prev_atoms.total),
        }

        return DashboardMetricsResponse(
            period=period,  # type: ignore[arg-type]
            period_label=period_label,
            messages=messages,
            atoms=atoms,
            topics=topics,
            trends=trends,
            generated_at=now,
        )

    async def _count_messages_for_period(
        self, start: datetime, end: datetime
    ) -> int:
        """Count messages in a specific time period."""
        query = select(func.count()).select_from(Message).where(
            Message.sent_at >= start,  # type: ignore[arg-type]
            Message.sent_at < end,  # type: ignore[arg-type]
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def _get_message_stats(
        self, start: datetime, end: datetime
    ) -> MessageStats:
        """Get message statistics for a period."""
        base_query = select(Message).where(
            Message.sent_at >= start,  # type: ignore[arg-type]
            Message.sent_at < end,  # type: ignore[arg-type]
        )
        result = await self.session.execute(base_query)
        messages = result.scalars().all()

        total = len(messages)
        signal_count = sum(1 for m in messages if m.noise_classification == "signal")
        noise_count = sum(1 for m in messages if m.noise_classification in ("noise", "spam", "low_quality"))

        return MessageStats(
            total=total,
            signal_count=signal_count,
            noise_count=noise_count,
            signal_ratio=signal_count / total if total > 0 else 0.0,
        )

    async def _get_atom_stats(self, start: datetime, end: datetime) -> AtomStats:
        """Get atom statistics for a period."""
        base_query = select(Atom).where(
            Atom.created_at >= start,  # type: ignore[operator,arg-type]
            Atom.created_at < end,  # type: ignore[operator,arg-type]
        )
        result = await self.session.execute(base_query)
        atoms = result.scalars().all()

        total = len(atoms)
        approved = sum(1 for a in atoms if a.user_approved)
        pending_review = sum(1 for a in atoms if not a.user_approved and not a.archived)

        by_type: dict[str, int] = {}
        for atom in atoms:
            by_type[atom.type] = by_type.get(atom.type, 0) + 1

        return AtomStats(
            total=total,
            pending_review=pending_review,
            approved=approved,
            by_type=by_type,
        )

    async def _get_topic_stats(self, start: datetime, end: datetime) -> TopicStats:
        """Get topic statistics."""
        total_query = select(func.count()).select_from(Topic)
        total_result = await self.session.execute(total_query)
        total = total_result.scalar() or 0

        active_query = (
            select(func.count(func.distinct(Message.topic_id)))
            .select_from(Message)
            .where(
                Message.sent_at >= start,  # type: ignore[arg-type]
                Message.sent_at < end,  # type: ignore[arg-type]
                Message.topic_id.isnot(None),  # type: ignore[union-attr]
            )
        )
        active_result = await self.session.execute(active_query)
        active_today = active_result.scalar() or 0

        return TopicStats(
            total=total,
            active_today=active_today,
        )

    def _calculate_trend(self, current: int, previous: int) -> TrendData:
        """Calculate trend data comparing two periods."""
        if previous == 0:
            change_percent = 100.0 if current > 0 else 0.0
            direction = "up" if current > 0 else "neutral"
        else:
            change_percent = abs((current - previous) / previous * 100)
            if current > previous:
                direction = "up"
            elif current < previous:
                direction = "down"
            else:
                direction = "neutral"

        return TrendData(
            current=current,
            previous=previous,
            change_percent=round(change_percent, 1),
            direction=direction,  # type: ignore[arg-type]
        )
