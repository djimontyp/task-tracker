"""RAG (Retrieval-Augmented Generation) context builder service.

This service builds comprehensive context from historical data using vector search.
Retrieves similar proposals, relevant knowledge base atoms, and related messages
to enhance LLM proposal generation with past patterns and context.
"""

import logging
from typing import TypedDict

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message
from app.services.embedding_service import EmbeddingService
from app.services.semantic_search_service import SemanticSearchService

logger = logging.getLogger(__name__)


class RAGContext(TypedDict):
    """Structured RAG context for LLM prompts.

    Contains retrieved historical data organized into categories:
    - similar_proposals: Past proposals with similar content
    - relevant_atoms: Knowledge base items relevant to current context
    - related_messages: Historical messages with semantic similarity
    - context_summary: Human-readable summary of retrieved context
    """

    similar_proposals: list[dict]
    relevant_atoms: list[dict]
    related_messages: list[dict]
    context_summary: str


class RAGContextBuilder:
    """Service for building RAG context from vector search.

    Uses semantic search to retrieve relevant historical data and format it
    for injection into LLM prompts. Improves proposal quality by providing
    context from past analysis runs, knowledge base, and message history.
    """

    def __init__(
        self,
        embedding_service: EmbeddingService,
        search_service: SemanticSearchService,
    ):
        """Initialize RAG context builder.

        Args:
            embedding_service: Service for generating query embeddings
            search_service: Service for semantic vector search
        """
        self.embedding_service = embedding_service
        self.search_service = search_service

    async def build_context(
        self,
        session: AsyncSession,
        messages: list[Message],
        top_k: int = 5,
    ) -> RAGContext:
        """Build comprehensive RAG context from messages batch.

        Strategy:
        1. Combine message contents into single query text
        2. Generate embedding for combined text
        3. Search for similar proposals (historical patterns)
        4. Search for relevant atoms (knowledge base)
        5. Search for related past messages (context)
        6. Format everything into structured context

        Args:
            session: Database session
            messages: Messages to analyze (current batch)
            top_k: Number of similar items to retrieve for each category

        Returns:
            Structured RAG context with historical data

        Example:
            >>> builder = RAGContextBuilder(embedding_service, search_service)
            >>> context = await builder.build_context(session, messages, top_k=5)
            >>> print(context["context_summary"])
            Retrieved 3 similar proposals, 4 relevant knowledge items, and 5 related messages
        """
        if not messages:
            return RAGContext(
                similar_proposals=[],
                relevant_atoms=[],
                related_messages=[],
                context_summary="No messages provided for context building",
            )

        combined_text = " ".join([msg.content for msg in messages])
        combined_text = combined_text[:1000]

        try:
            query_embedding = await self.embedding_service.generate_embedding(combined_text)
        except Exception as e:
            logger.error(f"Failed to generate embedding for RAG context: {e}")
            return RAGContext(
                similar_proposals=[],
                relevant_atoms=[],
                related_messages=[],
                context_summary=f"Failed to generate embedding: {str(e)}",
            )

        similar_proposals = await self.find_similar_proposals(session, query_embedding, top_k)
        relevant_atoms = await self.find_relevant_atoms(session, query_embedding, top_k)

        current_ids = [msg.id for msg in messages if msg.id is not None]
        related_messages = await self._find_related_messages(session, query_embedding, current_ids, top_k)

        summary = self._create_summary(len(similar_proposals), len(relevant_atoms), len(related_messages))

        logger.info(
            f"Built RAG context: {len(similar_proposals)} proposals, "
            f"{len(relevant_atoms)} atoms, {len(related_messages)} messages"
        )

        return RAGContext(
            similar_proposals=similar_proposals,
            relevant_atoms=relevant_atoms,
            related_messages=related_messages,
            context_summary=summary,
        )

    async def find_similar_proposals(
        self,
        session: AsyncSession,
        query_embedding: list[float],
        top_k: int = 5,
    ) -> list[dict]:
        """Find similar past proposals using vector search.

        Since TaskProposal doesn't have direct embeddings, we search messages
        that are associated with approved proposals to find similar patterns.

        Args:
            session: Database session
            query_embedding: Query vector for similarity search
            top_k: Number of similar proposals to retrieve

        Returns:
            List of proposal dictionaries with similarity scores

        Example:
            >>> proposals = await builder.find_similar_proposals(session, embedding, 5)
            >>> for prop in proposals:
            ...     print(f"{prop['title']}: {prop['similarity']:.3f}")
        """
        try:
            query_vector = str(query_embedding)

            sql = text("""
                SELECT DISTINCT
                    tp.id,
                    tp.proposed_title AS title,
                    tp.proposed_description AS description,
                    tp.confidence,
                    1 - (m.embedding <=> :query_vector::vector) / 2 AS similarity
                FROM task_proposals tp
                JOIN messages m ON m.id = ANY(tp.source_message_ids)
                WHERE
                    m.embedding IS NOT NULL
                    AND tp.status = 'approved'
                ORDER BY m.embedding <=> :query_vector::vector
                LIMIT :limit
            """)

            result = await session.execute(
                sql,
                {"query_vector": query_vector, "limit": top_k},
            )

            rows = result.fetchall()

            proposals = [
                {
                    "id": str(row.id),
                    "title": row.title,
                    "description": row.description[:200] if row.description else "",
                    "confidence": float(row.confidence) if row.confidence else None,
                    "similarity": float(row.similarity),
                }
                for row in rows
            ]

            logger.debug(f"Found {len(proposals)} similar proposals")
            return proposals

        except Exception as e:
            logger.error(f"Failed to find similar proposals: {e}")
            return []

    async def find_relevant_atoms(
        self,
        session: AsyncSession,
        query_embedding: list[float],
        top_k: int = 5,
    ) -> list[dict]:
        """Find relevant atoms from knowledge base using vector search.

        Searches for approved atoms with semantic similarity to the query.

        Args:
            session: Database session
            query_embedding: Query vector for similarity search
            top_k: Number of relevant atoms to retrieve

        Returns:
            List of atom dictionaries with similarity scores

        Example:
            >>> atoms = await builder.find_relevant_atoms(session, embedding, 5)
            >>> for atom in atoms:
            ...     print(f"[{atom['type']}] {atom['title']}: {atom['similarity']:.3f}")
        """
        try:
            query_vector = str(query_embedding)

            sql = text("""
                SELECT
                    a.id,
                    a.type,
                    a.title,
                    a.content,
                    a.confidence,
                    1 - (a.embedding <=> :query_vector::vector) / 2 AS similarity
                FROM atoms a
                WHERE
                    a.embedding IS NOT NULL
                    AND a.user_approved = true
                ORDER BY a.embedding <=> :query_vector::vector
                LIMIT :limit
            """)

            result = await session.execute(
                sql,
                {"query_vector": query_vector, "limit": top_k},
            )

            rows = result.fetchall()

            atoms = [
                {
                    "id": row.id,
                    "type": row.type,
                    "title": row.title,
                    "content": row.content[:200] if row.content else "",
                    "confidence": float(row.confidence) if row.confidence else None,
                    "similarity": float(row.similarity),
                }
                for row in rows
            ]

            logger.debug(f"Found {len(atoms)} relevant atoms")
            return atoms

        except Exception as e:
            logger.error(f"Failed to find relevant atoms: {e}")
            return []

    async def _find_related_messages(
        self,
        session: AsyncSession,
        query_embedding: list[float],
        exclude_ids: list[int],
        top_k: int = 5,
    ) -> list[dict]:
        """Find related past messages using vector search.

        Excludes current batch messages from results to avoid circular context.

        Args:
            session: Database session
            query_embedding: Query vector for similarity search
            exclude_ids: Message IDs to exclude (current batch)
            top_k: Number of related messages to retrieve

        Returns:
            List of message dictionaries with similarity scores
        """
        try:
            query_vector = str(query_embedding)

            sql = text("""
                SELECT
                    m.id,
                    m.content,
                    m.sent_at,
                    1 - (m.embedding <=> :query_vector::vector) / 2 AS similarity
                FROM messages m
                WHERE
                    m.embedding IS NOT NULL
                    AND m.id != ALL(:exclude_ids)
                ORDER BY m.embedding <=> :query_vector::vector
                LIMIT :limit
            """)

            result = await session.execute(
                sql,
                {"query_vector": query_vector, "exclude_ids": exclude_ids, "limit": top_k},
            )

            rows = result.fetchall()

            messages = [
                {
                    "id": row.id,
                    "content": row.content[:200] if row.content else "",
                    "sent_at": row.sent_at.isoformat(),
                    "similarity": float(row.similarity),
                }
                for row in rows
            ]

            logger.debug(f"Found {len(messages)} related messages")
            return messages

        except Exception as e:
            logger.error(f"Failed to find related messages: {e}")
            return []

    def format_context(self, context: RAGContext) -> str:
        """Format RAG context as markdown for LLM prompt injection.

        Creates a structured markdown document with sections for proposals,
        atoms, and messages, each with similarity scores for context.

        Args:
            context: Structured RAG context

        Returns:
            Markdown-formatted context string ready for prompt injection

        Example:
            >>> formatted = builder.format_context(context)
            >>> print(formatted)
            ## Relevant Past Context

            ### Similar Past Proposals:
            - **Add authentication** (confidence: 0.95, similarity: 0.87)
            ...
        """
        lines = ["## Relevant Past Context\n"]

        if context["similar_proposals"]:
            lines.append("### Similar Past Proposals:")
            for prop in context["similar_proposals"]:
                confidence_str = f"confidence: {prop['confidence']:.2f}, " if prop.get("confidence") else ""
                lines.append(f"- **{prop['title']}** ({confidence_str}similarity: {prop['similarity']:.2f})")
                if prop.get("description"):
                    lines.append(f"  {prop['description'][:100]}...")
            lines.append("")

        if context["relevant_atoms"]:
            lines.append("### Relevant Knowledge Base Items:")
            for atom in context["relevant_atoms"]:
                lines.append(f"- **[{atom['type']}] {atom['title']}** (similarity: {atom['similarity']:.2f})")
                if atom.get("content"):
                    lines.append(f"  {atom['content'][:100]}...")
            lines.append("")

        if context["related_messages"]:
            lines.append("### Related Past Messages:")
            for msg in context["related_messages"]:
                lines.append(f"- {msg['content'][:80]}... (similarity: {msg['similarity']:.2f})")
            lines.append("")

        lines.append(context["context_summary"])

        return "\n".join(lines)

    def _create_summary(self, proposals_count: int, atoms_count: int, messages_count: int) -> str:
        """Create summary of retrieved context.

        Args:
            proposals_count: Number of proposals retrieved
            atoms_count: Number of atoms retrieved
            messages_count: Number of messages retrieved

        Returns:
            Human-readable summary string
        """
        return (
            f"Retrieved {proposals_count} similar proposals, "
            f"{atoms_count} relevant knowledge items, and "
            f"{messages_count} related messages for context."
        )
