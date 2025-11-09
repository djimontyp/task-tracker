"""CRUD operations for Message management."""

from __future__ import annotations

import uuid

from sqlalchemy import desc
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.legacy import Source
from app.models.message import Message
from app.models.user import User
from app.schemas.messages import MessageResponse
from app.services.base_crud import BaseCRUD


class MessageCRUD(BaseCRUD[Message]):
    """CRUD service for Message operations.

    Inherits standard CRUD operations from BaseCRUD and adds
    message-specific query methods for topic filtering.
    """

    def __init__(self, session: AsyncSession):
        """Initialize CRUD service.

        Args:
            session: Async database session
        """
        super().__init__(Message, session)

    async def list_by_topic(
        self,
        topic_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[MessageResponse]:
        """Get all messages belonging to a specific topic.

        Args:
            topic_id: Topic UUID to filter by
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return

        Returns:
            List of messages associated with the topic, ordered by sent_at DESC
        """
        query = (
            select(Message, User, Source)
            .join(User, Message.author_id == User.id)  # type: ignore[arg-type]
            .join(Source, Message.source_id == Source.id)  # type: ignore[arg-type]
            .where(Message.topic_id == topic_id)
            .order_by(desc(Message.sent_at))  # type: ignore[arg-type]
            .offset(skip)
            .limit(limit)
        )

        result = await self.session.execute(query)
        messages_data = result.all()

        return [
            MessageResponse(
                id=msg.id,
                external_message_id=msg.external_message_id,
                content=msg.content,
                sent_at=msg.sent_at,
                source_id=source.id or 0,
                source_name=source.name,
                author_id=user.id or 0,
                author_name=user.full_name,
                avatar_url=msg.avatar_url,
                telegram_profile_id=msg.telegram_profile_id,
                topic_id=msg.topic_id,
                classification=msg.classification,
                confidence=msg.confidence,
                analyzed=msg.analyzed,
                created_at=msg.created_at,
                updated_at=msg.updated_at,
            )
            for msg, user, source in messages_data
        ]
