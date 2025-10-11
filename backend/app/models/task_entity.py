"""TaskEntity model - placeholder for Phase 2 task management."""
from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from .enums import TaskCategory, TaskPriority, TaskStatus


class TaskEntity(SQLModel, table=True):
    """
    TaskEntity - placeholder for Phase 2.

    This is a minimal implementation to satisfy foreign keys in TaskProposal.
    Full implementation will be done in Phase 2.
    """

    __tablename__ = "task_entities"

    # Primary Key
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Basic fields
    title: str = Field(max_length=500, description="Task title")
    description: str = Field(sa_type=Text, description="Task description")
    status: str = Field(
        default=TaskStatus.open.value,
        max_length=50,
        description="Task status",
    )
    priority: str = Field(
        default=TaskPriority.medium.value,
        max_length=50,
        description="Task priority",
    )
    category: str = Field(
        default=TaskCategory.feature.value,
        max_length=50,
        description="Task category",
    )

    # Timestamps
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now()},
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={
            "server_default": func.now(),
            "onupdate": func.now(),
        },
    )


# Minimal schemas for Phase 1
class TaskEntityPublic(SQLModel):
    """Public schema for task entity responses."""

    id: UUID
    title: str
    description: str
    status: str
    priority: str
    category: str
    created_at: datetime
    updated_at: datetime
