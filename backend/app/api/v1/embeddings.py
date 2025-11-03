"""Embeddings API endpoints for generating vector embeddings.

Provides endpoints for generating embeddings for messages and atoms using
LLM providers (OpenAI, Ollama). Supports both single and batch operations
with background task processing.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.atom import Atom
from app.models.llm_provider import LLMProvider
from app.models.message import Message
from app.models.topic import Topic
from app.services.embedding_service import EmbeddingService
from app.tasks import embed_atoms_batch_task, embed_messages_batch_task

router = APIRouter(prefix="/embeddings", tags=["embeddings"])


class EmbedRequest(BaseModel):
    """Request schema for generating single embedding."""

    provider_id: UUID = Field(description="LLMProvider UUID to use for embedding generation")


class EmbedResponse(BaseModel):
    """Response schema for single embedding operation."""

    id: UUID = Field(description="Message or Atom UUID")
    embedding_length: int = Field(description="Length of embedding vector (e.g., 1536)")
    status: str = Field(description="Status: completed/skipped")


class BatchEmbedRequest(BaseModel):
    """Request schema for batch embedding operation."""

    message_ids: list[UUID] = Field(description="List of message UUIDs to embed")
    provider_id: UUID = Field(description="LLMProvider UUID to use for embedding generation")


class BatchEmbedAtomsRequest(BaseModel):
    """Request schema for batch atom embedding operation."""

    atom_ids: list[UUID] = Field(description="List of atom UUIDs to embed")
    provider_id: UUID = Field(description="LLMProvider UUID to use for embedding generation")


class BatchEmbedResponse(BaseModel):
    """Response schema for batch embedding operation."""

    task_id: str = Field(description="Background task ID for tracking progress")
    count: int = Field(description="Number of items queued for embedding")
    provider_id: UUID = Field(description="Provider ID used for embedding")


# Batch endpoints must come BEFORE single-item endpoints to avoid path parameter conflicts
# (FastAPI would match "/messages/batch" as "/messages/{message_id}" with message_id="batch")


@router.post("/messages/batch", response_model=BatchEmbedResponse)
async def generate_batch_embeddings(
    request: BatchEmbedRequest, session: AsyncSession = Depends(get_session)
) -> BatchEmbedResponse:
    """Generate embeddings for multiple messages in background.

    Queues background task to process messages in batches. Returns immediately
    with task_id for tracking progress. Task handles errors gracefully and
    tracks success/failed/skipped counts.

    Args:
        request: Request containing message_ids and provider_id
        session: Database session (injected)

    Returns:
        BatchEmbedResponse with task_id and message count

    Raises:
        404: Provider not found
        400: Invalid request (empty message_ids list)

    Example:
        ```
        POST / api / v1 / embeddings / messages / batch
        {"message_ids": [1, 2, 3, 4, 5], "provider_id": "550e8400-e29b-41d4-a716-446655440000"}
        ```

        Response:
        ```
        {"task_id": "abc123...", "count": 5, "provider_id": "550e8400-e29b-41d4-a716-446655440000"}
        ```
    """
    if not request.message_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="message_ids list cannot be empty")

    provider = await session.get(LLMProvider, request.provider_id)
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Provider {request.provider_id} not found")

    task = await embed_messages_batch_task.kiq(message_ids=request.message_ids, provider_id=str(request.provider_id))

    return BatchEmbedResponse(task_id=task.task_id, count=len(request.message_ids), provider_id=request.provider_id)


@router.post("/atoms/batch", response_model=BatchEmbedResponse)
async def generate_batch_atom_embeddings(
    request: BatchEmbedAtomsRequest, session: AsyncSession = Depends(get_session)
) -> BatchEmbedResponse:
    """Generate embeddings for multiple atoms in background.

    Queues background task to process atoms in batches. Returns immediately
    with task_id for tracking progress. Task handles errors gracefully and
    tracks success/failed/skipped counts.

    Args:
        request: Request containing atom_ids and provider_id
        session: Database session (injected)

    Returns:
        BatchEmbedResponse with task_id and atom count

    Raises:
        404: Provider not found
        400: Invalid request (empty atom_ids list)

    Example:
        ```
        POST / api / v1 / embeddings / atoms / batch
        {"atom_ids": [1, 2, 3, 4, 5], "provider_id": "550e8400-e29b-41d4-a716-446655440000"}
        ```

        Response:
        ```
        {"task_id": "def456...", "count": 5, "provider_id": "550e8400-e29b-41d4-a716-446655440000"}
        ```
    """
    if not request.atom_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="atom_ids list cannot be empty")

    provider = await session.get(LLMProvider, request.provider_id)
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Provider {request.provider_id} not found")

    task = await embed_atoms_batch_task.kiq(atom_ids=request.atom_ids, provider_id=str(request.provider_id))

    return BatchEmbedResponse(task_id=task.task_id, count=len(request.atom_ids), provider_id=request.provider_id)


@router.post("/messages/{message_id}", response_model=EmbedResponse)
async def generate_message_embedding(
    message_id: UUID, request: EmbedRequest, session: AsyncSession = Depends(get_session)
) -> EmbedResponse:
    """Generate embedding for a single message.

    Uses specified LLM provider to generate vector embedding for message content.
    If message already has embedding, operation is skipped.

    Args:
        message_id: ID of message to embed
        request: Request containing provider_id
        session: Database session (injected)

    Returns:
        EmbedResponse with embedding status and length

    Raises:
        404: Message or Provider not found
        400: Provider doesn't support embeddings
        500: Embedding generation failed

    Example:
        ```
        POST / api / v1 / embeddings / messages / 123
        {"provider_id": "550e8400-e29b-41d4-a716-446655440000"}
        ```
    """
    message = await session.get(Message, message_id)
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Message {message_id} not found")

    provider = await session.get(LLMProvider, request.provider_id)
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Provider {request.provider_id} not found")

    has_embedding = False
    try:
        has_embedding = message.embedding is not None and len(message.embedding) > 0
    except (ValueError, AttributeError):
        has_embedding = hasattr(message.embedding, '__len__') and len(message.embedding) > 0

    if has_embedding:
        return EmbedResponse(id=message_id, embedding_length=len(message.embedding), status="skipped")

    try:
        service = EmbeddingService(provider)
        updated_message = await service.embed_message(session, message)

        return EmbedResponse(
            id=message_id,
            embedding_length=len(updated_message.embedding) if updated_message.embedding else 0,
            status="completed",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Embedding generation failed: {str(e)}"
        )


@router.post("/atoms/{atom_id}", response_model=EmbedResponse)
async def generate_atom_embedding(
    atom_id: UUID, request: EmbedRequest, session: AsyncSession = Depends(get_session)
) -> EmbedResponse:
    """Generate embedding for a single atom.

    Uses specified LLM provider to generate vector embedding for atom content
    (combination of title and content). If atom already has embedding, operation is skipped.

    Args:
        atom_id: ID of atom to embed
        request: Request containing provider_id
        session: Database session (injected)

    Returns:
        EmbedResponse with embedding status and length

    Raises:
        404: Atom or Provider not found
        400: Provider doesn't support embeddings
        500: Embedding generation failed

    Example:
        ```
        POST / api / v1 / embeddings / atoms / 456
        {"provider_id": "550e8400-e29b-41d4-a716-446655440000"}
        ```
    """
    atom = await session.get(Atom, atom_id)
    if not atom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Atom {atom_id} not found")

    provider = await session.get(LLMProvider, request.provider_id)
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Provider {request.provider_id} not found")

    has_embedding = False
    try:
        has_embedding = atom.embedding is not None and len(atom.embedding) > 0
    except (ValueError, AttributeError):
        has_embedding = hasattr(atom.embedding, '__len__') and len(atom.embedding) > 0

    if has_embedding:
        return EmbedResponse(id=atom_id, embedding_length=len(atom.embedding), status="skipped")

    try:
        service = EmbeddingService(provider)
        updated_atom = await service.embed_atom(session, atom)

        return EmbedResponse(
            id=atom_id,
            embedding_length=len(updated_atom.embedding) if updated_atom.embedding else 0,
            status="completed",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Embedding generation failed: {str(e)}"
        )


@router.post("/topics/{topic_id}", response_model=EmbedResponse)
async def generate_topic_embedding(
    topic_id: UUID, request: EmbedRequest, session: AsyncSession = Depends(get_session)
) -> EmbedResponse:
    """Generate embedding for a single topic.

    Uses specified LLM provider to generate vector embedding for topic content
    (combination of name and description). If topic already has embedding, operation is skipped.

    Args:
        topic_id: ID of topic to embed
        request: Request containing provider_id
        session: Database session (injected)

    Returns:
        EmbedResponse with embedding status and length

    Raises:
        404: Topic or Provider not found
        400: Provider doesn't support embeddings
        500: Embedding generation failed

    Example:
        ```
        POST / api / v1 / embeddings / topics / 550e8400-e29b-41d4-a716-446655440000
        {"provider_id": "550e8400-e29b-41d4-a716-446655440000"}
        ```
    """
    topic = await session.get(Topic, topic_id)
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Topic {topic_id} not found")

    provider = await session.get(LLMProvider, request.provider_id)
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Provider {request.provider_id} not found")

    try:
        has_embedding = isinstance(topic.embedding, list) and len(topic.embedding) > 0
    except Exception:
        has_embedding = False

    if has_embedding:
        return EmbedResponse(id=topic_id, embedding_length=len(topic.embedding), status="skipped")

    try:
        service = EmbeddingService(provider)
        updated_topic = await service.embed_topic(session, topic)

        return EmbedResponse(
            id=topic_id,
            embedding_length=len(updated_topic.embedding) if updated_topic.embedding else 0,
            status="completed",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Embedding generation failed: {str(e)}"
        )
