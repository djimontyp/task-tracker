"""Semantic search API endpoints for vector-based similarity search.

Provides REST API for searching messages and atoms using semantic similarity,
finding similar items, and detecting potential duplicates.
"""

import logging

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.dependencies import DatabaseDep
from app.models.atom import AtomPublic
from app.models.llm_provider import LLMProvider
from app.schemas.messages import MessageResponse
from app.services.embedding_service import EmbeddingService
from app.services.semantic_search_service import SemanticSearchService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/search", tags=["semantic-search"])


class SemanticSearchResult(BaseModel):
    """Base result with similarity score."""

    similarity_score: float = Field(
        ge=0.0,
        le=1.0,
        description="Similarity score (0.0-1.0, higher means more similar)",
    )


class MessageSearchResult(SemanticSearchResult):
    """Message search result with similarity score."""

    message: MessageResponse


class AtomSearchResult(SemanticSearchResult):
    """Atom search result with similarity score."""

    atom: AtomPublic


@router.get(
    "/messages",
    response_model=list[MessageSearchResult],
    summary="Search messages by semantic similarity",
    response_description="List of messages ranked by semantic similarity to query",
)
async def search_messages_semantic(
    db: DatabaseDep,
    query: str = Query(..., min_length=1, description="Search query text"),
    provider_id: int = Query(..., description="LLM provider ID for generating query embeddings"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of results"),
    threshold: float = Query(0.7, ge=0.0, le=1.0, description="Minimum similarity score"),
) -> list[MessageSearchResult]:
    """
    Search messages using semantic similarity to find relevant content.

    Uses vector embeddings to find messages that are semantically similar to the
    query text, even if they don't contain the exact words. Results are ranked
    by similarity score.

    Example:
        GET /api/v1/search/messages?query=bug+in+production&provider_id=1&limit=10&threshold=0.7

    Args:
        query: Natural language search query
        provider_id: ID of LLM provider to use for embedding generation
        limit: Maximum results to return (1-100)
        threshold: Minimum similarity score (0.0-1.0)

    Returns:
        List of messages with similarity scores, ordered by relevance
    """
    provider = await db.get(LLMProvider, provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider {provider_id} not found",
        )

    try:
        embedding_service = EmbeddingService(provider)
        search_service = SemanticSearchService(embedding_service)

        results = await search_service.search_messages(db, query, limit, threshold)

        return [
            MessageSearchResult(
                message=MessageResponse(
                    id=msg.id or 0,
                    external_message_id=msg.external_message_id,
                    content=msg.content,
                    sent_at=msg.sent_at,
                    source_id=msg.source_id,
                    author_id=msg.author_id,
                    avatar_url=msg.avatar_url,
                    telegram_profile_id=msg.telegram_profile_id,
                    topic_id=msg.topic_id,
                    classification=msg.classification,
                    confidence=msg.confidence,
                    analyzed=msg.analyzed,
                    created_at=msg.created_at,
                    updated_at=msg.updated_at,
                ),
                similarity_score=score,
            )
            for msg, score in results
        ]

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Semantic search failed for query '{query}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}",
        )


@router.get(
    "/messages/{message_id}/similar",
    response_model=list[MessageSearchResult],
    summary="Find messages similar to a given message",
    response_description="List of messages semantically similar to the specified message",
)
async def find_similar_messages(
    message_id: int,
    db: DatabaseDep,
    limit: int = Query(10, ge=1, le=100, description="Maximum number of results"),
    threshold: float = Query(0.7, ge=0.0, le=1.0, description="Minimum similarity score"),
) -> list[MessageSearchResult]:
    """
    Find messages similar to a specific message using its embedding.

    Uses the message's existing vector embedding to find other semantically
    similar messages. Useful for exploring related content or finding
    conversations on similar topics.

    Example:
        GET /api/v1/search/messages/123/similar?limit=5&threshold=0.8

    Args:
        message_id: ID of the reference message
        limit: Maximum results to return (1-100)
        threshold: Minimum similarity score (0.0-1.0)

    Returns:
        List of similar messages with similarity scores, ordered by relevance
    """
    try:
        search_service = SemanticSearchService()
        results = await search_service.find_similar_messages(db, message_id, limit, threshold)

        return [
            MessageSearchResult(
                message=MessageResponse(
                    id=msg.id or 0,
                    external_message_id=msg.external_message_id,
                    content=msg.content,
                    sent_at=msg.sent_at,
                    source_id=msg.source_id,
                    author_id=msg.author_id,
                    avatar_url=msg.avatar_url,
                    telegram_profile_id=msg.telegram_profile_id,
                    topic_id=msg.topic_id,
                    classification=msg.classification,
                    confidence=msg.confidence,
                    analyzed=msg.analyzed,
                    created_at=msg.created_at,
                    updated_at=msg.updated_at,
                ),
                similarity_score=score,
            )
            for msg, score in results
        ]

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Finding similar messages for {message_id} failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}",
        )


@router.get(
    "/messages/{message_id}/duplicates",
    response_model=list[MessageSearchResult],
    summary="Find potential duplicate messages",
    response_description="List of messages with very high similarity (potential duplicates)",
)
async def find_duplicate_messages(
    message_id: int,
    db: DatabaseDep,
    threshold: float = Query(0.95, ge=0.0, le=1.0, description="High similarity threshold for duplicates"),
) -> list[MessageSearchResult]:
    """
    Find potential duplicate messages with very high similarity.

    Uses a high similarity threshold (default 0.95) to detect near-duplicate
    content. Useful for deduplication, spam detection, or finding repeated messages.

    Example:
        GET /api/v1/search/messages/123/duplicates?threshold=0.95

    Args:
        message_id: ID of the reference message
        threshold: High similarity threshold (0.0-1.0, default 0.95)

    Returns:
        List of potential duplicate messages with similarity scores
    """
    try:
        search_service = SemanticSearchService()
        results = await search_service.find_duplicates(db, message_id, threshold)

        return [
            MessageSearchResult(
                message=MessageResponse(
                    id=msg.id or 0,
                    external_message_id=msg.external_message_id,
                    content=msg.content,
                    sent_at=msg.sent_at,
                    source_id=msg.source_id,
                    author_id=msg.author_id,
                    avatar_url=msg.avatar_url,
                    telegram_profile_id=msg.telegram_profile_id,
                    topic_id=msg.topic_id,
                    classification=msg.classification,
                    confidence=msg.confidence,
                    analyzed=msg.analyzed,
                    created_at=msg.created_at,
                    updated_at=msg.updated_at,
                ),
                similarity_score=score,
            )
            for msg, score in results
        ]

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Finding duplicates for {message_id} failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}",
        )


@router.get(
    "/atoms",
    response_model=list[AtomSearchResult],
    summary="Search atoms by semantic similarity",
    response_description="List of atoms ranked by semantic similarity to query",
)
async def search_atoms_semantic(
    db: DatabaseDep,
    query: str = Query(..., min_length=1, description="Search query text"),
    provider_id: int = Query(..., description="LLM provider ID for generating query embeddings"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of results"),
    threshold: float = Query(0.7, ge=0.0, le=1.0, description="Minimum similarity score"),
) -> list[AtomSearchResult]:
    """
    Search atoms using semantic similarity to find relevant knowledge units.

    Uses vector embeddings to find atoms (atomic knowledge units) that are
    semantically similar to the query. Searches across both atom titles and
    content. Results are ranked by similarity score.

    Example:
        GET /api/v1/search/atoms?query=dependency+injection&provider_id=1&limit=10&threshold=0.7

    Args:
        query: Natural language search query
        provider_id: ID of LLM provider to use for embedding generation
        limit: Maximum results to return (1-100)
        threshold: Minimum similarity score (0.0-1.0)

    Returns:
        List of atoms with similarity scores, ordered by relevance
    """
    provider = await db.get(LLMProvider, provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider {provider_id} not found",
        )

    try:
        embedding_service = EmbeddingService(provider)
        search_service = SemanticSearchService(embedding_service)

        results = await search_service.search_atoms(db, query, limit, threshold)

        return [
            AtomSearchResult(
                atom=AtomPublic(
                    id=atom.id or 0,
                    type=atom.type,
                    title=atom.title,
                    content=atom.content,
                    confidence=atom.confidence,
                    user_approved=atom.user_approved,
                    meta=atom.meta,
                    created_at=atom.created_at.isoformat() if atom.created_at else "",
                    updated_at=atom.updated_at.isoformat() if atom.updated_at else "",
                ),
                similarity_score=score,
            )
            for atom, score in results
        ]

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Semantic search failed for query '{query}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}",
        )


@router.get(
    "/atoms/{atom_id}/similar",
    response_model=list[AtomSearchResult],
    summary="Find atoms similar to a given atom",
    response_description="List of atoms semantically similar to the specified atom",
)
async def find_similar_atoms(
    atom_id: int,
    db: DatabaseDep,
    limit: int = Query(10, ge=1, le=100, description="Maximum number of results"),
    threshold: float = Query(0.7, ge=0.0, le=1.0, description="Minimum similarity score"),
) -> list[AtomSearchResult]:
    """
    Find atoms similar to a specific atom using its embedding.

    Uses the atom's existing vector embedding to find other semantically
    similar knowledge units. Useful for exploring related concepts or
    discovering connections in the knowledge graph.

    Example:
        GET /api/v1/search/atoms/42/similar?limit=5&threshold=0.8

    Args:
        atom_id: ID of the reference atom
        limit: Maximum results to return (1-100)
        threshold: Minimum similarity score (0.0-1.0)

    Returns:
        List of similar atoms with similarity scores, ordered by relevance
    """
    try:
        search_service = SemanticSearchService()
        results = await search_service.find_similar_atoms(db, atom_id, limit, threshold)

        return [
            AtomSearchResult(
                atom=AtomPublic(
                    id=atom.id or 0,
                    type=atom.type,
                    title=atom.title,
                    content=atom.content,
                    confidence=atom.confidence,
                    user_approved=atom.user_approved,
                    meta=atom.meta,
                    created_at=atom.created_at.isoformat() if atom.created_at else "",
                    updated_at=atom.updated_at.isoformat() if atom.updated_at else "",
                ),
                similarity_score=score,
            )
            for atom, score in results
        ]

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Finding similar atoms for {atom_id} failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}",
        )
