from datetime import datetime
from enum import Enum

from sqlmodel import Field, SQLModel

from .base import IDMixin, TimestampMixin


class DigestFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"


class NotificationPreference(IDMixin, TimestampMixin, SQLModel, table=True):
    __tablename__ = "notification_preferences"

    user_id: int | None = Field(None, description="User ID for multi-user (future)")

    email_enabled: bool = Field(False)
    email_address: str | None = Field(None, max_length=255)

    telegram_enabled: bool = Field(False)
    telegram_chat_id: str | None = Field(None, max_length=100)

    pending_threshold: int = Field(10, ge=0)

    digest_enabled: bool = Field(False)
    digest_frequency: DigestFrequency = Field(DigestFrequency.DAILY)
    digest_time: str = Field("09:00", max_length=5)

    last_notification_sent: datetime | None = None

    class Config:
        use_enum_values = True
