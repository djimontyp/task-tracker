"""Dashboard metrics schemas for Daily Review Epic."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class MessageStats(BaseModel):
    """Message statistics for dashboard."""

    total: int = Field(ge=0, description="Total messages in period")
    signal_count: int = Field(ge=0, description="Messages classified as signal")
    noise_count: int = Field(ge=0, description="Messages classified as noise")
    signal_ratio: float = Field(ge=0.0, le=1.0, description="Signal count / total ratio")


class AtomStats(BaseModel):
    """Atom statistics by type and status."""

    total: int = Field(ge=0, description="Total atoms in period")
    pending_review: int = Field(ge=0, description="Atoms awaiting review (user_approved=false)")
    approved: int = Field(ge=0, description="Approved atoms (user_approved=true)")
    by_type: dict[str, int] = Field(
        default_factory=dict,
        description="Count by atom type",
        json_schema_extra={"example": {"problem": 5, "solution": 3, "decision": 2}},
    )


class TopicStats(BaseModel):
    """Topic activity summary."""

    total: int = Field(ge=0, description="Total topics count")
    active_today: int = Field(ge=0, description="Topics with activity in period")


class TrendData(BaseModel):
    """Comparison with previous period."""

    current: int = Field(description="Current period count")
    previous: int = Field(description="Previous period count")
    change_percent: float = Field(description="Absolute percentage change")
    direction: Literal["up", "down", "neutral"] = Field(description="Trend direction")


class DashboardMetricsResponse(BaseModel):
    """Complete dashboard metrics response."""

    period: Literal["today", "yesterday"] = Field(description="Actual period used for metrics")
    period_label: str = Field(
        description="Localized period label for UI",
        json_schema_extra={"example": "Дані за сьогодні"},
    )
    messages: MessageStats
    atoms: AtomStats
    topics: TopicStats
    trends: dict[str, TrendData] = Field(
        default_factory=dict,
        description="Trends for messages, atoms, topics",
    )
    generated_at: datetime = Field(description="When metrics were generated")
