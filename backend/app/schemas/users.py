"""User and TelegramProfile schemas"""

from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    """Response schema for User"""

    id: int
    first_name: str
    last_name: str | None
    full_name: str  # computed field from User model
    email: str | None
    phone: str | None
    avatar_url: str | None
    is_active: bool
    is_bot: bool
    created_at: datetime | None
    updated_at: datetime | None


class UserCreateRequest(BaseModel):
    """Request schema for creating User"""

    first_name: str
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    avatar_url: str | None = None


class TelegramProfileResponse(BaseModel):
    """Response schema for TelegramProfile"""

    id: int
    telegram_user_id: int
    first_name: str
    last_name: str | None
    full_name: str  # computed field
    language_code: str | None
    is_bot: bool
    is_premium: bool
    user_id: int
    source_id: int
    created_at: datetime | None
    updated_at: datetime | None


class LinkTelegramProfileRequest(BaseModel):
    """Request schema for manually linking User to TelegramProfile"""

    telegram_user_id: int
