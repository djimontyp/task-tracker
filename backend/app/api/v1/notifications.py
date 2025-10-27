from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.schemas.notification import (
    NotificationPreferencePublic,
    NotificationPreferenceUpdate,
    TestEmailRequest,
    TestTelegramRequest,
)
from app.dependencies import get_db_session
from app.models.notification_preference import NotificationPreference
from app.services.notification_service import notification_service

router = APIRouter()


@router.get("/preferences", response_model=NotificationPreferencePublic)
async def get_preferences(session: AsyncSession = Depends(get_db_session)) -> NotificationPreference:
    """Get notification preferences."""
    result = await session.execute(select(NotificationPreference))
    pref = result.scalars().first()

    if not pref:
        pref = NotificationPreference()
        session.add(pref)
        await session.commit()
        await session.refresh(pref)

    return pref


@router.put("/preferences", response_model=NotificationPreferencePublic)
async def update_preferences(
    data: NotificationPreferenceUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> NotificationPreference:
    """Update notification preferences."""
    result = await session.execute(select(NotificationPreference))
    pref = result.scalars().first()

    if not pref:
        pref = NotificationPreference()

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(pref, field, value)

    session.add(pref)
    await session.commit()
    await session.refresh(pref)
    return pref


@router.post("/test-email", status_code=200)
async def test_email(
    request: TestEmailRequest,
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, str]:
    """Send test email."""
    try:
        await notification_service.send_test_email(request.email_address)
        return {"message": "Test email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test-telegram", status_code=200)
async def test_telegram(
    request: TestTelegramRequest,
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, str]:
    """Send test Telegram notification."""
    try:
        await notification_service.send_test_telegram(request.chat_id)
        return {"message": "Test Telegram notification sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
