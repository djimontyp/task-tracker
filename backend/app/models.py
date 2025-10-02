from datetime import datetime
from typing import Dict, Optional
from enum import Enum

from pydantic import BaseModel
from sqlalchemy import BigInteger, DateTime, func, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import SQLModel, Field


# ~~~~~~~~~~~~~~~~ Enums for Type Safety ~~~~~~~~~~~~~~~~


class TaskStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    completed = "completed"
    closed = "closed"


class TaskCategory(str, Enum):
    bug = "bug"
    feature = "feature"
    improvement = "improvement"
    question = "question"
    chore = "chore"


class TaskPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class SourceType(str, Enum):
    telegram = "telegram"
    slack = "slack"
    email = "email"
    api = "api"


# ~~~~~~~~~~~~~~~~ Mixins for Common Patterns ~~~~~~~~~~~~~~~~


class IDMixin(SQLModel):
    """Primary key mixin with BigInteger for scalability"""

    id: int | None = Field(default=None, primary_key=True, sa_type=BigInteger)


class TimestampMixin(SQLModel):
    """Timestamp mixin with automatic creation and update tracking"""

    created_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now()},
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()},
    )


# ~~~~~~~~~~~~~~~~ Source Models ~~~~~~~~~~~~~~~~


class SourceBase(SQLModel):
    """Base model for Source with common fields"""

    name: str = Field(max_length=100, description="Display name for the source")
    type: SourceType = Field(description="Type of communication source")
    config: dict | None = Field(
        default=None, sa_type=JSONB, description="Source-specific configuration"
    )
    is_active: bool = Field(
        default=True, description="Whether source is actively monitored"
    )


class Source(IDMixin, TimestampMixin, SourceBase, table=True):
    """Source table - represents communication channels (Telegram, Slack, etc.)"""

    __tablename__ = "sources"

    # Relationships will be added in future phases
    # messages: list["Message"] = Relationship(back_populates="source")
    # tasks: list["Task"] = Relationship(back_populates="source")


class SourceCreate(SourceBase):
    """Schema for creating new sources"""

    pass


class SourcePublic(SourceBase):
    """Public schema for source responses"""

    id: int
    created_at: datetime
    updated_at: datetime | None = None


class SourceUpdate(SQLModel):
    """Schema for updating sources - all fields optional"""

    name: str | None = None
    type: SourceType | None = None
    config: dict | None = None
    is_active: bool | None = None


# ~~~~~~~~~~~~~~~~ Message Models ~~~~~~~~~~~~~~~~


class MessageBase(SQLModel):
    """Base model for Message with common fields"""

    external_message_id: str = Field(
        max_length=100, description="Original message ID from source"
    )
    content: str = Field(sa_type=Text, description="Message content/text")
    author: str = Field(max_length=100, description="Message author/sender")
    sent_at: datetime = Field(description="When message was originally sent")

    # AI-ready fields for future enhancement
    payload: dict | None = Field(
        default=None,
        sa_type=JSONB,
        description="Raw message data from source (Telegram update, Slack event, etc.)",
    )
    classification: str | None = Field(
        default=None,
        max_length=50,
        description="AI classification result (task, question, notification, etc.)",
    )
    confidence: float | None = Field(
        default=None, ge=0.0, le=1.0, description="AI confidence score (0.0-1.0)"
    )
    processed: bool = Field(
        default=False, description="Whether message has been processed by AI"
    )


class Message(IDMixin, TimestampMixin, MessageBase, table=True):
    """Message table - stores incoming messages from various sources"""

    __tablename__ = "messages"

    # Foreign key to Source
    source_id: int | None = Field(
        default=None, foreign_key="sources.id", sa_type=BigInteger
    )

    # Future relationships
    # source: Source | None = Relationship(back_populates="messages")
    # generated_tasks: list["Task"] = Relationship(back_populates="source_message")

    # Indexes will be added in future migration phases
    # __table_args__ = (
    #     Index("ix_message_external_id_source", "external_message_id", "source_id"),
    #     Index("ix_message_sent_at", "sent_at"),
    #     Index("ix_message_processed", "processed"),
    # )


class MessageCreate(MessageBase):
    """Schema for creating new messages"""

    source_id: int | None = None


class MessagePublic(MessageBase):
    """Public schema for message responses"""

    id: int
    source_id: int | None
    created_at: datetime
    updated_at: datetime | None = None


class MessageUpdate(SQLModel):
    """Schema for updating messages - all fields optional"""

    classification: str | None = None
    confidence: float | None = None
    processed: bool | None = None


# ~~~~~~~~~~~~~~~~ Task Models ~~~~~~~~~~~~~~~~


class TaskBase(SQLModel):
    """Base model for Task with common fields"""

    title: str = Field(max_length=200, description="Task title/summary")
    description: str = Field(sa_type=Text, description="Detailed task description")
    category: TaskCategory = Field(description="Task category")
    priority: TaskPriority = Field(description="Task priority level")
    status: TaskStatus = Field(
        default=TaskStatus.open, description="Current task status"
    )

    # AI-ready fields for future enhancement
    classification_data: dict | None = Field(
        default=None,
        sa_type=JSONB,
        description="Detailed AI classification results and metadata",
    )
    ai_generated: bool = Field(
        default=False, description="Whether task was created by AI"
    )
    confidence_score: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="AI confidence score for task classification",
    )


class Task(IDMixin, TimestampMixin, TaskBase, table=True):
    """Task table - represents issues/tasks extracted from messages"""

    __tablename__ = "tasks"

    # Foreign keys
    source_id: int | None = Field(
        default=None, foreign_key="sources.id", sa_type=BigInteger
    )
    source_message_id: int | None = Field(
        default=None,
        foreign_key="messages.id",
        sa_type=BigInteger,
        description="Original message that generated this task",
    )

    # Future relationships
    # source: Source | None = Relationship(back_populates="tasks")
    # source_message: Message | None = Relationship(back_populates="generated_tasks")

    # Indexes will be added in future migration phases
    # __table_args__ = (
    #     Index("ix_task_status", "status"),
    #     Index("ix_task_priority", "priority"),
    #     Index("ix_task_category", "category"),
    #     Index("ix_task_ai_generated", "ai_generated"),
    # )


class TaskCreate(TaskBase):
    """Schema for creating new tasks"""

    source_id: int | None = None
    source_message_id: int | None = None


class TaskPublic(TaskBase):
    """Public schema for task responses"""

    id: int
    source_id: int | None
    source_message_id: int | None
    created_at: datetime
    updated_at: datetime | None = None


class TaskUpdate(SQLModel):
    """Schema for updating tasks - all fields optional"""

    title: str | None = None
    description: str | None = None
    category: TaskCategory | None = None
    priority: TaskPriority | None = None
    status: TaskStatus | None = None
    classification_data: dict | None = None
    confidence_score: float | None = None


# ~~~~~~~~~~~~~~~~ API Request/Response Schemas (Legacy Compatibility) ~~~~~~~~~~~~~~~~


class TaskCreateRequest(BaseModel):
    """Legacy API schema for task creation requests"""

    title: str
    description: str
    category: str
    priority: str
    source: str


class MessageCreateRequest(BaseModel):
    """Legacy API schema for message creation requests"""

    id: str
    content: str
    author: str
    timestamp: str
    chat_id: str
    user_id: int | None = None
    avatar_url: str | None = None


class TaskResponse(BaseModel):
    """Legacy API schema for task responses"""

    id: int
    title: str
    description: str
    category: str
    priority: str
    source: str
    created_at: datetime
    status: str = "open"

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    """Legacy API schema for message responses"""

    id: int
    external_message_id: str
    content: str
    author: str
    sent_at: datetime
    source_name: str
    analyzed: bool = False
    avatar_url: str | None = None
    persisted: bool = True

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    """API schema for statistics responses"""

    total_tasks: int
    open_tasks: int
    completed_tasks: int
    categories: Dict[str, int]
    priorities: Dict[str, int]


class MessageFiltersResponse(BaseModel):
    """API schema for message filter metadata"""

    authors: list[str]
    sources: list[str]
    total_messages: int
    date_range: dict[
        str, Optional[str]
    ]  # {"earliest": "2024-01-01", "latest": "2024-12-31"}


# ~~~~~~~~~~~~~~~~ Webhook Settings Models ~~~~~~~~~~~~~~~~


class WebhookSettingsBase(SQLModel):
    """Base model for WebhookSettings with common fields"""

    name: str = Field(max_length=100, description="Settings configuration name")
    config: dict = Field(
        sa_type=JSONB, description="Webhook configuration stored as JSON"
    )
    is_active: bool = Field(
        default=True, description="Whether webhook settings are active"
    )


class WebhookSettings(IDMixin, TimestampMixin, WebhookSettingsBase, table=True):
    """WebhookSettings table - stores webhook configurations for different platforms"""

    __tablename__ = "webhook_settings"


class WebhookSettingsCreate(WebhookSettingsBase):
    """Schema for creating new webhook settings"""

    pass


class WebhookSettingsPublic(WebhookSettingsBase):
    """Public schema for webhook settings responses"""

    id: int
    created_at: datetime
    updated_at: datetime | None = None


class WebhookSettingsUpdate(SQLModel):
    """Schema for updating webhook settings - all fields optional"""

    name: str | None = None
    config: dict | None = None
    is_active: bool | None = None


# ~~~~~~~~~~~~~~~~ Backward Compatibility Aliases ~~~~~~~~~~~~~~~~
# Simplified models with existing table names for gradual migration


class SimpleSource(SQLModel, table=True):
    """Backward compatibility model for existing simple_sources table"""

    __tablename__ = "simple_sources"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    created_at: datetime | None = Field(default=None)


class SimpleMessage(SQLModel, table=True):
    """Backward compatibility model for existing simple_messages table"""

    __tablename__ = "simple_messages"

    id: int | None = Field(default=None, primary_key=True)
    external_message_id: str = Field(max_length=100)
    content: str = Field(sa_type=Text)
    author: str = Field(max_length=100)
    sent_at: datetime
    source_id: int | None = Field(default=None, foreign_key="simple_sources.id")
    created_at: datetime | None = Field(default=None)
    analyzed: bool = Field(default=False)
    avatar_url: str | None = Field(default=None, max_length=500)


class SimpleTask(SQLModel, table=True):
    """Backward compatibility model for existing simple_tasks table"""

    __tablename__ = "simple_tasks"

    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(max_length=200)
    description: str = Field(sa_type=Text)
    category: str = Field(max_length=50)
    priority: str = Field(max_length=20)
    source: str = Field(max_length=50)
    status: str = Field(default="open", max_length=20)
    created_at: datetime | None = Field(default=None)
