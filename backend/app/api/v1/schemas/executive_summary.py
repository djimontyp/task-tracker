"""Executive Summary API schemas.

Phase 2 implementation (T009-T017):
- TopicBrief (T009)
- ExecutiveSummaryStats (T010)
- ExecutiveSummaryAtom (T011)
- TopicDecisions (T012)
- ExecutiveSummaryResponse (T013)
- ExportFormat enum (T014)
- ExportRequest (T015)
- ExportResponse (T016)
- ExecutiveSummaryStatsResponse (T017)
"""

import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class TopicBrief(BaseModel):
    """Minimal topic information for embedding in responses.

    T009: Lightweight topic representation for executive summary context.
    """

    id: uuid.UUID
    name: str = Field(max_length=100)
    icon: str | None = Field(default=None, max_length=50, description="Lucide icon name")
    color: str | None = Field(default=None, max_length=7, description="Hex color (#RRGGBB)")


class ExecutiveSummaryStats(BaseModel):
    """Aggregate statistics for the summary period.

    T010: Summary metrics for quick overview.
    """

    decisions_count: int = Field(ge=0, description="Total DECISION atoms")
    blockers_count: int = Field(ge=0, description="Total BLOCKER atoms")
    active_topics_count: int = Field(ge=0, description="Topics with atoms in period")
    stale_blockers_count: int = Field(ge=0, default=0, description="Blockers older than 14 days")


class ExecutiveSummaryAtom(BaseModel):
    """Atom with executive summary context.

    T011: Atom representation optimized for executive summary display.
    """

    id: uuid.UUID
    type: str = Field(description="Atom type: decision or blocker")
    title: str = Field(max_length=200)
    content: str
    created_at: datetime
    topic: TopicBrief | None = None
    days_old: int = Field(ge=0, description="Days since creation")
    is_stale: bool = Field(default=False, description="True if blocker and >14 days old")
    source_message_id: uuid.UUID | None = Field(
        default=None, description="Original message ID if extracted from message"
    )


class TopicDecisions(BaseModel):
    """Decisions grouped under a topic.

    T012: Groups decisions by topic for organized display.
    """

    topic: TopicBrief
    decisions: list[ExecutiveSummaryAtom]
    count: int = Field(ge=0)


class ExecutiveSummaryResponse(BaseModel):
    """Complete executive summary response.

    T013: Main response schema with all summary data.
    """

    # Period info
    period_days: int = Field(description="7, 14, or 30")
    period_start: datetime
    period_end: datetime
    period_label: str = Field(description="Human-readable period label in Ukrainian")

    # Aggregate stats
    stats: ExecutiveSummaryStats

    # Blockers (flat list, sorted by severity)
    blockers: list[ExecutiveSummaryAtom] = Field(
        description="BLOCKER atoms sorted: stale first, then by date desc"
    )

    # Decisions grouped by topic
    decisions_by_topic: list[TopicDecisions] = Field(description="Decisions organized by topic")

    # Uncategorized atoms (no topic association)
    uncategorized_decisions: list[ExecutiveSummaryAtom] = Field(
        default_factory=list, description="Decisions without topic"
    )

    # Metadata
    generated_at: datetime


class ExportFormat(str, Enum):
    """Supported export formats.

    T014: Enum for export format selection.
    """

    markdown = "markdown"
    plain_text = "plain_text"


class ExportRequest(BaseModel):
    """Export configuration.

    T015: Request schema for export endpoint.
    """

    period_days: int = Field(default=7, ge=7, le=30)
    format: ExportFormat = Field(default=ExportFormat.markdown)
    include_stats: bool = Field(default=True)
    include_blockers: bool = Field(default=True)
    include_decisions: bool = Field(default=True)


class ExportResponse(BaseModel):
    """Export result.

    T016: Response schema for export endpoint.
    """

    content: str = Field(description="Formatted report content")
    format: ExportFormat
    filename: str = Field(description="Suggested filename")
    generated_at: datetime


class ExecutiveSummaryStatsResponse(BaseModel):
    """Lightweight stats-only response.

    T017: Response for /stats endpoint (dashboard widgets).
    """

    period_days: int = Field(description="7, 14, or 30")
    period_label: str
    stats: ExecutiveSummaryStats
    generated_at: datetime
