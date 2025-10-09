"""API endpoints for LLM Provider management."""

import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.models import LLMProviderCreate, LLMProviderPublic, LLMProviderUpdate
from app.services.provider_crud import ProviderCRUD
from ..deps import DatabaseDep

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/providers", tags=["providers"])


@router.get(
    "",
    response_model=List[LLMProviderPublic],
    summary="List all providers",
    response_description="List of LLM providers with optional filters",
)
async def list_providers(
    db: DatabaseDep,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of records to return"
    ),
    active_only: bool = Query(False, description="Filter for active providers only"),
) -> List[LLMProviderPublic]:
    """
    Retrieve list of LLM provider configurations with pagination and filters.

    Supports filtering by active status.
    Returns providers ordered by creation date (newest first).
    """
    crud = ProviderCRUD(db)
    providers = await crud.list(skip=skip, limit=limit, active_only=active_only)
    return providers


@router.get(
    "/{provider_id}",
    response_model=LLMProviderPublic,
    summary="Get provider by ID",
    response_description="LLM provider configuration details",
)
async def get_provider(provider_id: UUID, db: DatabaseDep) -> LLMProviderPublic:
    """
    Retrieve a specific LLM provider configuration by UUID.

    Returns complete provider details including connection configuration
    and validation status. API keys are never exposed in responses.
    """
    crud = ProviderCRUD(db)
    provider = await crud.get(provider_id)

    if not provider:
        raise HTTPException(
            status_code=404, detail=f"Provider with ID '{provider_id}' not found"
        )

    return provider


@router.post(
    "",
    response_model=LLMProviderPublic,
    summary="Create new provider",
    response_description="Created LLM provider configuration",
    status_code=201,
)
async def create_provider(
    provider_data: LLMProviderCreate,
    db: DatabaseDep,
) -> LLMProviderPublic:
    """
    Create a new LLM provider configuration.

    Validates that:
    - Provider name is unique
    - Provider type is supported (ollama, openai)
    - Base URL is provided for Ollama providers

    API keys are automatically encrypted before storage.
    Provider validation is scheduled as a background task.

    Returns the created provider with generated UUID.
    """
    crud = ProviderCRUD(db)

    try:
        provider = await crud.create(provider_data, schedule_validation=True)
        logger.info(f"Created provider '{provider.name}' with ID {provider.id}")
        return provider
    except ValueError as e:
        # Handle name uniqueness violation
        raise HTTPException(status_code=409, detail=str(e))


@router.put(
    "/{provider_id}",
    response_model=LLMProviderPublic,
    summary="Update provider",
    response_description="Updated LLM provider configuration",
)
async def update_provider(
    provider_id: UUID,
    update_data: LLMProviderUpdate,
    db: DatabaseDep,
) -> LLMProviderPublic:
    """
    Update an existing LLM provider configuration.

    Supports partial updates - only provided fields will be modified.
    If connection details (base_url, api_key) are changed, validation
    status is reset and a new validation is scheduled.

    API keys are encrypted before storage and never exposed in responses.
    """
    crud = ProviderCRUD(db)
    provider = await crud.update(provider_id, update_data, schedule_validation=True)

    if not provider:
        raise HTTPException(
            status_code=404, detail=f"Provider with ID '{provider_id}' not found"
        )

    logger.info(f"Updated provider '{provider.name}' (ID: {provider_id})")
    return provider


@router.delete(
    "/{provider_id}",
    status_code=204,
    summary="Delete provider",
    response_description="Provider deleted successfully",
)
async def delete_provider(provider_id: UUID, db: DatabaseDep) -> None:
    """
    Delete an LLM provider configuration.

    Behavior:
    - If provider is referenced by agents, performs soft delete (marks as inactive)
    - If no references exist, performs hard delete

    This ensures referential integrity while allowing cleanup of unused providers.
    """
    crud = ProviderCRUD(db)
    success = await crud.delete(provider_id)

    if not success:
        raise HTTPException(
            status_code=404, detail=f"Provider with ID '{provider_id}' not found"
        )

    logger.info(f"Deleted provider (ID: {provider_id})")
