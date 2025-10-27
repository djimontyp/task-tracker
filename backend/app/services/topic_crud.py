"""CRUD operations for Topic management."""

from datetime import datetime, timedelta

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
from app.models.message import Message


class TopicCRUD:
    """CRUD service for Topic operations."""

    def __init__(self, session: AsyncSession):
        """Initialize CRUD service.

        Args:
            session: Async database session
        """
        self.session = session

    async def get(self, topic_id: int) -> TopicPublic | None:
        """Get topic by ID.

        Args:
            topic_id: Topic ID to retrieve

        Returns:
            Topic or None if not found
        """
        query = select(Topic).where(Topic.id == topic_id)
        result = await self.session.execute(query)
        topic = result.scalar_one_or_none()

        if not topic:
            return None

        color = convert_to_hex_if_needed(topic.color) if topic.color else None

        return TopicPublic(
            id=topic.id,
            name=topic.name,
            description=topic.description,
            icon=topic.icon,
            color=color,
            created_at=topic.created_at.isoformat() if topic.created_at else "",
            updated_at=topic.updated_at.isoformat() if topic.updated_at else "",
        )

    async def list(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        sort_by: str | None = "created_desc",
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

        Returns:
            Tuple of (list of topics, total count)
        """
        base_query = select(Topic)

        if search:
            search_filter = search.strip()
            base_query = base_query.where(
                (Topic.name.ilike(f"%{search_filter}%")) | (Topic.description.ilike(f"%{search_filter}%"))  # type: ignore[attr-defined]
            )

        count_query = select(func.count()).select_from(base_query.subquery())
        count_result = await self.session.execute(count_query)
        total = count_result.scalar_one()

        if sort_by == "name_asc":
            base_query = base_query.order_by(Topic.name)
        elif sort_by == "name_desc":
            base_query = base_query.order_by(desc(Topic.name))
        elif sort_by == "created_asc":
            base_query = base_query.order_by(Topic.created_at)  # type: ignore[arg-type]
        elif sort_by == "updated_desc":
            base_query = base_query.order_by(desc(Topic.updated_at))  # type: ignore[arg-type]
        else:
            base_query = base_query.order_by(desc(Topic.created_at))  # type: ignore[arg-type]

        query = base_query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        topics = result.scalars().all()

        public_topics = []
        for topic in topics:
            color = convert_to_hex_if_needed(topic.color) if topic.color else None
            public_topics.append(
                TopicPublic(
                    id=topic.id,
                    name=topic.name,
                    description=topic.description,
                    icon=topic.icon,
                    color=color,
                    created_at=topic.created_at.isoformat() if topic.created_at else "",
                    updated_at=topic.updated_at.isoformat() if topic.updated_at else "",
                )
            )

        return public_topics, total

    async def create(self, topic_data: TopicCreate) -> TopicPublic:
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

        topic = Topic(
            name=topic_data.name,
            description=topic_data.description,
            icon=topic_data.icon,
            color=color,
        )

        self.session.add(topic)
        await self.session.commit()
        await self.session.refresh(topic)

        color = convert_to_hex_if_needed(topic.color) if topic.color else None

        return TopicPublic(
            id=topic.id,
            name=topic.name,
            description=topic.description,
            icon=topic.icon,
            color=color,
            created_at=topic.created_at.isoformat() if topic.created_at else "",
            updated_at=topic.updated_at.isoformat() if topic.updated_at else "",
        )

    async def update(self, topic_id: int, topic_data: TopicUpdate) -> TopicPublic | None:
        """Update an existing topic.

        Args:
            topic_id: Topic ID to update
            topic_data: Topic update data

        Returns:
            Updated topic or None if not found
        """
        query = select(Topic).where(Topic.id == topic_id)
        result = await self.session.execute(query)
        topic = result.scalar_one_or_none()

        if not topic:
            return None

        if topic_data.name is not None:
            topic.name = topic_data.name
        if topic_data.description is not None:
            topic.description = topic_data.description
        if topic_data.icon is not None:
            topic.icon = topic_data.icon
        if topic_data.color is not None:
            topic.color = convert_to_hex_if_needed(topic_data.color) if topic_data.color else None

        await self.session.commit()
        await self.session.refresh(topic)

        color = convert_to_hex_if_needed(topic.color) if topic.color else None

        return TopicPublic(
            id=topic.id,
            name=topic.name,
            description=topic.description,
            icon=topic.icon,
            color=color,
            created_at=topic.created_at.isoformat(),
            updated_at=topic.updated_at.isoformat(),
        )

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
