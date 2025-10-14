"""Task Configuration model for defining agent task schemas."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class TaskConfig(SQLModel, table=True):
    """
    Task Configuration.

    Defines a task with its Pydantic schema for structured I/O.
    Tasks can be assigned to multiple agents independently.
    """

    __tablename__ = "task_configs"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    name: str = Field(
        sa_type=Text,
        unique=True,
        index=True,
        description="Unique task name",
    )
    description: str | None = Field(
        default=None,
        sa_type=Text,
        description="Task description",
    )

    response_schema: dict = Field(
        sa_column=Column(JSONB, nullable=False),
        description="JSON Schema for task response validation",
    )

    is_active: bool = Field(default=True, description="Task is active")

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now()),
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "name": "Classify Message",
                "description": "Categorize incoming messages",
                "response_schema": {
                    "$schema": "http://json-schema.org/draft-07/schema#",
                    "type": "object",
                    "properties": {
                        "category": {
                            "type": "string",
                            "enum": ["bug", "feature", "question", "discussion"],
                        },
                        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                    },
                    "required": ["category", "confidence"],
                },
            }
        }


class TaskConfigCreate(SQLModel):
    """Schema for creating new task configuration."""

    name: str
    description: str | None = None
    response_schema: dict
    is_active: bool = True


class TaskConfigUpdate(SQLModel):
    """Schema for updating task configuration."""

    name: str | None = None
    description: str | None = None
    response_schema: dict | None = None
    is_active: bool | None = None


class TaskConfigPublic(SQLModel):
    """Public schema for task configuration responses."""

    id: UUID
    name: str
    description: str | None = None
    response_schema: dict
    is_active: bool
    created_at: datetime
    updated_at: datetime
