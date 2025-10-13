"""AnalysisRun model for coordinating AI analysis runs."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from .enums import AnalysisRunStatus


class AnalysisRun(SQLModel, table=True):
    """
    AnalysisRun - coordinates AI analysis runs.

    Lifecycle: pending → running → completed → reviewed → closed
    Similar to MessageIngestionJob pattern but for AI-driven analysis.
    """

    __tablename__ = "analysis_runs"

    # Primary Key (UUID for distributed systems)
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Time window for analysis
    time_window_start: datetime = Field(
        sa_column=Column(DateTime(timezone=True)),
        description="Start of analysis time window",
    )
    time_window_end: datetime = Field(
        sa_column=Column(DateTime(timezone=True)),
        description="End of analysis time window",
    )

    # Configuration snapshot (versioning for reproducibility)
    agent_assignment_id: UUID = Field(
        foreign_key="agent_task_assignments.id",
        description="Agent-task assignment used for this run",
    )
    project_config_id: UUID | None = Field(
        default=None,
        foreign_key="project_configs.id",
        description="Project configuration if used",
    )
    config_snapshot: dict = Field(
        sa_type=JSONB,
        description="Full config snapshot at run time",
    )

    # Execution & Lifecycle
    trigger_type: str = Field(
        max_length=50,
        description="Trigger type: manual/scheduled/custom",
    )
    triggered_by_user_id: int | None = Field(
        default=None,
        foreign_key="users.id",
        description="User who triggered the run",
    )
    status: str = Field(
        default=AnalysisRunStatus.pending.value,
        max_length=50,
        description="Run status",
    )

    # Lifecycle timestamps
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )
    started_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True)),
        description="When run started processing",
    )
    completed_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True)),
        description="When run completed processing",
    )
    closed_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True)),
        description="When PM closed the run",
    )

    # Proposals tracking
    proposals_total: int = Field(default=0, description="Total proposals created")
    proposals_approved: int = Field(default=0, description="Proposals approved by PM")
    proposals_rejected: int = Field(default=0, description="Proposals rejected by PM")
    proposals_pending: int = Field(default=0, description="Proposals awaiting review")

    # LLM usage statistics
    total_messages_in_window: int = Field(
        default=0,
        description="Total messages in time window",
    )
    messages_after_prefilter: int = Field(
        default=0,
        description="Messages after spam/noise filtering",
    )
    batches_created: int = Field(
        default=0,
        description="Number of batches created for processing",
    )
    llm_tokens_used: int = Field(
        default=0,
        description="Total LLM tokens consumed",
    )
    cost_estimate: float = Field(
        default=0.0,
        description="Estimated cost in USD",
    )

    # Results
    error_log: dict | None = Field(
        default=None,
        sa_type=JSONB,
        description="Error log if run failed",
    )
    accuracy_metrics: dict | None = Field(
        default=None,
        sa_type=JSONB,
        description="Accuracy metrics calculated after closing",
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "time_window_start": "2025-10-10T00:00:00Z",
                "time_window_end": "2025-10-10T23:59:59Z",
                "agent_assignment_id": "123e4567-e89b-12d3-a456-426614174000",
                "project_config_id": "123e4567-e89b-12d3-a456-426614174001",
                "config_snapshot": {"agent": "...", "task": "..."},
                "trigger_type": "manual",
                "status": "pending",
            }
        }


# API Schemas
class AnalysisRunCreate(SQLModel):
    """Schema for creating new analysis run."""

    time_window_start: datetime
    time_window_end: datetime
    agent_assignment_id: UUID
    project_config_id: UUID | None = None
    trigger_type: str = "manual"
    triggered_by_user_id: int | None = None


class AnalysisRunUpdate(SQLModel):
    """Schema for updating analysis run (partial)."""

    status: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    closed_at: datetime | None = None
    proposals_total: int | None = None
    proposals_approved: int | None = None
    proposals_rejected: int | None = None
    proposals_pending: int | None = None
    total_messages_in_window: int | None = None
    messages_after_prefilter: int | None = None
    batches_created: int | None = None
    llm_tokens_used: int | None = None
    cost_estimate: float | None = None
    error_log: dict | None = None
    accuracy_metrics: dict | None = None


class AnalysisRunPublic(SQLModel):
    """Public schema for analysis run responses."""

    id: UUID
    time_window_start: datetime
    time_window_end: datetime
    agent_assignment_id: UUID
    project_config_id: UUID | None
    config_snapshot: dict
    trigger_type: str
    triggered_by_user_id: int | None
    status: str
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    closed_at: datetime | None
    proposals_total: int
    proposals_approved: int
    proposals_rejected: int
    proposals_pending: int
    total_messages_in_window: int
    messages_after_prefilter: int
    batches_created: int
    llm_tokens_used: int
    cost_estimate: float
    error_log: dict | None
    accuracy_metrics: dict | None


class AnalysisRunListResponse(SQLModel):
    """Paginated response schema for analysis runs."""

    items: list[AnalysisRunPublic]
    total: int
    page: int
    page_size: int
