"""API endpoints for LLM Provider management.

Provides CRUD endpoints for managing LLM providers (Ollama, OpenAI)
with async validation and encrypted credentials.
"""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models import LLMProviderCreate, LLMProviderPublic, LLMProviderUpdate
from app.services import ProviderCRUD

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/providers", tags=["providers"])


@router.post(
    "",
    response_model=LLMProviderPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create LLM provider",
    description="Create new LLM provider with encrypted credentials. Triggers async validation.",
)
async def create_provider(
    provider_data: LLMProviderCreate,
    session: AsyncSession = Depends(get_session),
) -> LLMProviderPublic:
    """Create new LLM provider.

    Args:
        provider_data: Provider configuration (name, type, base_url, api_key)
        session: Database session

    Returns:
        Created provider with validation_status="pending"

    Raises:
        HTTPException 409: Provider name already exists
        HTTPException 400: Invalid provider configuration
    """
    try:
        crud = ProviderCRUD(session)
        provider = await crud.create(provider_data, schedule_validation=True)
        logger.info(f"Created provider '{provider.name}' with ID {provider.id}")
        return provider
    except ValueError as e:
        if "already exists" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "",
    response_model=list[LLMProviderPublic],
    summary="List all providers",
    description="Get list of all configured LLM providers with pagination and filters.",
)
async def list_providers(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    active_only: bool = Query(False, description="Filter for active providers only"),
    session: AsyncSession = Depends(get_session),
) -> list[LLMProviderPublic]:
    """List all LLM providers.

    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        active_only: Filter for active providers only
        session: Database session

    Returns:
        List of providers (API keys not included in response)
    """
    crud = ProviderCRUD(session)
    providers = await crud.list(skip=skip, limit=limit, active_only=active_only)
    return providers


@router.get(
    "/{provider_id}",
    response_model=LLMProviderPublic,
    summary="Get provider by ID",
    description="Get single provider configuration with validation details.",
)
async def get_provider(
    provider_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> LLMProviderPublic:
    """Get provider by ID.

    Args:
        provider_id: Provider UUID
        session: Database session

    Returns:
        Provider configuration (API key not included)

    Raises:
        HTTPException 404: Provider not found
    """
    crud = ProviderCRUD(session)
    provider = await crud.get(provider_id)

    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider with ID '{provider_id}' not found",
        )

    return provider


@router.put(
    "/{provider_id}",
    response_model=LLMProviderPublic,
    summary="Update provider",
    description="Update provider configuration. Triggers re-validation if connection details changed.",
)
async def update_provider(
    provider_id: UUID,
    update_data: LLMProviderUpdate,
    session: AsyncSession = Depends(get_session),
) -> LLMProviderPublic:
    """Update provider configuration.

    Args:
        provider_id: Provider UUID
        update_data: Fields to update
        session: Database session

    Returns:
        Updated provider configuration

    Raises:
        HTTPException 404: Provider not found
        HTTPException 400: Invalid update data
    """
    try:
        crud = ProviderCRUD(session)
        provider = await crud.update(provider_id, update_data, schedule_validation=True)

        if not provider:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Provider with ID '{provider_id}' not found",
            )

        logger.info(f"Updated provider '{provider.name}' (ID: {provider.id})")
        return provider
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete(
    "/{provider_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete provider",
    description="Delete provider configuration. Fails if referenced by active agents.",
)
async def delete_provider(
    provider_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> None:
    """Delete provider.

    Args:
        provider_id: Provider UUID
        session: Database session

    Raises:
        HTTPException 404: Provider not found
        HTTPException 409: Provider referenced by agents (FK constraint)
    """
    crud = ProviderCRUD(session)

    try:
        deleted = await crud.delete(provider_id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Provider with ID '{provider_id}' not found",
            )

        logger.info(f"Deleted provider (ID: {provider_id})")
    except Exception as e:
        # Foreign key constraint violation
        if "foreign key" in str(e).lower() or "violates" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete provider - it is referenced by active agents",
            )
        raise
