"""Admin API endpoints for system management.

Provides administrative operations like data wipe with two-step
confirmation process for safety.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models.confirmation_token import (
    DataWipeConfirmation,
    DataWipeExecuteRequest,
    DataWipeRequest,
    DataWipeResult,
    DataWipeScope,
)
from app.services.data_wipe_service import DataWipeService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


def get_data_wipe_service() -> DataWipeService:
    """Dependency for DataWipeService."""
    return DataWipeService()


@router.post(
    "/data-wipe/request",
    response_model=DataWipeConfirmation,
    status_code=status.HTTP_200_OK,
    summary="Request data wipe confirmation token",
    responses={
        200: {
            "description": "Confirmation token generated",
            "content": {
                "application/json": {
                    "example": {
                        "token": "abc123...",
                        "scope": "all",
                        "expires_at": "2024-01-15T12:05:00Z",
                        "affected_counts": {
                            "messages": 150,
                            "atoms": 45,
                            "topics": 10,
                        },
                        "warning": "This will permanently delete 205 records...",
                    }
                }
            },
        }
    },
)
async def request_data_wipe(
    request: DataWipeRequest,
    session: AsyncSession = Depends(get_session),
    service: DataWipeService = Depends(get_data_wipe_service),
) -> DataWipeConfirmation:
    """Request a data wipe operation and get a confirmation token.

    This is step 1 of the two-step confirmation process. Returns a token
    that must be used within 5 minutes to execute the actual wipe.

    **Scope options:**
    - `all`: Delete messages, atoms, and topics (default)
    - `messages`: Delete only messages and their history
    - `atoms`: Delete only atoms and their links/versions
    - `topics`: Delete only topics and their versions

    **What is preserved:**
    - Sources (Telegram, Slack, etc.)
    - Users
    - Telegram profiles
    - LLM providers
    - Agent configs
    - Automation rules
    """
    logger.info(
        "Data wipe requested: scope=%s",
        request.scope.value,
    )

    confirmation = await service.generate_confirmation_token(
        session=session,
        scope=request.scope,
    )

    return confirmation


@router.post(
    "/data-wipe/execute",
    response_model=DataWipeResult,
    status_code=status.HTTP_200_OK,
    summary="Execute data wipe with confirmation token",
    responses={
        200: {
            "description": "Data wipe executed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "deleted_counts": {
                            "messages": 150,
                            "atoms": 45,
                            "topics": 10,
                        },
                        "message": "Successfully deleted 205 records...",
                    }
                }
            },
        },
        400: {
            "description": "Invalid or expired token",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid or expired confirmation token"}
                }
            },
        },
    },
)
async def execute_data_wipe(
    request: DataWipeExecuteRequest,
    session: AsyncSession = Depends(get_session),
    service: DataWipeService = Depends(get_data_wipe_service),
) -> DataWipeResult:
    """Execute a data wipe operation with a valid confirmation token.

    This is step 2 of the two-step confirmation process. The token must
    have been obtained from the `/request` endpoint within the last 5 minutes.

    **Safety measures:**
    - Token expires after 5 minutes
    - Token can only be used once
    - Sources and user data are preserved

    **Warning:** This operation is irreversible!
    """
    logger.warning(
        "Data wipe execution requested: token=%s...",
        request.token[:8] if len(request.token) >= 8 else request.token,
    )

    try:
        result = await service.execute_wipe(
            session=session,
            token_str=request.token,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.get(
    "/data-wipe/preview",
    response_model=dict[str, int],
    status_code=status.HTTP_200_OK,
    summary="Preview affected entity counts",
)
async def preview_data_wipe(
    scope: DataWipeScope = DataWipeScope.all,
    session: AsyncSession = Depends(get_session),
    service: DataWipeService = Depends(get_data_wipe_service),
) -> dict[str, int]:
    """Preview how many entities would be affected by a data wipe.

    This is a read-only endpoint that shows counts without generating
    a token or performing any deletion.
    """
    counts = await service.get_affected_counts(session, scope)
    return counts
