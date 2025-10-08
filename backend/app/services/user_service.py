"""User service for user identification and management."""
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.user import User
from app.models.telegram_profile import TelegramProfile
from app.models.legacy import Source

logger = logging.getLogger(__name__)


async def get_or_create_source(
    db: AsyncSession, name: str
) -> Source:
    """Get existing source or create new one.

    Args:
        db: Database session
        name: Source name and type (e.g., "telegram", "slack", "email")

    Returns:
        Source: Found or created source
    """
    stmt = select(Source).where(Source.name == name)
    result = await db.execute(stmt)
    source = result.scalar_one_or_none()

    if not source:
        from app.models.enums import SourceType

        source = Source(
            name=name,
            type=SourceType[name.lower()],  # Use name (e.g., "telegram") not source_type
            is_active=True,
        )
        db.add(source)
        await db.commit()
        await db.refresh(source)
        logger.info(f"Created new source: {name}")

    return source


async def find_user_by_phone(db: AsyncSession, phone: str) -> Optional[User]:
    """Find user by phone number.

    Args:
        db: Database session
        phone: Phone number

    Returns:
        User or None if not found
    """
    stmt = select(User).where(User.phone == phone)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def find_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Find user by email address.

    Args:
        db: Database session
        email: Email address

    Returns:
        User or None if not found
    """
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_or_create_bot_user(db: AsyncSession) -> User:
    """Get or create special Bot User for system messages.

    Args:
        db: Database session

    Returns:
        User: Bot user
    """
    # Try to find existing bot user
    stmt = select(User).where(User.is_bot == True)  # noqa: E712
    result = await db.execute(stmt)
    bot_user = result.scalar_one_or_none()

    if not bot_user:
        bot_user = User(
            first_name="Bot",
            last_name="System",
            is_bot=True,
            is_active=True,
        )
        db.add(bot_user)
        await db.commit()
        await db.refresh(bot_user)
        logger.info("Created Bot User for system messages")

    return bot_user


async def identify_or_create_user(
    db: AsyncSession,
    telegram_user_id: int,
    first_name: str,
    last_name: Optional[str] = None,
    phone: Optional[str] = None,
    email: Optional[str] = None,
    language_code: Optional[str] = None,
    is_bot: bool = False,
    is_premium: bool = False,
) -> tuple[User, TelegramProfile]:
    """Identify or create user and telegram profile.

    Process:
    1. Check if TelegramProfile exists for telegram_user_id
    2. If exists -> return (User, TelegramProfile)
    3. If not exists:
       a) Try auto-link by phone/email to existing User
       b) If auto-link fails -> create new User
       c) Create TelegramProfile
    4. Return (User, TelegramProfile)

    Args:
        db: Database session
        telegram_user_id: Telegram user ID
        first_name: First name from Telegram
        last_name: Last name from Telegram (optional)
        phone: Phone number for auto-linking (optional)
        email: Email for auto-linking (optional)
        language_code: Telegram language code (optional)
        is_bot: Whether Telegram account is a bot
        is_premium: Whether user has Telegram Premium

    Returns:
        tuple[User, TelegramProfile]: User and their Telegram profile
    """
    # Get or create telegram source
    telegram_source = await get_or_create_source(db, name="telegram")

    # Try to find existing TelegramProfile
    stmt = select(TelegramProfile).where(
        TelegramProfile.telegram_user_id == telegram_user_id
    )
    result = await db.execute(stmt)
    tg_profile = result.scalar_one_or_none()

    if tg_profile:
        # Update Telegram profile data (names/settings may change)
        tg_profile.first_name = first_name
        tg_profile.last_name = last_name
        tg_profile.language_code = language_code
        tg_profile.is_premium = is_premium
        await db.commit()
        await db.refresh(tg_profile)

        # Load User
        user_stmt = select(User).where(User.id == tg_profile.user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one()

        logger.info(
            f"Found existing user {user.id} for Telegram user {telegram_user_id}"
        )
        return user, tg_profile

    # Try auto-linking
    user = None
    if phone:
        user = await find_user_by_phone(db, phone)
        if user:
            logger.info(f"Auto-linked Telegram user {telegram_user_id} by phone")

    if not user and email:
        user = await find_user_by_email(db, email)
        if user:
            logger.info(f"Auto-linked Telegram user {telegram_user_id} by email")

    # Create new User if auto-linking failed
    if not user:
        user = User(
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            email=email,
            is_active=True,
            is_bot=False,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info(f"Created new user {user.id} for Telegram user {telegram_user_id}")

    # Create TelegramProfile
    tg_profile = TelegramProfile(
        telegram_user_id=telegram_user_id,
        first_name=first_name,
        last_name=last_name,
        language_code=language_code,
        is_bot=is_bot,
        is_premium=is_premium,
        user_id=user.id,
        source_id=telegram_source.id,
    )
    db.add(tg_profile)
    await db.commit()
    await db.refresh(tg_profile)

    logger.info(f"Created TelegramProfile for user {user.id}")
    return user, tg_profile
