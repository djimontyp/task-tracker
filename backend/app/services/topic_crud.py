"""CRUD operations for Topic management."""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import TYPE_CHECKING, List, Tuple

from fastapi import HTTPException, status
from sqlalchemy import desc
from sqlalchemy import func as sa_func
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import (
    RecentTopicItem,
    RecentTopicsResponse,
    Topic,
    TopicCreate,
    TopicPublic,
    TopicUpdate,
    auto_select_color,
    auto_select_icon,
    convert_to_hex_if_needed,
)
from app.models.atom import TopicAtom
from app.models.llm_provider import LLMProvider
from app.models.message import Message
from app.services.base_crud import BaseCRUD

if TYPE_CHECKING:
    from app.services.embedding_service import EmbeddingService
    from app.services.semantic_search_service import SemanticSearchService

logger = logging.getLogger(__name__)


@dataclass
class FindOrCreateResult:
    """Result of find_or_create operation with merge metadata.

    Attributes:
        topic: The topic (either existing merged or newly created)
        was_merged: True if matched existing topic, False if created new
        similarity_score: Cosine similarity score if merged (0.0-1.0)
        matched_topic_name: Name of the matched topic if merged
    """

    topic: TopicPublic
    was_merged: bool
    similarity_score: float | None = None
    matched_topic_name: str | None = None


class TopicCRUD(BaseCRUD[Topic]):
    """CRUD service for Topic operations.

    Inherits standard CRUD operations from BaseCRUD and adds
    topic-specific business logic for color conversion and activity tracking.
    """

    def __init__(self, session: AsyncSession):
        """Initialize CRUD service.

        Args:
            session: Async database session
        """
        super().__init__(Topic, session)

    async def get(self, topic_id: uuid.UUID) -> TopicPublic | None:  # type: ignore[override]
        """Get topic by ID with counts.

        Args:
            topic_id: Topic UUID to retrieve

        Returns:
            Topic or None if not found
        """
        # Query with aggregations for atoms_count and message_count
        query = select(  # type: ignore[call-overload]
            Topic.id,
            Topic.name,
            Topic.description,
            Topic.icon,
            Topic.color,
            Topic.is_active,
            Topic.created_at,
            Topic.updated_at,
            sa_func.count(sa_func.distinct(TopicAtom.atom_id)).label("atoms_count"),
            sa_func.count(sa_func.distinct(Message.id)).label("message_count"),
        ).where(Topic.id == topic_id).outerjoin(TopicAtom, TopicAtom.topic_id == Topic.id).outerjoin(Message, Message.topic_id == Topic.id).group_by(Topic.id, Topic.name, Topic.description, Topic.icon, Topic.color, Topic.is_active, Topic.created_at, Topic.updated_at)

        result = await self.session.execute(query)
        row = result.one_or_none()

        if not row:
            return None

        color = convert_to_hex_if_needed(row.color) if row.color else None

        return TopicPublic(
            id=row.id,
            name=row.name,
            description=row.description,
            icon=row.icon,
            color=color,
            is_active=row.is_active,
            created_at=row.created_at.isoformat() if row.created_at else "",
            updated_at=row.updated_at.isoformat() if row.updated_at else "",
            atoms_count=row.atoms_count,
            message_count=row.message_count,
        )

    async def list(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        sort_by: str | None = "created_desc",
        is_active: bool | None = None,
    ) -> tuple[list[TopicPublic], int]:
        """List topics with pagination, search, and sorting.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            search: Search query to filter by name or description (case-insensitive)
            sort_by: Sort criteria. Options:
                - "name_asc": Sort by name ascending
                - "name_desc": Sort by name descending
                - "created_desc": Sort by created_at descending (default)
                - "created_asc": Sort by created_at ascending
                - "updated_desc": Sort by updated_at descending
            is_active: Filter by active status. None returns all topics.

        Returns:
            Tuple of (list of topics, total count)
        """
        # Count query for total (without joins for performance)
        count_base = select(Topic)
        if is_active is not None:
            count_base = count_base.where(Topic.is_active == is_active)
        if search:
            search_filter = search.strip()
            count_base = count_base.where(
                (Topic.name.ilike(f"%{search_filter}%")) | (Topic.description.ilike(f"%{search_filter}%"))  # type: ignore[attr-defined]
            )
        count_query = select(func.count()).select_from(count_base.subquery())
        count_result = await self.session.execute(count_query)
        total = count_result.scalar_one()

        # Main query with aggregations for atoms_count and message_count
        query = select(  # type: ignore[call-overload]
            Topic.id,
            Topic.name,
            Topic.description,
            Topic.icon,
            Topic.color,
            Topic.is_active,
            Topic.created_at,
            Topic.updated_at,
            sa_func.count(sa_func.distinct(TopicAtom.atom_id)).label("atoms_count"),
            sa_func.count(sa_func.distinct(Message.id)).label("message_count"),
        ).outerjoin(TopicAtom, TopicAtom.topic_id == Topic.id).outerjoin(Message, Message.topic_id == Topic.id)

        if is_active is not None:
            query = query.where(Topic.is_active == is_active)

        if search:
            search_filter = search.strip()
            query = query.where(
                (Topic.name.ilike(f"%{search_filter}%")) | (Topic.description.ilike(f"%{search_filter}%"))  # type: ignore[attr-defined]
            )

        # Group by all topic columns
        query = query.group_by(Topic.id, Topic.name, Topic.description, Topic.icon, Topic.color, Topic.is_active, Topic.created_at, Topic.updated_at)

        # Apply sorting
        if sort_by == "name_asc":
            query = query.order_by(Topic.name)
        elif sort_by == "name_desc":
            query = query.order_by(desc(Topic.name))
        elif sort_by == "created_asc":
            query = query.order_by(Topic.created_at)
        elif sort_by == "updated_desc":
            query = query.order_by(desc(Topic.updated_at))  # type: ignore[arg-type]
        else:
            query = query.order_by(desc(Topic.created_at))  # type: ignore[arg-type]

        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        rows = result.all()

        public_topics = []
        for row in rows:
            color = convert_to_hex_if_needed(row.color) if row.color else None
            public_topics.append(
                TopicPublic(
                    id=row.id,
                    name=row.name,
                    description=row.description,
                    icon=row.icon,
                    color=color,
                    is_active=row.is_active,
                    created_at=row.created_at.isoformat() if row.created_at else "",
                    updated_at=row.updated_at.isoformat() if row.updated_at else "",
                    atoms_count=row.atoms_count,
                    message_count=row.message_count,
                )
            )

        return public_topics, total

    async def create(self, topic_data: TopicCreate) -> TopicPublic:  # type: ignore[override]
        """Create a new topic.

        Args:
            topic_data: Topic creation data

        Returns:
            Created topic
        """
        if not topic_data.icon:
            topic_data.icon = auto_select_icon(topic_data.name, topic_data.description)

        if not topic_data.color and topic_data.icon:
            topic_data.color = auto_select_color(topic_data.icon)

        color = convert_to_hex_if_needed(topic_data.color) if topic_data.color else None

        topic = await super().create({
            "name": topic_data.name,
            "description": topic_data.description,
            "icon": topic_data.icon,
            "color": color,
        })

        color = convert_to_hex_if_needed(topic.color) if topic.color else None

        # New topic has 0 atoms and messages
        return TopicPublic(
            id=topic.id,
            name=topic.name,
            description=topic.description,
            icon=topic.icon,
            color=color,
            is_active=topic.is_active,
            created_at=topic.created_at.isoformat() if topic.created_at else "",
            updated_at=topic.updated_at.isoformat() if topic.updated_at else "",
            atoms_count=0,
            message_count=0,
        )

    async def find_or_create(
        self,
        topic_data: TopicCreate,
        embedding_service: "EmbeddingService",
        search_service: "SemanticSearchService",
        threshold: float = 0.85,
    ) -> FindOrCreateResult:
        """Find existing similar topic or create new one.

        Performs semantic search to find topics similar to the new topic's
        name and description. If a highly similar topic exists (above threshold),
        returns that topic instead of creating a duplicate.

        Args:
            topic_data: Topic creation data (name, description, icon, color)
            embedding_service: Service for generating embeddings
            search_service: Service for semantic similarity search
            threshold: Minimum similarity score to consider as match (default: 0.85)

        Returns:
            FindOrCreateResult with:
                - topic: The existing or newly created TopicPublic
                - was_merged: True if returned existing topic, False if created new
                - similarity_score: Score if merged (None if created new)
                - matched_topic_name: Name of matched topic if merged

        Example:
            >>> from app.services.embedding_service import EmbeddingService
            >>> from app.services.semantic_search_service import SemanticSearchService
            >>>
            >>> embedding_svc = EmbeddingService(provider)
            >>> search_svc = SemanticSearchService(embedding_svc)
            >>> crud = TopicCRUD(session)
            >>>
            >>> result = await crud.find_or_create(
            ...     TopicCreate(name="Mobile Development", description="iOS and Android"),
            ...     embedding_svc,
            ...     search_svc,
            ...     threshold=0.85
            ... )
            >>> if result.was_merged:
            ...     print(f"Merged with '{result.matched_topic_name}' (score: {result.similarity_score:.2f})")
            ... else:
            ...     print(f"Created new topic: {result.topic.name}")
        """
        # Build search text from topic name and description
        search_text = f"{topic_data.name} {topic_data.description or ''}".strip()

        if not search_text:
            # Edge case: empty topic data, just create
            logger.warning("Empty topic data provided, creating topic without similarity check")
            new_topic = await self.create(topic_data)
            return FindOrCreateResult(topic=new_topic, was_merged=False)

        # Search for similar topics
        try:
            similar_topics = await search_service.search_topics(
                self.session,
                search_text,
                limit=3,
                threshold=threshold,
            )
        except ValueError as e:
            # Embedding service not configured or empty query - fall through to create
            logger.warning(f"Semantic search failed: {e}. Creating new topic.")
            similar_topics = []
        except Exception as e:
            # Other errors - log and create new topic
            logger.error(f"Unexpected error during semantic search: {e}")
            similar_topics = []

        # Check if we have a highly similar match
        if similar_topics:
            best_match, best_score = similar_topics[0]

            if best_score >= threshold:
                logger.info(
                    f"Found similar topic '{best_match.name}' (score: {best_score:.3f}) "
                    f"for proposed topic '{topic_data.name}'. Returning existing topic."
                )

                # Fetch full TopicPublic with counts
                existing_topic = await self.get(best_match.id)
                if existing_topic:
                    return FindOrCreateResult(
                        topic=existing_topic,
                        was_merged=True,
                        similarity_score=best_score,
                        matched_topic_name=best_match.name,
                    )

        # No similar topic found - create new one
        logger.info(f"No similar topic found for '{topic_data.name}'. Creating new topic.")
        new_topic = await self.create(topic_data)

        # Generate embedding for the new topic for future similarity searches
        try:
            topic_entity = await super().get(new_topic.id)
            if topic_entity:
                await embedding_service.embed_topic(self.session, topic_entity)
                logger.debug(f"Generated embedding for new topic '{new_topic.name}'")
        except Exception as e:
            # Non-fatal: topic created but embedding failed
            logger.warning(f"Failed to generate embedding for topic '{new_topic.name}': {e}")

        return FindOrCreateResult(topic=new_topic, was_merged=False)

    async def update(self, topic_id: uuid.UUID, topic_data: TopicUpdate) -> TopicPublic | None:  # type: ignore[override]
        """Update an existing topic.

        Args:
            topic_id: Topic UUID to update
            topic_data: Topic update data

        Returns:
            Updated topic or None if not found
        """
        topic = await super().get(topic_id)

        if not topic:
            return None

        update_data = topic_data.model_dump(exclude_unset=True)
        if "color" in update_data and update_data["color"]:
            update_data["color"] = convert_to_hex_if_needed(update_data["color"])

        await super().update(topic, update_data)

        # Fetch updated topic with counts using the get() method
        return await self.get(topic_id)

    async def get_recent_topics(
        self,
        period: str | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        limit: int = 10,
    ) -> RecentTopicsResponse:
        """Get recent topics ordered by last message activity.

        Args:
            period: Predefined time period (today, yesterday, week, month)
            start_date: Custom start date for filtering
            end_date: Custom end date for filtering
            limit: Maximum number of topics to return

        Returns:
            Recent topics with activity metrics

        Raises:
            HTTPException: 400 if both period and custom dates are provided
        """
        if period and (start_date or end_date):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot specify both 'period' and custom date range (start_date/end_date)",
            )

        now = datetime.now()
        filter_start: datetime | None = None
        filter_end: datetime | None = None

        if period:
            if period == "today":
                filter_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
                filter_end = now
            elif period == "yesterday":
                yesterday = now - timedelta(days=1)
                filter_start = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
                filter_end = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == "week":
                filter_start = now - timedelta(days=7)
                filter_end = now
            elif period == "month":
                filter_start = now - timedelta(days=30)
                filter_end = now
        elif start_date or end_date:
            filter_start = start_date
            filter_end = end_date or now

        query = (
            select(  # type: ignore[call-overload]
                Topic.id,
                Topic.name,
                Topic.description,
                Topic.icon,
                Topic.color,
                sa_func.max(Message.sent_at).label("last_message_at"),
                sa_func.count(sa_func.distinct(Message.id)).label("message_count"),
                sa_func.count(sa_func.distinct(TopicAtom.atom_id)).label("atoms_count"),
            )
            .join(Message, Message.topic_id == Topic.id)
            .outerjoin(TopicAtom, TopicAtom.topic_id == Topic.id)
        )

        if filter_start:
            query = query.where(Message.sent_at >= filter_start)
        if filter_end:
            query = query.where(Message.sent_at <= filter_end)

        query = (
            query.group_by(Topic.id, Topic.name, Topic.description, Topic.icon, Topic.color)
            .order_by(desc("last_message_at"))
            .limit(limit)
        )

        result = await self.session.execute(query)
        rows = result.all()

        items = [
            RecentTopicItem(
                id=row.id,
                name=row.name,
                description=row.description,
                icon=row.icon,
                color=convert_to_hex_if_needed(row.color) if row.color else None,
                last_message_at=row.last_message_at.isoformat(),
                message_count=row.message_count,
                atoms_count=row.atoms_count,
            )
            for row in rows
        ]

        return RecentTopicsResponse(items=items, total=len(items))

    async def archive(self, topic_id: uuid.UUID) -> TopicPublic | None:
        """Archive a topic by setting is_active to False.

        Args:
            topic_id: Topic UUID to archive

        Returns:
            Updated topic or None if not found
        """
        topic = await super().get(topic_id)
        if not topic:
            return None

        topic.is_active = False
        await self.session.commit()
        await self.session.refresh(topic)

        return await self.get(topic_id)

    async def restore(self, topic_id: uuid.UUID) -> TopicPublic | None:
        """Restore an archived topic by setting is_active to True.

        Args:
            topic_id: Topic UUID to restore

        Returns:
            Updated topic or None if not found
        """
        topic = await super().get(topic_id)
        if not topic:
            return None

        topic.is_active = True
        await self.session.commit()
        await self.session.refresh(topic)

        return await self.get(topic_id)

    async def auto_link_atom(
        self,
        atom_id: uuid.UUID,
        atom_content: str,
        provider_id: uuid.UUID | None = None,
        threshold: float = 0.80,
        max_topics: int = 5,
    ) -> List[Tuple[uuid.UUID, float]]:
        """Automatically link an atom to semantically similar topics.

        Uses embedding-based semantic search to find topics related to the atom's
        content and creates TopicAtom links with similarity scores.

        Args:
            atom_id: UUID of the atom to link
            atom_content: Text content to use for semantic matching (title + content)
            provider_id: Optional LLM provider UUID for embeddings. If None, uses first available.
            threshold: Minimum similarity score to create link (default: 0.80)
            max_topics: Maximum number of topics to link (default: 5)

        Returns:
            List of tuples (topic_id, similarity_score) for created links

        Raises:
            ValueError: If no embedding provider is available or configured

        Example:
            >>> crud = TopicCRUD(session)
            >>> links = await crud.auto_link_atom(
            ...     atom_id=atom.id,
            ...     atom_content=f"{atom.title}\\n\\n{atom.content}",
            ...     threshold=0.80
            ... )
            >>> print(f"Linked to {len(links)} topics")
        """
        from app.services.embedding_service import EmbeddingService
        from app.services.semantic_search_service import SemanticSearchService

        # Get embedding provider
        if provider_id:
            provider = await self.session.get(LLMProvider, provider_id)
            if not provider:
                raise ValueError(f"Provider {provider_id} not found")
        else:
            # Find first available embedding-capable provider (openai and ollama both support embeddings)
            from sqlalchemy import or_

            from app.models.llm_provider import ProviderType

            query = (
                select(LLMProvider)
                .where(LLMProvider.is_active == True)  # noqa: E712
                .where(
                    or_(
                        LLMProvider.type == ProviderType.openai,  # type: ignore[arg-type]
                        LLMProvider.type == ProviderType.ollama,  # type: ignore[arg-type]
                    )
                )
                .limit(1)
            )
            result = await self.session.execute(query)
            provider = result.scalar_one_or_none()

            if not provider:
                logger.warning(
                    f"No embedding provider available for auto-linking atom {atom_id}. "
                    "Skipping auto-link."
                )
                return []

        # Initialize services
        embedding_service = EmbeddingService(provider)
        search_service = SemanticSearchService(embedding_service)

        # Search for similar topics
        try:
            topic_results = await search_service.search_topics(
                self.session,
                atom_content,
                limit=max_topics,
                threshold=threshold,
            )
        except Exception as e:
            logger.error(f"Semantic search failed for atom {atom_id}: {e}")
            return []

        # Create links for topics above threshold
        linked: list[tuple[uuid.UUID, float]] = []

        for topic, score in topic_results:
            # Check if link already exists
            existing_query = select(TopicAtom).where(
                TopicAtom.topic_id == topic.id,
                TopicAtom.atom_id == atom_id,
            )
            existing_result = await self.session.execute(existing_query)
            existing_link = existing_result.scalar_one_or_none()

            if existing_link:
                logger.debug(f"Link already exists: atom {atom_id} -> topic {topic.id}")
                continue

            # Create new link
            topic_atom = TopicAtom(
                topic_id=topic.id,
                atom_id=atom_id,
                similarity_score=score,
                note="Auto-linked",
            )
            self.session.add(topic_atom)
            linked.append((topic.id, score))

            logger.info(
                f"Auto-linked atom {atom_id} to topic '{topic.name}' "
                f"(score: {score:.3f})"
            )

        if linked:
            await self.session.commit()
            logger.info(
                f"Auto-linked atom {atom_id} to {len(linked)} topics "
                f"(threshold: {threshold})"
            )

        return linked
