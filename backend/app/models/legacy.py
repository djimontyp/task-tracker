"""Legacy models from old task tracker system."""

import uuid
from datetime import datetime

from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from .base import IDMixin, TimestampMixin
from .enums import SourceType

# ~~~~~~~~~~~~~~~~ Source Models ~~~~~~~~~~~~~~~~


class SourceBase(SQLModel):
    """Base model for Source with common fields."""

    name: str = Field(max_length=100, description="Display name for the source")
    type: SourceType = Field(description="Type of communication source")
    config: dict | None = Field(default=None, sa_type=JSONB, description="Source-specific configuration")
    is_active: bool = Field(default=True, description="Whether source is actively monitored")


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


# ~~~~~~~~~~~~~~~~ Message Schemas (table defined in message.py) ~~~~~~~~~~~~~~~~


class MessageCreate(SQLModel):
    """Schema for creating new messages."""

    external_message_id: str
    content: str
    sent_at: datetime
    source_id: int
    author_id: int


class MessagePublic(SQLModel):
    """Public schema for message responses."""

    id: uuid.UUID
    external_message_id: str
    content: str
    sent_at: datetime
    source_id: int
    author_id: int
    classification: str | None
    confidence: float | None
    analyzed: bool
    created_at: datetime
    updated_at: datetime | None


class MessageUpdate(SQLModel):
    """Schema for updating messages - all fields optional."""

    classification: str | None = None
    confidence: float | None = None
    analyzed: bool | None = None


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
