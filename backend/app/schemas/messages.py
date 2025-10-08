"""Message request/response schemas"""

from datetime import datetime
from pydantic import BaseModel


class MessageCreateRequest(BaseModel):
    """Request schema for creating a message"""

    external_message_id: str
    content: str
    sent_at: datetime
    source_id: int
    author_id: int  # User.id who authored the message
    telegram_profile_id: int | None = None
    avatar_url: str | None = None


class MessageResponse(BaseModel):
    """Response schema for message"""

    id: int
    external_message_id: str
    content: str
    sent_at: datetime

    # Source
    source_id: int
    source_name: str | None = None  # Joined from Source

    # Author (User)
    author_id: int
    author_name: str | None = None  # User.full_name
    avatar_url: str | None = None

    # Platform-specific
    telegram_profile_id: int | None = None

    # AI fields
    classification: str | None = None
    confidence: float | None = None
    analyzed: bool = False

    # Timestamps
    created_at: datetime | None = None
    updated_at: datetime | None = None


class MessageFiltersResponse(BaseModel):
    """Response schema for available message filters"""

    authors: list[str]
    sources: list[dict[str, int | str]]  # [{id: int, name: str}]
    date_range: dict[str, datetime | None]  # {min: datetime, max: datetime}
