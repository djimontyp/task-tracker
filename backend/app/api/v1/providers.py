"""API endpoints for LLM Provider management.

Provides CRUD endpoints for managing LLM providers (Ollama, OpenAI)
with async validation and encrypted credentials.
"""

import logging
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from sqlmodel import Field, SQLModel

from app.models import LLMProviderCreate, LLMProviderPublic, LLMProviderUpdate, OllamaModelsResponse
from app.services import OllamaService, ProviderCRUD


class GeminiModel(SQLModel):
    """Schema for single Gemini model information."""

    name: str = Field(description="Model name (e.g., 'gemini-1.5-pro')")
    display_name: str = Field(description="Human-readable model name")
    description: str | None = Field(default=None, description="Model description")


class GeminiModelsResponse(SQLModel):
    """Response schema for Gemini models listing."""

    models: list[GeminiModel] = Field(
        default_factory=list,
        description="List of available Gemini models",
    )

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
        provider = await crud.create_provider(provider_data, schedule_validation=True)
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
        provider = await crud.update_provider(provider_id, update_data, schedule_validation=True)

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


@router.get(
    "/ollama/models",
    response_model=OllamaModelsResponse,
    summary="List Ollama models",
    description="Fetch available models from configured Ollama host for model selection during provider setup.",
)
async def list_ollama_models(
    host: str = Query(..., description="Ollama host URL (e.g., 'http://localhost:11434')"),
) -> OllamaModelsResponse:
    """List available models from Ollama instance.

    Args:
        host: Ollama host URL to query

    Returns:
        List of available Ollama models with metadata

    Raises:
        HTTPException 400: Invalid host URL or empty
        HTTPException 502: Connection to Ollama failed
        HTTPException 504: Request to Ollama timed out
    """
    if not host or not host.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ollama host URL is required",
        )

    ollama_service = OllamaService(timeout=10)

    try:
        models = await ollama_service.list_models(host)
        logger.info(f"Successfully fetched {len(models.models)} models from Ollama at {host}")
        return models
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"Request to Ollama at '{host}' timed out. Ensure the host is reachable.",
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Ollama API error: {e.response.status_code} - {e.response.text}",
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to connect to Ollama at '{host}': {str(e)}",
        )


@router.get(
    "/gemini/models",
    response_model=GeminiModelsResponse,
    summary="List Gemini models",
    description="Fetch available Gemini models from Google API for model selection.",
)
async def list_gemini_models(
    provider_id: UUID | None = Query(None, description="Provider ID to get API key from database"),
    api_key: str | None = Query(None, description="Google API key (alternative to provider_id)"),
    session: AsyncSession = Depends(get_session),
) -> GeminiModelsResponse:
    """List available models from Google Gemini API.

    Args:
        provider_id: UUID of Gemini provider to get API key from DB
        api_key: Google API key (alternative, for setup before provider is saved)
        session: Database session

    Returns:
        List of available Gemini models with metadata

    Raises:
        HTTPException 400: Neither provider_id nor api_key provided
        HTTPException 404: Provider not found
        HTTPException 502: Connection to Google API failed
        HTTPException 504: Request to Google API timed out
    """
    # Get API key from provider if provider_id is given
    if provider_id:
        crud = ProviderCRUD(session)
        decrypted_key = await crud.get_decrypted_api_key(provider_id)
        if not decrypted_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Provider not found or has no API key",
            )
        api_key = decrypted_key

    if not api_key or not api_key.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either provider_id or api_key is required",
        )

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                "https://generativelanguage.googleapis.com/v1beta/models",
                params={"key": api_key},
            )
            response.raise_for_status()

        data = response.json()
        models: list[GeminiModel] = []

        for m in data.get("models", []):
            name = m.get("name", "").replace("models/", "")
            # Only include gemini models
            if name.startswith("gemini-"):
                models.append(
                    GeminiModel(
                        name=name,
                        display_name=m.get("displayName", name),
                        description=m.get("description"),
                    )
                )

        logger.info(f"Successfully fetched {len(models)} Gemini models from Google API")
        return GeminiModelsResponse(models=models)

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Request to Google Gemini API timed out.",
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 400:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Google API key",
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Google API error: {e.response.status_code} - {e.response.text}",
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to connect to Google API: {str(e)}",
        )
