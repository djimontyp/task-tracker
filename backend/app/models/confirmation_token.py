"""Confirmation token model for secure admin operations."""

import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import ClassVar

from sqlalchemy import Column, DateTime, Text
from sqlmodel import Field, SQLModel

from app.models.base import TimestampMixin


class DataWipeScope(str, Enum):
    """Scope of data wipe operation."""

    messages = "messages"
    atoms = "atoms"
    topics = "topics"
    all = "all"


class ConfirmationToken(TimestampMixin, SQLModel, table=True):
    """Confirmation token for sensitive admin operations.

    Tokens are single-use and expire after TTL_MINUTES.
    Used to prevent accidental destructive operations by requiring
    a two-step confirmation process.
    """

    __tablename__ = "confirmation_tokens"

    TTL_MINUTES: ClassVar[int] = 5

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        description="Unique identifier for the token",
    )
    token: str = Field(
        index=True,
        unique=True,
        max_length=64,
        description="Token string for validation",
    )
    scope: str = Field(
        max_length=20,
        description="Scope of the operation (messages, atoms, topics, all)",
    )
    expires_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False),
        description="Token expiration timestamp",
    )
    used: bool = Field(
        default=False,
        description="Whether token has been used",
    )
    used_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
        description="Timestamp when token was used",
    )
    metadata_json: str | None = Field(
        default=None,
        sa_type=Text,
        description="JSON metadata about the operation (affected counts)",
    )

    @classmethod
    def generate_token(cls) -> str:
        """Generate a secure random token string."""
        return uuid.uuid4().hex + uuid.uuid4().hex[:32]

    @classmethod
    def calculate_expiry(cls) -> datetime:
        """Calculate expiration time based on TTL."""
        from datetime import UTC

        return datetime.now(UTC) + timedelta(minutes=cls.TTL_MINUTES)

    def is_expired(self) -> bool:
        """Check if token has expired."""
        from datetime import UTC

        now = datetime.now(UTC)
        expires_at = self.expires_at
        # Handle naive datetime (SQLite does not store timezone)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=UTC)
        return now > expires_at

    def is_valid(self) -> bool:
        """Check if token is valid for use."""
        return not self.used and not self.is_expired()


class DataWipeRequest(SQLModel):
    """Request schema for initiating data wipe."""

    scope: DataWipeScope = Field(
        default=DataWipeScope.all,
        description="Scope of data to wipe",
    )


class DataWipeConfirmation(SQLModel):
    """Response schema for data wipe confirmation token."""

    token: str = Field(description="Confirmation token (valid for 5 minutes)")
    scope: str = Field(description="Scope of the operation")
    expires_at: str = Field(description="Token expiration timestamp (ISO format)")
    affected_counts: dict[str, int] = Field(
        description="Counts of entities that will be deleted"
    )
    warning: str = Field(
        description="Warning message about the operation"
    )


class DataWipeExecuteRequest(SQLModel):
    """Request schema for executing data wipe."""

    token: str = Field(
        min_length=32,
        description="Confirmation token from request endpoint",
    )


class DataWipeResult(SQLModel):
    """Response schema for executed data wipe."""

    success: bool = Field(description="Whether wipe completed successfully")
    deleted_counts: dict[str, int] = Field(
        description="Counts of entities deleted"
    )
    message: str = Field(description="Result message")
