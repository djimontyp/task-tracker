"""TaskProposal model for AI-generated task proposals."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from .enums import (
    LLMRecommendation,
    ProposalStatus,
    TaskCategory,
    TaskPriority,
)


class TaskProposal(SQLModel, table=True):
    """
    TaskProposal - AI-generated task proposals from analysis runs.

    Tracks source messages for duplicate detection and stores LLM reasoning.
    Enables PM review workflow: approve/reject/merge.
    """

    __tablename__ = "task_proposals"

    # Primary Key
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Parent analysis run
    analysis_run_id: UUID = Field(
        foreign_key="analysis_runs.id",
        description="Analysis run that created this proposal",
    )

    # Proposed task data
    proposed_title: str = Field(
        max_length=500,
        description="Proposed task title",
    )
    proposed_description: str = Field(
        sa_type=Text,
        description="Proposed task description",
    )
    proposed_priority: str = Field(
        default=TaskPriority.medium.value,
        max_length=50,
        description="Proposed priority level",
    )
    proposed_category: str = Field(
        default=TaskCategory.feature.value,
        max_length=50,
        description="Proposed category",
    )
    proposed_project_id: UUID | None = Field(
        default=None,
        foreign_key="project_configs.id",
        description="Proposed project assignment",
    )
    proposed_tags: list[str] = Field(
        default_factory=list,
        sa_type=JSONB,
        description="Proposed tags",
    )
    proposed_parent_id: UUID | None = Field(
        default=None,
        foreign_key="task_entities.id",
        description="Parent task if this should be sub-task",
    )

    # Source tracking (CRITICAL for duplicate detection!)
    source_message_ids: list[int] = Field(
        sa_type=JSONB,
        description="Message IDs that created this proposal",
    )
    message_count: int = Field(
        description="Number of source messages",
    )
    time_span_seconds: int = Field(
        description="Seconds between first and last message",
    )

    # Extracted sub-tasks
    proposed_sub_tasks: list[dict] | None = Field(
        default=None,
        sa_type=JSONB,
        description="Proposed sub-tasks as list of dicts",
    )

    # Duplicate detection
    similar_task_id: UUID | None = Field(
        default=None,
        foreign_key="task_entities.id",
        description="Similar existing task if found",
    )
    similarity_score: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Similarity score (0.0-1.0)",
    )
    similarity_type: str | None = Field(
        default=None,
        max_length=50,
        description="Type of similarity: exact_messages/semantic/none",
    )
    diff_summary: dict | None = Field(
        default=None,
        sa_type=JSONB,
        description="Diff summary between proposal and similar task",
    )

    # LLM metadata
    llm_recommendation: str = Field(
        default=LLMRecommendation.new_task.value,
        max_length=50,
        description="LLM recommendation: new_task/update_existing/merge/reject",
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence score (0.0-1.0)",
    )
    reasoning: str = Field(
        sa_type=Text,
        description="LLM reasoning for this proposal",
    )

    # Project classification
    project_classification_confidence: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Project classification confidence",
    )
    project_keywords_matched: list[str] | None = Field(
        default=None,
        sa_type=JSONB,
        description="Keywords matched for project classification",
    )

    # Review status
    status: str = Field(
        default=ProposalStatus.pending.value,
        max_length=50,
        description="Review status: pending/approved/rejected/merged",
    )
    reviewed_by_user_id: int | None = Field(
        default=None,
        foreign_key="users.id",
        description="User who reviewed this proposal",
    )
    reviewed_at: datetime | None = None
    review_action: str | None = Field(
        default=None,
        max_length=50,
        description="Review action: approve/reject/merge/split/edit",
    )
    review_notes: str | None = Field(
        default=None,
        sa_type=Text,
        description="PM review notes",
    )

    # Timestamps
    created_at: datetime = Field(sa_column=Column(DateTime(timezone=True), server_default=func.now()))

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "analysis_run_id": "123e4567-e89b-12d3-a456-426614174000",
                "proposed_title": "Add user authentication",
                "proposed_description": "Implement OAuth2 authentication...",
                "proposed_priority": "high",
                "proposed_category": "feature",
                "source_message_ids": [1, 2, 3],
                "message_count": 3,
                "time_span_seconds": 3600,
                "llm_recommendation": "new_task",
                "confidence": 0.95,
                "reasoning": "Users discussed authentication needs...",
                "status": "pending",
            }
        }


# API Schemas
class TaskProposalCreate(SQLModel):
    """Schema for creating new task proposal."""

    analysis_run_id: UUID
    proposed_title: str
    proposed_description: str
    proposed_priority: str = TaskPriority.medium.value
    proposed_category: str = TaskCategory.feature.value
    proposed_project_id: UUID | None = None
    proposed_tags: list[str] = []
    proposed_parent_id: UUID | None = None
    source_message_ids: list[int]
    message_count: int
    time_span_seconds: int
    proposed_sub_tasks: list[dict] | None = None
    similar_task_id: UUID | None = None
    similarity_score: float | None = None
    similarity_type: str | None = None
    diff_summary: dict | None = None
    llm_recommendation: str = LLMRecommendation.new_task.value
    confidence: float
    reasoning: str
    project_classification_confidence: float | None = None
    project_keywords_matched: list[str] | None = None


class TaskProposalUpdate(SQLModel):
    """Schema for updating task proposal (partial)."""

    proposed_title: str | None = None
    proposed_description: str | None = None
    proposed_priority: str | None = None
    proposed_category: str | None = None
    proposed_project_id: UUID | None = None
    proposed_tags: list[str] | None = None
    proposed_parent_id: UUID | None = None
    status: str | None = None
    reviewed_by_user_id: int | None = None
    reviewed_at: datetime | None = None
    review_action: str | None = None
    review_notes: str | None = None


class TaskProposalPublic(SQLModel):
    """Public schema for task proposal responses."""

    id: UUID
    analysis_run_id: UUID
    proposed_title: str
    proposed_description: str
    proposed_priority: str
    proposed_category: str
    proposed_project_id: UUID | None
    proposed_tags: list[str]
    proposed_parent_id: UUID | None
    source_message_ids: list[int]
    message_count: int
    time_span_seconds: int
    proposed_sub_tasks: list[dict] | None
    similar_task_id: UUID | None
    similarity_score: float | None
    similarity_type: str | None
    diff_summary: dict | None
    llm_recommendation: str
    confidence: float
    reasoning: str
    project_classification_confidence: float | None
    project_keywords_matched: list[str] | None
    status: str
    reviewed_by_user_id: int | None
    reviewed_at: datetime | None
    review_action: str | None
    review_notes: str | None
    created_at: datetime


class TaskProposalListResponse(SQLModel):
    """Paginated response schema for task proposals."""

    items: list[TaskProposalPublic]
    total: int
    page: int
    page_size: int
