"""Classification Experiment model for topic classification experiments."""

from datetime import datetime
from enum import Enum
from uuid import UUID

from sqlalchemy import Column, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from .base import IDMixin, TimestampMixin


class ExperimentStatus(str, Enum):
    """Status of classification experiment."""

    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


class ClassificationExperiment(IDMixin, TimestampMixin, SQLModel, table=True):
    """Classification experiment for evaluating topic classification accuracy.

    Tracks end-to-end classification experiments including:
    - Configuration snapshot (topics, provider, model)
    - Classification results for each message
    - Accuracy metrics and confusion matrix
    - Execution statistics
    """

    __tablename__ = "classification_experiments"

    provider_id: UUID = Field(
        foreign_key="llm_providers.id",
        description="LLM provider used for classification",
    )
    model_name: str = Field(
        max_length=100,
        description="Model name used for classification",
    )

    status: ExperimentStatus = Field(
        default=ExperimentStatus.pending,
        description="Experiment status: pending/running/completed/failed",
    )
    message_count: int = Field(
        description="Number of messages to classify",
    )

    topics_snapshot: dict = Field(
        sa_type=JSONB,
        description="Snapshot of topics at experiment time",
    )

    accuracy: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Overall accuracy (0.0-1.0)",
    )
    avg_confidence: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Average confidence score",
    )
    avg_execution_time_ms: float | None = Field(
        default=None,
        description="Average execution time per message in milliseconds",
    )

    confusion_matrix: dict | None = Field(
        default=None,
        sa_type=JSONB,
        description="Confusion matrix: {actual_topic: {predicted_topic: count}}",
    )
    classification_results: list[dict] = Field(
        default_factory=list,
        sa_type=JSONB,
        description="Detailed classification results for each message",
    )

    started_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True)),
        description="When experiment started",
    )
    completed_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True)),
        description="When experiment completed",
    )

    error_message: str | None = Field(
        default=None,
        sa_type=Text,
        description="Error message if experiment failed",
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "provider_id": "123e4567-e89b-12d3-a456-426614174000",
                "model_name": "llama3.1:8b",
                "status": "completed",
                "message_count": 100,
                "accuracy": 0.87,
                "avg_confidence": 0.92,
                "avg_execution_time_ms": 1250.5,
            }
        }


class ExperimentCreate(SQLModel):
    """Schema for creating new classification experiment."""

    provider_id: UUID = Field(description="LLM provider UUID")
    model_name: str = Field(
        min_length=1,
        max_length=100,
        description="Model name for classification",
    )
    message_count: int = Field(
        ge=1,
        le=1000,
        description="Number of messages to classify (1-1000)",
    )


class ExperimentUpdate(SQLModel):
    """Schema for updating experiment (internal use)."""

    status: ExperimentStatus | None = None
    accuracy: float | None = None
    avg_confidence: float | None = None
    avg_execution_time_ms: float | None = None
    confusion_matrix: dict | None = None
    classification_results: list[dict] | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error_message: str | None = None


class ExperimentPublic(SQLModel):
    """Public schema for experiment responses."""

    id: int
    provider_id: UUID
    model_name: str
    status: ExperimentStatus
    message_count: int
    accuracy: float | None
    avg_confidence: float | None
    avg_execution_time_ms: float | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class ClassificationResultDetail(SQLModel):
    """Schema for individual classification result."""

    message_id: int
    message_content: str
    actual_topic_id: int | None
    actual_topic_name: str | None
    predicted_topic_id: int
    predicted_topic_name: str
    confidence: float
    execution_time_ms: float
    reasoning: str
    alternatives: list[dict]


class ExperimentDetailPublic(ExperimentPublic):
    """Detailed experiment response with results and confusion matrix."""

    confusion_matrix: dict | None
    classification_results: list[dict]


class ExperimentListResponse(SQLModel):
    """Paginated response schema for experiments."""

    items: list[ExperimentPublic]
    total: int
    page: int
    page_size: int
