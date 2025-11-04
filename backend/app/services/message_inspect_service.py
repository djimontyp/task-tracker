"""Message inspection service for MessageInspectModal."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel

from app.models import (
    Atom,
    ClassificationFeedback,
    Message,
    MessageHistory,
    Topic,
    TopicAtom,
)


class ReasoningBreakdown(SQLModel):
    """Structured breakdown of classification reasoning."""

    whyTopic: str
    whyNotNoise: str
    keyIndicators: list[str]


class ClassificationDetail(SQLModel):
    """Classification details for a message."""

    confidence: float
    reasoning: str
    topic_id: str | None
    topic_title: str | None
    noise_score: float
    urgency_score: float
    reasoning_breakdown: ReasoningBreakdown | None = None


class KeywordDetail(SQLModel):
    """Keyword with relevance score."""

    text: str
    relevance: float


class EntitiesDetail(SQLModel):
    """Extracted entities grouped by type."""

    people: list[str] = []
    places: list[str] = []
    organizations: list[str] = []
    concepts: list[str] = []


class SimilarMessage(SQLModel):
    """Similar message with preview and similarity score."""

    id: str
    preview: str
    similarity: float


class AtomsDetail(SQLModel):
    """Atoms extracted from message."""

    entities: EntitiesDetail
    keywords: list[KeywordDetail]
    embedding: list[float] | None = None
    similarMessages: list[SimilarMessage] | None = None


class MessageDetail(SQLModel):
    """Message metadata for inspect modal."""

    id: str
    content: str
    source: Literal["telegram", "manual"]
    created_at: datetime
    telegram_message_id: int | None = None


class HistoryEvent(SQLModel):
    """Classification history event."""

    timestamp: datetime
    action: Literal["classified", "reassigned", "approved", "rejected"]
    from_topic: str | None = None
    to_topic: str | None = None
    admin_user: str | None = None
    reason: str | None = None


class MessageInspectResponse(SQLModel):
    """Full inspection response for MessageInspectModal."""

    message: MessageDetail
    classification: ClassificationDetail
    atoms: AtomsDetail
    history: list[HistoryEvent]


class MessageInspectService:
    """Service for message inspection operations."""

    def __init__(self, session: AsyncSession):
        """Initialize service.

        Args:
            session: Async database session
        """
        self.session = session

    async def get_message_detail(self, message: Message) -> MessageDetail:
        """Format message details.

        Args:
            message: Message model instance

        Returns:
            MessageDetail with formatted fields
        """
        return MessageDetail(
            id=str(message.id),
            content=message.content,
            source="telegram" if message.telegram_profile_id else "manual",
            created_at=message.created_at or datetime.utcnow(),
            telegram_message_id=None,
        )

    async def get_classification_detail(self, message: Message) -> ClassificationDetail:
        """Get classification details from message.

        Args:
            message: Message model instance

        Returns:
            ClassificationDetail with confidence, reasoning, and topic
        """
        topic_title = None
        topic_id_str = None
        if message.topic_id:
            topic = await self.session.get(Topic, message.topic_id)
            if topic:
                topic_title = topic.name
                topic_id_str = str(topic.id)

        reasoning = message.classification or "No reasoning available"
        noise_score = message.importance_score or 0.0
        noise_score = (1.0 - noise_score) * 100.0

        return ClassificationDetail(
            confidence=(message.confidence or 0.0) * 100.0,
            reasoning=reasoning,
            topic_id=topic_id_str,
            topic_title=topic_title,
            noise_score=noise_score,
            urgency_score=50.0,
            reasoning_breakdown=None,
        )

    async def get_atoms_detail(self, message_id: uuid.UUID) -> AtomsDetail:
        """Get atoms extracted from message.

        Args:
            message_id: Message UUID

        Returns:
            AtomsDetail with entities, keywords, embeddings
        """
        query = (
            select(Atom)
            .join(TopicAtom, TopicAtom.atom_id == Atom.id)  # type: ignore[arg-type]
            .join(Message, Message.topic_id == TopicAtom.topic_id)  # type: ignore[arg-type]
            .where(Message.id == message_id)  # type: ignore[arg-type]
            .limit(50)
        )

        result = await self.session.execute(query)
        atoms = result.scalars().all()

        entities = EntitiesDetail(
            people=[],
            places=[],
            organizations=[],
            concepts=[a.title for a in atoms if a.type == "insight"],
        )

        keywords = [
            KeywordDetail(text=atom.title, relevance=50.0)
            for atom in atoms
            if atom.type in ["problem", "solution", "decision"]
        ][:10]

        return AtomsDetail(
            entities=entities,
            keywords=keywords,
            embedding=None,
            similarMessages=None,
        )

    async def get_message_history(self, message_id: uuid.UUID) -> list[HistoryEvent]:
        """Get classification history for message.

        Args:
            message_id: Message UUID

        Returns:
            List of HistoryEvent records ordered by timestamp desc
        """
        query = (
            select(MessageHistory)
            .where(MessageHistory.message_id == message_id)  # type: ignore[arg-type]
            .order_by(desc(MessageHistory.created_at))  # type: ignore[arg-type]
        )

        result = await self.session.execute(query)
        history_records = result.scalars().all()

        events: list[HistoryEvent] = []
        for record in history_records:
            action: Literal["classified", "reassigned", "approved", "rejected"]
            if record.action in ["classified", "reassigned", "approved", "rejected"]:
                action = record.action  # type: ignore[assignment]
            else:
                action = "classified"

            events.append(
                HistoryEvent(
                    timestamp=record.created_at or datetime.utcnow(),
                    action=action,
                    from_topic=str(record.from_topic_id) if record.from_topic_id else None,
                    to_topic=str(record.to_topic_id) if record.to_topic_id else None,
                    admin_user=record.admin_user,
                    reason=record.reason,
                )
            )

        return events

    async def create_history_event(
        self,
        message_id: uuid.UUID,
        action: str,
        from_topic: uuid.UUID | None = None,
        to_topic: uuid.UUID | None = None,
        reason: str | None = None,
    ) -> None:
        """Create a history event for a message.

        Args:
            message_id: Message UUID
            action: Action type (classified, reassigned, approved, rejected)
            from_topic: Previous topic UUID (for reassignment)
            to_topic: New topic UUID (for reassignment)
            reason: Optional reason for action
        """
        history = MessageHistory(
            message_id=message_id,
            action=action,
            from_topic_id=from_topic,
            to_topic_id=to_topic,
            admin_user="system",
            reason=reason,
        )
        self.session.add(history)
        await self.session.flush()

    async def store_classification_feedback(
        self,
        message_id: uuid.UUID,
        is_correct: bool,
        reason: str | None = None,
        comment: str | None = None,
        confidence: float | None = None,
        topic_id: uuid.UUID | None = None,
    ) -> None:
        """Store classification feedback for ML retraining.

        Args:
            message_id: Message UUID
            is_correct: True if classification approved, False if rejected
            reason: Rejection reason (if applicable)
            comment: Additional feedback comment
            confidence: Classification confidence at feedback time
            topic_id: Topic assignment at feedback time
        """
        feedback = ClassificationFeedback(
            message_id=message_id,
            is_correct=is_correct,
            feedback_type="approve" if is_correct else "reject",
            reason=reason,
            comment=comment,
            confidence_at_feedback=confidence,
            topic_at_feedback=topic_id,
        )
        self.session.add(feedback)
        await self.session.flush()
