"""Task Configuration model for defining agent task schemas."""
from datetime import datetime, timezone
from typing import Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Column, Field, SQLModel


class TaskConfig(SQLModel, table=True):
    """
    Task Configuration.

    Defines a task with its Pydantic schema for structured I/O.
    Tasks can be assigned to multiple agents independently.
    """

    __tablename__ = "task_configs"

    # Primary Key
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Core Fields
    name: str = Field(
        sa_type=Text,
        unique=True,
        index=True,
        description="Unique task name",
    )
    description: Optional[str] = Field(
        default=None,
        sa_type=Text,
        description="Task description",
    )

    # Pydantic Schema (JSON Schema format)
    response_schema: Dict = Field(
        sa_column=Column(JSONB, nullable=False),
        description="JSON Schema for task response validation",
    )

    # Status
    is_active: bool = Field(default=True, description="Task is active")

    # Timestamps
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now()},
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()},
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


# API Schemas
class TaskConfigCreate(SQLModel):
    """Schema for creating new task configuration."""

    name: str
    description: Optional[str] = None
    response_schema: Dict
    is_active: bool = True


class TaskConfigUpdate(SQLModel):
    """Schema for updating task configuration."""

    name: Optional[str] = None
    description: Optional[str] = None
    response_schema: Optional[Dict] = None
    is_active: Optional[bool] = None


class TaskConfigPublic(SQLModel):
    """Public schema for task configuration responses."""

    id: UUID
    name: str
    description: Optional[str] = None
    response_schema: Dict
    is_active: bool
    created_at: datetime
    updated_at: datetime
