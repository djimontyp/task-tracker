"""TelegramProfile model for Telegram-specific user data."""
from pydantic import computed_field
from sqlalchemy import BigInteger
from sqlmodel import Field, SQLModel

from .base import IDMixin, TimestampMixin


class TelegramProfile(IDMixin, TimestampMixin, SQLModel, table=True):
    """Telegram-specific user profile (one-to-one with User)."""

    __tablename__ = "telegram_profiles"

    # Telegram user identification
    telegram_user_id: int = Field(
        unique=True,
        index=True,
        sa_type=BigInteger,
        description="Unique Telegram user ID",
    )

    # Telegram names (for point-specific usage when needed)
    first_name: str = Field(max_length=100, description="Telegram first name")
    last_name: str | None = Field(
        default=None, max_length=100, description="Telegram last name"
    )

    # Additional Telegram fields
    language_code: str | None = Field(
        default=None, max_length=10, description="Telegram language code (e.g., 'en', 'uk')"
    )
    is_bot: bool = Field(
        default=False, description="Whether this Telegram account is a bot"
    )
    is_premium: bool = Field(
        default=False, description="Whether user has Telegram Premium"
    )

    # Relationships
    user_id: int = Field(
        foreign_key="users.id",
        unique=True,
        description="One-to-one relationship with User",
    )
    source_id: int = Field(
        foreign_key="sources.id",
        description="Link to Telegram source",
    )

    @computed_field  # type: ignore[misc]
    @property
    def full_name(self) -> str:
        """Telegram full name (for point-specific usage).

        Returns:
            str: 'FirstName LastName' or just 'FirstName' if no last name
        """
        if self.last_name:
            return f"{self.first_name} {self.last_name}".strip()
        return self.first_name
