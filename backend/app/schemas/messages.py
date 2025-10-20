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

    source_id: int
    source_name: str | None = None  # Joined from Source

    author_id: int
    author_name: str | None = None  # User.full_name
    avatar_url: str | None = None

    telegram_profile_id: int | None = None
    topic_id: int | None = None
    topic_name: str | None = None  # Joined from Topic

    classification: str | None = None
    confidence: float | None = None
    analyzed: bool = False

    embedding: list[float] | None = None
    has_embedding: bool = False

    importance_score: float | None = None
    noise_classification: str | None = None
    noise_factors: dict[str, float] | None = None

    author: str | None = None  # @deprecated Use author_name
    persisted: bool = True

    created_at: datetime | None = None
    updated_at: datetime | None = None


class MessageFiltersResponse(BaseModel):
    """Response schema for available message filters"""

    authors: list[str]
    sources: list[dict[str, int | str]]  # [{id: int, name: str}]
    date_range: dict[str, datetime | None]  # {min: datetime, max: datetime}
