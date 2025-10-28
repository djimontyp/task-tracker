"""Semantic search service for vector-based similarity search using pgvector.

This service provides semantic search capabilities for messages and atoms using
cosine similarity on vector embeddings. Supports finding similar items, duplicates,
and general text-based search queries.
"""

import logging
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.ai_config import ai_config
from app.models.atom import Atom
from app.models.message import Message
from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class SemanticSearchService:
    """Service for vector-based semantic search using pgvector cosine similarity.

    Uses the <=> cosine distance operator from pgvector. Cosine distance ranges from
    0 (identical vectors) to 2 (opposite vectors). We convert this to a similarity
    score using: similarity = 1 - (distance / 2), which maps to 0.0-1.0 range.
    """

    def __init__(self, embedding_service: EmbeddingService | None = None):
        """Initialize semantic search service.

        Args:
            embedding_service: Optional embedding service for query vectorization.
                Required for text-based search methods, optional for similarity
                methods that use existing embeddings.
        """
        self.embedding_service = embedding_service

    async def search_messages(
        self,
        session: AsyncSession,
        query: str,
        limit: int = 10,
        threshold: float | None = None,
    ) -> list[tuple[Message, float]]:
        """Search messages by semantic similarity to query text.

        Args:
            session: Database session
            query: Search query text
            limit: Maximum number of results to return
            threshold: Minimum similarity score (default: from config)

        Returns:
            List of (message, similarity_score) tuples, ordered by similarity

        Raises:
            ValueError: If embedding_service is not configured or query is empty
            Exception: If embedding generation or search fails

        Example:
            >>> service = SemanticSearchService(embedding_service)
            >>> results = await service.search_messages(session, "bug in production", limit=5)
            >>> for msg, score in results:
            ...     print(f"{score:.3f}: {msg.content[:50]}")
        """
        if threshold is None:
            threshold = ai_config.vector_search.semantic_search_threshold

        if not self.embedding_service:
            raise ValueError("EmbeddingService is required for text-based search")

        if not query or not query.strip():
            raise ValueError("Search query cannot be empty")

        query_embedding = await self.embedding_service.generate_embedding(query)
        query_vector = str(query_embedding)

        sql = text("""
            SELECT
                m.*,
                1 - (m.embedding <=> :query_vector::vector) / 2 AS similarity
            FROM messages m
            WHERE
                m.embedding IS NOT NULL
                AND (1 - (m.embedding <=> :query_vector::vector) / 2) >= :threshold
            ORDER BY m.embedding <=> :query_vector::vector
            LIMIT :limit
        """)

        result = await session.execute(
            sql,
            {
                "query_vector": query_vector,
                "threshold": threshold,
                "limit": limit,
            },
        )

        rows = result.fetchall()

        messages_with_scores: list[tuple[Message, float]] = []
        for row in rows:
            message_dict: dict[str, Any] = dict(row._mapping)
            similarity = message_dict.pop("similarity")

            message = Message(**message_dict)
            messages_with_scores.append((message, float(similarity)))

        logger.info(f"Found {len(messages_with_scores)} messages for query '{query[:50]}...' (threshold={threshold})")

        return messages_with_scores

    async def find_similar_messages(
        self,
        session: AsyncSession,
        message_id: int,
        limit: int = 10,
        threshold: float | None = None,
    ) -> list[tuple[Message, float]]:
        """Find messages similar to a given message using its embedding.

        Args:
            session: Database session
            message_id: ID of the source message
            limit: Maximum number of results to return
            threshold: Minimum similarity score (default: from config)

        Returns:
            List of (message, similarity_score) tuples, ordered by similarity

        Raises:
            ValueError: If source message doesn't exist or has no embedding
            Exception: If search fails

        Example:
            >>> results = await service.find_similar_messages(session, message_id=123, limit=5)
            >>> print(f"Found {len(results)} similar messages")
        """
        if threshold is None:
            threshold = ai_config.vector_search.semantic_search_threshold

        source_message = await session.get(Message, message_id)
        if not source_message:
            raise ValueError(f"Message {message_id} not found")

        if not source_message.embedding:
            raise ValueError(f"Message {message_id} has no embedding")

        query_vector = str(source_message.embedding)

        sql = text("""
            SELECT
                m.*,
                1 - (m.embedding <=> :query_vector::vector) / 2 AS similarity
            FROM messages m
            WHERE
                m.embedding IS NOT NULL
                AND m.id != :exclude_id
                AND (1 - (m.embedding <=> :query_vector::vector) / 2) >= :threshold
            ORDER BY m.embedding <=> :query_vector::vector
            LIMIT :limit
        """)

        result = await session.execute(
            sql,
            {
                "query_vector": query_vector,
                "exclude_id": message_id,
                "threshold": threshold,
                "limit": limit,
            },
        )

        rows = result.fetchall()

        messages_with_scores: list[tuple[Message, float]] = []
        for row in rows:
            message_dict: dict[str, Any] = dict(row._mapping)
            similarity = message_dict.pop("similarity")

            message = Message(**message_dict)
            messages_with_scores.append((message, float(similarity)))

        logger.info(
            f"Found {len(messages_with_scores)} similar messages for message_id={message_id} (threshold={threshold})"
        )

        return messages_with_scores

    async def find_duplicates(
        self,
        session: AsyncSession,
        message_id: int,
        threshold: float | None = None,
    ) -> list[tuple[Message, float]]:
        """Find potential duplicate messages with very high similarity.

        Uses a high similarity threshold to detect near-duplicate content.
        Useful for deduplication and spam detection.

        Args:
            session: Database session
            message_id: ID of the message to find duplicates for
            threshold: High similarity threshold (default: from config)

        Returns:
            List of (message, similarity_score) tuples, ordered by similarity

        Raises:
            ValueError: If source message doesn't exist or has no embedding
            Exception: If search fails

        Example:
            >>> duplicates = await service.find_duplicates(session, message_id=123)
            >>> if duplicates:
            ...     print(f"Warning: Found {len(duplicates)} potential duplicates")
        """
        if threshold is None:
            threshold = ai_config.vector_search.duplicate_detection_threshold

        return await self.find_similar_messages(
            session,
            message_id,
            limit=5,
            threshold=threshold,
        )

    async def search_atoms(
        self,
        session: AsyncSession,
        query: str,
        limit: int = 10,
        threshold: float | None = None,
    ) -> list[tuple[Atom, float]]:
        """Search atoms by semantic similarity to query text.

        Args:
            session: Database session
            query: Search query text
            limit: Maximum number of results to return
            threshold: Minimum similarity score (default: from config)

        Returns:
            List of (atom, similarity_score) tuples, ordered by similarity

        Raises:
            ValueError: If embedding_service is not configured or query is empty
            Exception: If embedding generation or search fails

        Example:
            >>> service = SemanticSearchService(embedding_service)
            >>> results = await service.search_atoms(session, "dependency injection", limit=5)
            >>> for atom, score in results:
            ...     print(f"{score:.3f}: {atom.title}")
        """
        if threshold is None:
            threshold = ai_config.vector_search.semantic_search_threshold

        if not self.embedding_service:
            raise ValueError("EmbeddingService is required for text-based search")

        if not query or not query.strip():
            raise ValueError("Search query cannot be empty")

        query_embedding = await self.embedding_service.generate_embedding(query)
        query_vector = str(query_embedding)

        sql = text("""
            SELECT
                a.*,
                1 - (a.embedding <=> :query_vector::vector) / 2 AS similarity
            FROM atoms a
            WHERE
                a.embedding IS NOT NULL
                AND (1 - (a.embedding <=> :query_vector::vector) / 2) >= :threshold
            ORDER BY a.embedding <=> :query_vector::vector
            LIMIT :limit
        """)

        result = await session.execute(
            sql,
            {
                "query_vector": query_vector,
                "threshold": threshold,
                "limit": limit,
            },
        )

        rows = result.fetchall()

        atoms_with_scores: list[tuple[Atom, float]] = []
        for row in rows:
            atom_dict: dict[str, Any] = dict(row._mapping)
            similarity = atom_dict.pop("similarity")

            atom = Atom(**atom_dict)
            atoms_with_scores.append((atom, float(similarity)))

        logger.info(f"Found {len(atoms_with_scores)} atoms for query '{query[:50]}...' (threshold={threshold})")

        return atoms_with_scores

    async def find_similar_atoms(
        self,
        session: AsyncSession,
        atom_id: int,
        limit: int = 10,
        threshold: float | None = None,
    ) -> list[tuple[Atom, float]]:
        """Find atoms similar to a given atom using its embedding.

        Args:
            session: Database session
            atom_id: ID of the source atom
            limit: Maximum number of results to return
            threshold: Minimum similarity score (default: from config)

        Returns:
            List of (atom, similarity_score) tuples, ordered by similarity

        Raises:
            ValueError: If source atom doesn't exist or has no embedding
            Exception: If search fails

        Example:
            >>> results = await service.find_similar_atoms(session, atom_id=42, limit=5)
            >>> print(f"Found {len(results)} similar atoms")
        """
        if threshold is None:
            threshold = ai_config.vector_search.semantic_search_threshold

        source_atom = await session.get(Atom, atom_id)
        if not source_atom:
            raise ValueError(f"Atom {atom_id} not found")

        if not source_atom.embedding:
            raise ValueError(f"Atom {atom_id} has no embedding")

        query_vector = str(source_atom.embedding)

        sql = text("""
            SELECT
                a.*,
                1 - (a.embedding <=> :query_vector::vector) / 2 AS similarity
            FROM atoms a
            WHERE
                a.embedding IS NOT NULL
                AND a.id != :exclude_id
                AND (1 - (a.embedding <=> :query_vector::vector) / 2) >= :threshold
            ORDER BY a.embedding <=> :query_vector::vector
            LIMIT :limit
        """)

        result = await session.execute(
            sql,
            {
                "query_vector": query_vector,
                "exclude_id": atom_id,
                "threshold": threshold,
                "limit": limit,
            },
        )

        rows = result.fetchall()

        atoms_with_scores: list[tuple[Atom, float]] = []
        for row in rows:
            atom_dict: dict[str, Any] = dict(row._mapping)
            similarity = atom_dict.pop("similarity")

            atom = Atom(**atom_dict)
            atoms_with_scores.append((atom, float(similarity)))

        logger.info(f"Found {len(atoms_with_scores)} similar atoms for atom_id={atom_id} (threshold={threshold})")

        return atoms_with_scores
