from datetime import datetime

from pydantic import BaseModel, Field


class NotificationPreferenceUpdate(BaseModel):
    email_enabled: bool | None = None
    email_address: str | None = None
    telegram_enabled: bool | None = None
    telegram_chat_id: str | None = None
    pending_threshold: int | None = None
    digest_enabled: bool | None = None
    digest_frequency: str | None = None
    digest_time: str | None = None


class NotificationPreferencePublic(BaseModel):
    id: int
    user_id: int | None
    email_enabled: bool
    email_address: str | None
    telegram_enabled: bool
    telegram_chat_id: str | None
    pending_threshold: int
    digest_enabled: bool
    digest_frequency: str
    digest_time: str
    last_notification_sent: datetime | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TestEmailRequest(BaseModel):
    email_address: str = Field(
        ..., pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    )


class TestTelegramRequest(BaseModel):
    chat_id: str = Field(..., min_length=1)
