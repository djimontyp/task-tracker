"""User model for central identity management."""
from datetime import datetime

from pydantic import computed_field, EmailStr, field_validator
from sqlalchemy import String
from sqlmodel import Field, SQLModel

from .base import IDMixin, TimestampMixin


class User(IDMixin, TimestampMixin, SQLModel, table=True):
    """Central user identity model used across the project."""

    __tablename__ = "users"

    # Name fields (used project-wide)
    first_name: str = Field(max_length=100, description="User's first name")
    last_name: str | None = Field(
        default=None, max_length=100, description="User's last name"
    )

    # Contact information for auto-linking
    email: str | None = Field(
        default=None,
        unique=True,
        index=True,
        sa_type=String,
        description="Email address for user identification",
    )
    phone: str | None = Field(
        default=None,
        unique=True,
        index=True,
        max_length=20,
        description="Phone number for user identification",
    )

    # Additional fields
    avatar_url: str | None = Field(
        default=None, max_length=500, description="URL to user's avatar image"
    )
    is_active: bool = Field(default=True, description="Whether user is active")
    is_bot: bool = Field(
        default=False, description="Whether this is a bot/system user"
    )

    @computed_field  # type: ignore[misc]
    @property
    def full_name(self) -> str:
        """Computed full name from first_name and last_name.

        Returns:
            str: 'FirstName LastName' or just 'FirstName' if no last name
        """
        if self.last_name:
            return f"{self.first_name} {self.last_name}".strip()
        return self.first_name

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        """Validate phone number format (international format).

        Args:
            v: Phone number string or None

        Returns:
            str | None: Validated phone number

        Raises:
            ValueError: If phone format is invalid
        """
        if v is None:
            return v

        import re

        if not re.match(r"^\+?[1-9]\d{1,14}$", v):
            raise ValueError("Invalid phone number format (use international format)")
        return v
