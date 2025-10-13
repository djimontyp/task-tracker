"""User management API endpoints."""

import logging

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.models import TelegramProfile, User
from app.schemas.users import (
    LinkTelegramProfileRequest,
    TelegramProfileResponse,
    UserCreateRequest,
    UserResponse,
)

from ..deps import DatabaseDep

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "",
    response_model=list[UserResponse],
    summary="Get all users",
    response_description="List of all users",
)
async def get_users(db: DatabaseDep) -> list[UserResponse]:
    """
    Retrieve all users.

    Returns complete user information including computed full_name.
    """
    from sqlalchemy import desc

    statement = select(User).order_by(desc(User.created_at))  # type: ignore[arg-type]
    result = await db.execute(statement)
    users = result.scalars().all()

    return [
        UserResponse(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            full_name=user.full_name,  # computed field
            email=user.email,
            phone=user.phone,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
            is_bot=user.is_bot,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
        for user in users
    ]


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user by ID",
    response_description="User details",
    responses={404: {"description": "User not found"}},
)
async def get_user(user_id: int, db: DatabaseDep) -> UserResponse:
    """
    Retrieve a specific user by ID.

    Raises 404 error if user doesn't exist.
    """
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    assert user.id is not None

    return UserResponse(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        is_bot=user.is_bot,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.post(
    "",
    response_model=UserResponse,
    summary="Create new user",
    response_description="Created user",
    status_code=status.HTTP_201_CREATED,
)
async def create_user(user_data: UserCreateRequest, db: DatabaseDep) -> UserResponse:
    """
    Create a new user manually.

    Used for manual user creation (not via Telegram auto-linking).
    """
    user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        phone=user_data.phone,
        avatar_url=user_data.avatar_url,
        is_active=True,
        is_bot=False,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    assert user.id is not None

    return UserResponse(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        is_bot=user.is_bot,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.get(
    "/{user_id}/telegram-profile",
    response_model=TelegramProfileResponse,
    summary="Get user's Telegram profile",
    response_description="Telegram profile details",
    responses={404: {"description": "User or TelegramProfile not found"}},
)
async def get_user_telegram_profile(user_id: int, db: DatabaseDep) -> TelegramProfileResponse:
    """
    Retrieve Telegram profile for a user.

    Returns 404 if user doesn't exist or doesn't have a Telegram profile.
    """
    # Check user exists
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Find Telegram profile
    statement = select(TelegramProfile).where(TelegramProfile.user_id == user_id)
    result = await db.execute(statement)
    tg_profile = result.scalar_one_or_none()

    if not tg_profile:
        raise HTTPException(status_code=404, detail="TelegramProfile not found for this user")

    return TelegramProfileResponse(
        id=tg_profile.id,
        telegram_user_id=tg_profile.telegram_user_id,
        first_name=tg_profile.first_name,
        last_name=tg_profile.last_name,
        full_name=tg_profile.full_name,  # computed field
        language_code=tg_profile.language_code,
        is_bot=tg_profile.is_bot,
        is_premium=tg_profile.is_premium,
        user_id=tg_profile.user_id,
        source_id=tg_profile.source_id,
        created_at=tg_profile.created_at,
        updated_at=tg_profile.updated_at,
    )


@router.post(
    "/{user_id}/link-telegram",
    response_model=TelegramProfileResponse,
    summary="Manually link Telegram profile to user",
    response_description="Linked Telegram profile",
    status_code=status.HTTP_201_CREATED,
    responses={
        404: {"description": "User or Telegram user not found"},
        409: {"description": "TelegramProfile already linked to another user"},
    },
)
async def link_telegram_profile(
    user_id: int, request: LinkTelegramProfileRequest, db: DatabaseDep
) -> TelegramProfileResponse:
    """
    Manually link an existing Telegram user to a User.

    This is used when auto-linking fails or for manual correction.
    Requires that telegram_user_id exists in system (user must have sent at least one message).
    """
    # Check user exists
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Find Telegram profile by telegram_user_id
    stmt = select(TelegramProfile).where(TelegramProfile.telegram_user_id == request.telegram_user_id)
    result = await db.execute(stmt)
    tg_profile = result.scalar_one_or_none()

    if not tg_profile:
        raise HTTPException(
            status_code=404,
            detail=f"Telegram user {request.telegram_user_id} not found in system. User must send at least one message first.",
        )

    # Check if already linked to different user
    if tg_profile.user_id != user_id:
        raise HTTPException(
            status_code=409,
            detail=f"Telegram profile already linked to user {tg_profile.user_id}",
        )

    # Update link
    tg_profile.user_id = user_id
    await db.commit()
    await db.refresh(tg_profile)

    logger.info(f"Manually linked Telegram user {request.telegram_user_id} to user {user_id}")

    return TelegramProfileResponse(
        id=tg_profile.id,
        telegram_user_id=tg_profile.telegram_user_id,
        first_name=tg_profile.first_name,
        last_name=tg_profile.last_name,
        full_name=tg_profile.full_name,
        language_code=tg_profile.language_code,
        is_bot=tg_profile.is_bot,
        is_premium=tg_profile.is_premium,
        user_id=tg_profile.user_id,
        source_id=tg_profile.source_id,
        created_at=tg_profile.created_at,
        updated_at=tg_profile.updated_at,
    )
