"""Executive Summary Service.

Phase 3 implementation (T019-T023):
- _calculate_period_boundaries() (T019)
- _calculate_days_old() (T020)
- _is_stale_blocker() (T021)
- _format_period_label() (T022)
- get_executive_summary() (T023)

Provides business logic for aggregating decisions and blockers
for executive summary view, grouped by topics.
"""

from __future__ import annotations

import uuid
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.v1.schemas.executive_summary import (
    ExecutiveSummaryAtom,
    ExecutiveSummaryResponse,
    ExecutiveSummaryStats,
    ExecutiveSummaryStatsResponse,
    ExportFormat,
    ExportRequest,
    ExportResponse,
    TopicBrief,
    TopicDecisions,
)
from app.models.atom import Atom, TopicAtom
from app.models.topic import Topic


# Ukrainian month names for period formatting
UKRAINIAN_MONTHS = {
    1: "січня",
    2: "лютого",
    3: "березня",
    4: "квітня",
    5: "травня",
    6: "червня",
    7: "липня",
    8: "серпня",
    9: "вересня",
    10: "жовтня",
    11: "листопада",
    12: "грудня",
}

# Stale blocker threshold in days
STALE_BLOCKER_THRESHOLD_DAYS = 14


class ExecutiveSummaryService:
    """Service for aggregating executive summary data.

    Provides aggregated statistics for decisions and blockers
    with grouping by topics and period filtering.
    """

    def __init__(self, session: AsyncSession):
        """Initialize executive summary service.

        Args:
            session: Async database session
        """
        self.session = session

    def _calculate_period_boundaries(
        self, period_days: int
    ) -> tuple[datetime, datetime]:
        """Calculate period start and end timestamps.

        T019: Helper for period boundaries.

        Args:
            period_days: Number of days to look back (7, 14, or 30)

        Returns:
            Tuple of (period_start, period_end) datetimes
        """
        now = datetime.now(timezone.utc)
        period_end = now
        period_start = now - timedelta(days=period_days)
        return period_start, period_end

    def _calculate_days_old(self, created_at: datetime) -> int:
        """Calculate how many days old an atom is.

        T020: Helper for days calculation.

        Args:
            created_at: Atom creation timestamp

        Returns:
            Number of days since creation
        """
        now = datetime.now(timezone.utc)
        delta = now - created_at
        return delta.days

    def _is_stale_blocker(self, atom_type: str, days_old: int) -> bool:
        """Check if a blocker is stale (older than threshold).

        T021: Helper for stale blocker detection.
        A blocker is considered stale if it's older than 14 days.

        Args:
            atom_type: Type of the atom
            days_old: Number of days since creation

        Returns:
            True if blocker and older than 14 days
        """
        return atom_type == "blocker" and days_old > STALE_BLOCKER_THRESHOLD_DAYS

    def _format_period_label(self, start: datetime, end: datetime) -> str:
        """Format period as human-readable Ukrainian label.

        T022: Helper for Ukrainian date formatting.

        Args:
            start: Period start datetime
            end: Period end datetime

        Returns:
            Formatted string like "7 грудня - 14 грудня 2025"
        """
        start_day = start.day
        start_month = UKRAINIAN_MONTHS[start.month]
        end_day = end.day
        end_month = UKRAINIAN_MONTHS[end.month]
        end_year = end.year

        if start.month == end.month:
            return f"{start_day} - {end_day} {end_month} {end_year}"
        else:
            return f"{start_day} {start_month} - {end_day} {end_month} {end_year}"

    def _atom_to_summary(
        self, atom: Atom, topic: Topic | None
    ) -> ExecutiveSummaryAtom:
        """Convert Atom model to ExecutiveSummaryAtom schema.

        Args:
            atom: Atom model instance
            topic: Associated topic (or None)

        Returns:
            ExecutiveSummaryAtom schema instance
        """
        days_old = self._calculate_days_old(atom.created_at)
        is_stale = self._is_stale_blocker(atom.type, days_old)

        topic_brief = None
        if topic:
            topic_brief = TopicBrief(
                id=topic.id,
                name=topic.name,
                icon=topic.icon,
                color=topic.color,
            )

        # Extract source_message_id from meta if available
        source_message_id = None
        if atom.meta and "source_message_id" in atom.meta:
            try:
                source_message_id = uuid.UUID(atom.meta["source_message_id"])
            except (ValueError, TypeError):
                pass

        return ExecutiveSummaryAtom(
            id=atom.id,
            type=atom.type,
            title=atom.title,
            content=atom.content,
            created_at=atom.created_at,
            topic=topic_brief,
            days_old=days_old,
            is_stale=is_stale,
            source_message_id=source_message_id,
        )

    async def get_executive_summary(
        self, period_days: int = 7, topic_id: uuid.UUID | None = None
    ) -> ExecutiveSummaryResponse:
        """Get complete executive summary for period.

        T023: Main method for executive summary aggregation.

        Fetches DECISION and BLOCKER atoms (approved only) for the specified
        period, groups them by topics, and calculates statistics.

        Args:
            period_days: Number of days to include (7, 14, or 30)
            topic_id: Optional filter by specific topic

        Returns:
            ExecutiveSummaryResponse with all summary data
        """
        period_start, period_end = self._calculate_period_boundaries(period_days)
        period_label = self._format_period_label(period_start, period_end)

        # Build query for atoms with topic join
        query = (
            select(Atom, Topic)
            .outerjoin(TopicAtom, TopicAtom.atom_id == Atom.id)
            .outerjoin(Topic, Topic.id == TopicAtom.topic_id)
            .where(
                Atom.created_at >= period_start,  # type: ignore[arg-type]
                Atom.user_approved == True,  # noqa: E712
                Atom.archived == False,  # noqa: E712
                Atom.type.in_(["decision", "blocker"]),  # type: ignore[union-attr]
            )
            .order_by(Atom.created_at.desc())  # type: ignore[union-attr]
        )

        # Add topic filter if specified
        if topic_id:
            query = query.where(TopicAtom.topic_id == topic_id)

        result = await self.session.execute(query)
        rows = result.all()

        # Process results
        blockers: list[ExecutiveSummaryAtom] = []
        decisions_by_topic_dict: dict[uuid.UUID, list[ExecutiveSummaryAtom]] = defaultdict(list)
        uncategorized_decisions: list[ExecutiveSummaryAtom] = []
        topics_dict: dict[uuid.UUID, Topic] = {}
        active_topic_ids: set[uuid.UUID] = set()

        for atom, topic in rows:
            summary_atom = self._atom_to_summary(atom, topic)

            if atom.type == "blocker":
                blockers.append(summary_atom)
            elif atom.type == "decision":
                if topic:
                    decisions_by_topic_dict[topic.id].append(summary_atom)
                    topics_dict[topic.id] = topic
                    active_topic_ids.add(topic.id)
                else:
                    uncategorized_decisions.append(summary_atom)

            # Track active topics for blockers too
            if topic:
                active_topic_ids.add(topic.id)
                topics_dict[topic.id] = topic

        # Sort blockers: stale first, then by date desc
        blockers.sort(key=lambda x: (not x.is_stale, -x.days_old))

        # Build decisions_by_topic list
        decisions_by_topic: list[TopicDecisions] = []
        for topic_uuid, decisions in decisions_by_topic_dict.items():
            topic_obj = topics_dict[topic_uuid]
            topic_brief = TopicBrief(
                id=topic_obj.id,
                name=topic_obj.name,
                icon=topic_obj.icon,
                color=topic_obj.color,
            )
            decisions_by_topic.append(
                TopicDecisions(
                    topic=topic_brief,
                    decisions=decisions,
                    count=len(decisions),
                )
            )

        # Sort decisions_by_topic by count desc
        decisions_by_topic.sort(key=lambda x: -x.count)

        # Calculate stats
        stale_blockers_count = sum(1 for b in blockers if b.is_stale)
        stats = ExecutiveSummaryStats(
            decisions_count=sum(len(td.decisions) for td in decisions_by_topic) + len(uncategorized_decisions),
            blockers_count=len(blockers),
            active_topics_count=len(active_topic_ids),
            stale_blockers_count=stale_blockers_count,
        )

        return ExecutiveSummaryResponse(
            period_days=period_days,
            period_start=period_start,
            period_end=period_end,
            period_label=period_label,
            stats=stats,
            blockers=blockers,
            decisions_by_topic=decisions_by_topic,
            uncategorized_decisions=uncategorized_decisions,
            generated_at=datetime.now(timezone.utc),
        )

    async def get_summary_stats(
        self, period_days: int = 7
    ) -> ExecutiveSummaryStatsResponse:
        """Get lightweight stats-only summary.

        T054 (Phase 6): Lightweight stats endpoint for dashboard widgets.

        Args:
            period_days: Number of days to include (7, 14, or 30)

        Returns:
            ExecutiveSummaryStatsResponse with stats only
        """
        period_start, period_end = self._calculate_period_boundaries(period_days)
        period_label = self._format_period_label(period_start, period_end)

        # Count decisions
        decisions_count_query = (
            select(func.count())
            .select_from(Atom)
            .where(
                Atom.created_at >= period_start,  # type: ignore[arg-type]
                Atom.user_approved == True,  # noqa: E712
                Atom.archived == False,  # noqa: E712
                Atom.type == "decision",
            )
        )
        decisions_result = await self.session.execute(decisions_count_query)
        decisions_count = decisions_result.scalar() or 0

        # Count blockers
        blockers_count_query = (
            select(func.count())
            .select_from(Atom)
            .where(
                Atom.created_at >= period_start,  # type: ignore[arg-type]
                Atom.user_approved == True,  # noqa: E712
                Atom.archived == False,  # noqa: E712
                Atom.type == "blocker",
            )
        )
        blockers_result = await self.session.execute(blockers_count_query)
        blockers_count = blockers_result.scalar() or 0

        # Count stale blockers
        stale_threshold = datetime.now(timezone.utc) - timedelta(days=STALE_BLOCKER_THRESHOLD_DAYS)
        stale_blockers_query = (
            select(func.count())
            .select_from(Atom)
            .where(
                Atom.created_at >= period_start,  # type: ignore[arg-type]
                Atom.created_at < stale_threshold,  # type: ignore[arg-type]
                Atom.user_approved == True,  # noqa: E712
                Atom.archived == False,  # noqa: E712
                Atom.type == "blocker",
            )
        )
        stale_result = await self.session.execute(stale_blockers_query)
        stale_blockers_count = stale_result.scalar() or 0

        # Count active topics (topics with atoms in period)
        active_topics_query = (
            select(func.count(func.distinct(TopicAtom.topic_id)))
            .select_from(Atom)
            .join(TopicAtom, TopicAtom.atom_id == Atom.id)
            .where(
                Atom.created_at >= period_start,  # type: ignore[arg-type]
                Atom.user_approved == True,  # noqa: E712
                Atom.archived == False,  # noqa: E712
                Atom.type.in_(["decision", "blocker"]),  # type: ignore[union-attr]
            )
        )
        active_topics_result = await self.session.execute(active_topics_query)
        active_topics_count = active_topics_result.scalar() or 0

        stats = ExecutiveSummaryStats(
            decisions_count=decisions_count,
            blockers_count=blockers_count,
            active_topics_count=active_topics_count,
            stale_blockers_count=stale_blockers_count,
        )

        return ExecutiveSummaryStatsResponse(
            period_days=period_days,
            period_label=period_label,
            stats=stats,
            generated_at=datetime.now(timezone.utc),
        )

    def _format_markdown_report(
        self, summary: ExecutiveSummaryResponse, include_stats: bool, include_blockers: bool, include_decisions: bool
    ) -> str:
        """Format executive summary as Markdown report.

        T038 (Phase 4): Markdown formatting helper.

        Args:
            summary: Executive summary data
            include_stats: Whether to include statistics section
            include_blockers: Whether to include blockers section
            include_decisions: Whether to include decisions section

        Returns:
            Formatted Markdown string
        """
        lines: list[str] = []
        lines.append(f"# Executive Summary: {summary.period_label}")
        lines.append("")

        if include_stats:
            lines.append("## Статистика")
            lines.append(f"- Рішень: {summary.stats.decisions_count}")
            lines.append(f"- Блокерів: {summary.stats.blockers_count}")
            lines.append(f"- Активних топіків: {summary.stats.active_topics_count}")
            if summary.stats.stale_blockers_count > 0:
                lines.append(f"- Застарілих блокерів: {summary.stats.stale_blockers_count}")
            lines.append("")

        if include_blockers and summary.blockers:
            lines.append("## Блокери (потребують уваги)")
            lines.append("")

            # Group blockers by topic for better readability
            blockers_by_topic: dict[str, list[ExecutiveSummaryAtom]] = defaultdict(list)
            uncategorized_blockers: list[ExecutiveSummaryAtom] = []

            for blocker in summary.blockers:
                if blocker.topic:
                    blockers_by_topic[blocker.topic.name].append(blocker)
                else:
                    uncategorized_blockers.append(blocker)

            for topic_name, topic_blockers in blockers_by_topic.items():
                lines.append(f"### {topic_name}")
                for blocker in topic_blockers:
                    stale_marker = " ⚠️" if blocker.is_stale else ""
                    lines.append(f"- **[BLOCKER]** {blocker.title}{stale_marker}")
                    lines.append(f"  _{blocker.days_old} днів тому_")
                lines.append("")

            if uncategorized_blockers:
                lines.append("### Без топіку")
                for blocker in uncategorized_blockers:
                    stale_marker = " ⚠️" if blocker.is_stale else ""
                    lines.append(f"- **[BLOCKER]** {blocker.title}{stale_marker}")
                    lines.append(f"  _{blocker.days_old} днів тому_")
                lines.append("")

        if include_decisions and (summary.decisions_by_topic or summary.uncategorized_decisions):
            lines.append("## Рішення")
            lines.append("")

            for topic_decisions in summary.decisions_by_topic:
                lines.append(f"### {topic_decisions.topic.name}")
                for decision in topic_decisions.decisions:
                    lines.append(f"- **[DECISION]** {decision.title}")
                    lines.append(f"  _{decision.days_old} днів тому_")
                lines.append("")

            if summary.uncategorized_decisions:
                lines.append("### Без топіку")
                for decision in summary.uncategorized_decisions:
                    lines.append(f"- **[DECISION]** {decision.title}")
                    lines.append(f"  _{decision.days_old} днів тому_")
                lines.append("")

        lines.append("---")
        lines.append(f"_Згенеровано: {summary.generated_at.strftime('%Y-%m-%d %H:%M UTC')}_")

        return "\n".join(lines)

    def _format_plain_text_report(
        self, summary: ExecutiveSummaryResponse, include_stats: bool, include_blockers: bool, include_decisions: bool
    ) -> str:
        """Format executive summary as plain text report.

        T039 (Phase 4): Plain text formatting helper.

        Args:
            summary: Executive summary data
            include_stats: Whether to include statistics section
            include_blockers: Whether to include blockers section
            include_decisions: Whether to include decisions section

        Returns:
            Formatted plain text string
        """
        lines: list[str] = []
        lines.append(f"EXECUTIVE SUMMARY: {summary.period_label}")
        lines.append("=" * 50)
        lines.append("")

        if include_stats:
            lines.append("СТАТИСТИКА")
            lines.append("-" * 20)
            lines.append(f"Рішень: {summary.stats.decisions_count}")
            lines.append(f"Блокерів: {summary.stats.blockers_count}")
            lines.append(f"Активних топіків: {summary.stats.active_topics_count}")
            if summary.stats.stale_blockers_count > 0:
                lines.append(f"Застарілих блокерів: {summary.stats.stale_blockers_count}")
            lines.append("")

        if include_blockers and summary.blockers:
            lines.append("БЛОКЕРИ (потребують уваги)")
            lines.append("-" * 30)

            for blocker in summary.blockers:
                topic_name = blocker.topic.name if blocker.topic else "Без топіку"
                stale_marker = " [ЗАСТАРІЛИЙ]" if blocker.is_stale else ""
                lines.append(f"[BLOCKER] {blocker.title}{stale_marker}")
                lines.append(f"  Топік: {topic_name} | {blocker.days_old} днів тому")
                lines.append("")

        if include_decisions and (summary.decisions_by_topic or summary.uncategorized_decisions):
            lines.append("РІШЕННЯ")
            lines.append("-" * 20)

            for topic_decisions in summary.decisions_by_topic:
                lines.append(f"[{topic_decisions.topic.name}]")
                for decision in topic_decisions.decisions:
                    lines.append(f"  * {decision.title}")
                    lines.append(f"    {decision.days_old} днів тому")
                lines.append("")

            if summary.uncategorized_decisions:
                lines.append("[Без топіку]")
                for decision in summary.uncategorized_decisions:
                    lines.append(f"  * {decision.title}")
                    lines.append(f"    {decision.days_old} днів тому")
                lines.append("")

        lines.append("=" * 50)
        lines.append(f"Згенеровано: {summary.generated_at.strftime('%Y-%m-%d %H:%M UTC')}")

        return "\n".join(lines)

    async def export_summary(self, request: ExportRequest) -> ExportResponse:
        """Export executive summary in specified format.

        T040 (Phase 4): Main export method.

        Args:
            request: Export configuration

        Returns:
            ExportResponse with formatted content and filename
        """
        summary = await self.get_executive_summary(request.period_days)

        if request.format == ExportFormat.markdown:
            content = self._format_markdown_report(
                summary, request.include_stats, request.include_blockers, request.include_decisions
            )
            extension = "md"
        else:
            content = self._format_plain_text_report(
                summary, request.include_stats, request.include_blockers, request.include_decisions
            )
            extension = "txt"

        filename = f"executive-summary-{datetime.now(timezone.utc).strftime('%Y-%m-%d')}.{extension}"

        return ExportResponse(
            content=content,
            format=request.format,
            filename=filename,
            generated_at=datetime.now(timezone.utc),
        )
