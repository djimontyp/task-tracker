"""Legacy models from old task tracker system."""
from datetime import datetime
from typing import Dict, Optional

from pydantic import BaseModel
from sqlalchemy import BigInteger, DateTime, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from .base import IDMixin, TimestampMixin
from .enums import TaskStatus, TaskCategory, TaskPriority, SourceType


# ~~~~~~~~~~~~~~~~ Source Models ~~~~~~~~~~~~~~~~


class SourceBase(SQLModel):
    """Base model for Source with common fields."""

    name: str = Field(max_length=100, description="Display name for the source")
    type: SourceType = Field(description="Type of communication source")
    config: dict | None = Field(
        default=None, sa_type=JSONB, description="Source-specific configuration"
    )
    is_active: bool = Field(
        default=True, description="Whether source is actively monitored"
    )


class Source(IDMixin, TimestampMixin, SourceBase, table=True):
    """Source table - represents communication channels (Telegram, Slack, etc.)."""

    __tablename__ = "sources"


class SourceCreate(SourceBase):
    """Schema for creating new sources."""

    pass


class SourcePublic(SourceBase):
    """Public schema for source responses."""

    id: int
    created_at: datetime
    updated_at: datetime | None = None


class SourceUpdate(SQLModel):
    """Schema for updating sources - all fields optional."""

    name: str | None = None
    type: SourceType | None = None
    config: dict | None = None
    is_active: bool | None = None


# ~~~~~~~~~~~~~~~~ Message Models ~~~~~~~~~~~~~~~~


class MessageBase(SQLModel):
    """Base model for Message with common fields."""

    external_message_id: str = Field(
        max_length=100, description="ID from external system"
    )
    content: str = Field(sa_type=Text, description="Message content")
    author: str = Field(max_length=100, description="Message author")
    sent_at: datetime = Field(description="When message was sent")
    payload: dict | None = Field(
        default=None, sa_type=JSONB, description="Full message payload"
    )
    classification: str | None = Field(
        default=None, max_length=50, description="AI classification result"
    )
    confidence: float | None = Field(
        default=None, description="Classification confidence score"
    )
    processed: bool = Field(default=False, description="Whether message was processed")


class Message(IDMixin, TimestampMixin, MessageBase, table=True):
    """Message table - stores incoming messages from various sources."""

    __tablename__ = "messages"

    source_id: int | None = Field(default=None, foreign_key="sources.id")


class MessageCreate(MessageBase):
    """Schema for creating new messages."""

    source_id: int


class MessagePublic(MessageBase):
    """Public schema for message responses."""

    id: int
    source_id: int
    created_at: datetime
    updated_at: datetime | None = None


class MessageUpdate(SQLModel):
    """Schema for updating messages - all fields optional."""

    classification: str | None = None
    confidence: float | None = None
    processed: bool | None = None


# ~~~~~~~~~~~~~~~~ Task Models ~~~~~~~~~~~~~~~~


class TaskBase(SQLModel):
    """Base model for Task with common fields."""

    title: str = Field(max_length=200, description="Task title")
    description: str = Field(sa_type=Text, description="Detailed task description")
    category: TaskCategory = Field(description="Task category")
    priority: TaskPriority = Field(description="Task priority level")
    status: TaskStatus = Field(default=TaskStatus.open, description="Current status")
    classification_data: dict | None = Field(
        default=None, sa_type=JSONB, description="AI classification metadata"
    )
    ai_generated: bool = Field(
        default=False, description="Whether task was AI-generated"
    )
    confidence_score: float | None = Field(
        default=None, description="AI confidence score"
    )


class Task(IDMixin, TimestampMixin, TaskBase, table=True):
    """Task table - represents issues/tasks extracted from messages."""

    __tablename__ = "tasks"

    source_id: int | None = Field(default=None, foreign_key="sources.id")
    source_message_id: int | None = Field(default=None, foreign_key="messages.id")


class TaskCreate(TaskBase):
    """Schema for creating new tasks."""

    source_id: int | None = None
    source_message_id: int | None = None


class TaskPublic(TaskBase):
    """Public schema for task responses."""

    id: int
    source_id: int | None
    source_message_id: int | None
    created_at: datetime
    updated_at: datetime | None = None


class TaskUpdate(SQLModel):
    """Schema for updating tasks - all fields optional."""

    title: str | None = None
    description: str | None = None
    category: TaskCategory | None = None
    priority: TaskPriority | None = None
    status: TaskStatus | None = None


# ~~~~~~~~~~~~~~~~ Webhook Settings Models ~~~~~~~~~~~~~~~~


class WebhookSettingsBase(SQLModel):
    """Base model for webhook settings."""

    name: str = Field(max_length=100, description="Webhook configuration name")
    config: dict = Field(sa_type=JSONB, description="Webhook configuration")
    is_active: bool = Field(default=True, description="Whether webhook is active")


class WebhookSettings(IDMixin, TimestampMixin, WebhookSettingsBase, table=True):
    """WebhookSettings table - stores webhook configurations."""

    __tablename__ = "webhook_settings"


class WebhookSettingsCreate(WebhookSettingsBase):
    """Schema for creating new webhook settings."""

    pass


class WebhookSettingsPublic(WebhookSettingsBase):
    """Public schema for webhook settings responses."""

    id: int
    created_at: datetime
    updated_at: datetime | None = None


class WebhookSettingsUpdate(SQLModel):
    """Schema for updating webhook settings - all fields optional."""

    name: str | None = None
    config: dict | None = None
    is_active: bool | None = None


# ~~~~~~~~~~~~~~~~ Backward Compatibility Aliases ~~~~~~~~~~~~~~~~


class SimpleSource(SQLModel, table=True):
    """Backward compatibility model for existing simple_sources table."""

    __tablename__ = "simple_sources"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    created_at: datetime | None = Field(default=None)


class SimpleMessage(SQLModel, table=True):
    """Backward compatibility model for existing simple_messages table."""

    __tablename__ = "simple_messages"

    id: int | None = Field(default=None, primary_key=True)
    external_message_id: str = Field(max_length=100)
    content: str = Field(sa_type=Text)
    author: str = Field(max_length=100)  # Display name (first_name + last_name)
    sent_at: datetime
    source_id: int | None = Field(default=None, foreign_key="simple_sources.id")
    created_at: datetime | None = Field(default=None)
    analyzed: bool = Field(default=False)
    avatar_url: str | None = Field(default=None, max_length=500)

    # Telegram user identification fields
    telegram_user_id: int | None = Field(default=None, index=True)
    telegram_username: str | None = Field(default=None, max_length=100)
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)


class SimpleTask(SQLModel, table=True):
    """Backward compatibility model for existing simple_tasks table."""

    __tablename__ = "simple_tasks"

    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(max_length=200)
    description: str = Field(sa_type=Text)
    category: str = Field(max_length=50)
    priority: str = Field(max_length=20)
    source: str = Field(max_length=50)
    status: str = Field(default="open", max_length=20)
    created_at: datetime | None = Field(default=None)
