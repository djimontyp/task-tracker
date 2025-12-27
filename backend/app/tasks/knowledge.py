import uuid
from datetime import datetime, timedelta
from typing import Any
from uuid import UUID

from core.taskiq_config import nats_broker
from loguru import logger
from sqlalchemy import func, select

from app.config.ai_config import ai_config
from app.database import AsyncSessionLocal, get_db_session_context
from app.models import AgentConfig, LLMProvider, Message
from app.services.embedding_service import EmbeddingService
from app.services.knowledge.knowledge_orchestrator import KnowledgeOrchestrator as KnowledgeExtractionService
from app.services.websocket_manager import websocket_manager


@nats_broker.task
async def embed_messages_batch_task(message_ids: list[uuid.UUID], provider_id: str) -> dict[str, int]:
    """Background task for batch embedding messages.

    Processes messages in batches and generates embeddings using specified LLM provider.
    Designed for long-running embedding operations with automatic error handling.

    Args:
        message_ids: List of message IDs to embed
        provider_id: LLMProvider UUID as string

    Returns:
        Statistics dictionary with success/failed/skipped counts

    Example:
        >>> task = await embed_messages_batch_task.kiq([1, 2, 3], str(provider_id))
        >>> result = await task.wait_result()
        >>> print(result.return_value)  # {"success": 3, "failed": 0, "skipped": 0}
    """
    logger.info(f"Starting batch embedding task: {len(message_ids)} messages with provider {provider_id}")

    db_context = get_db_session_context()
    db = await anext(db_context)

    try:
        provider = await db.get(LLMProvider, UUID(provider_id))
        if not provider:
            raise ValueError(f"Provider {provider_id} not found")

        service = EmbeddingService(provider)
        stats = await service.embed_messages_batch(db, message_ids, batch_size=100)

        logger.info(
            f"Batch embedding task completed: {stats['success']} success, "
            f"{stats['failed']} failed, {stats['skipped']} skipped"
        )

        return stats

    except Exception as e:
        logger.error(f"Batch embedding task failed: {e}", exc_info=True)
        raise


@nats_broker.task
async def embed_atoms_batch_task(atom_ids: list[uuid.UUID], provider_id: str) -> dict[str, int]:
    """Background task for batch embedding atoms.

    Processes atoms in batches and generates embeddings using specified LLM provider.
    Designed for long-running embedding operations with automatic error handling.

    Args:
        atom_ids: List of atom IDs to embed
        provider_id: LLMProvider UUID as string

    Returns:
        Statistics dictionary with success/failed/skipped counts

    Example:
        >>> task = await embed_atoms_batch_task.kiq([1, 2, 3], str(provider_id))
        >>> result = await task.wait_result()
        >>> print(result.return_value)  # {"success": 3, "failed": 0, "skipped": 0}
    """
    logger.info(f"Starting batch atom embedding task: {len(atom_ids)} atoms with provider {provider_id}")

    db_context = get_db_session_context()
    db = await anext(db_context)

    try:
        provider = await db.get(LLMProvider, UUID(provider_id))
        if not provider:
            raise ValueError(f"Provider {provider_id} not found")

        service = EmbeddingService(provider)
        stats = await service.embed_atoms_batch(db, atom_ids, batch_size=100)

        logger.info(
            f"Batch atom embedding task completed: {stats['success']} success, "
            f"{stats['failed']} failed, {stats['skipped']} skipped"
        )

        return stats

    except Exception as e:
        logger.error(f"Batch atom embedding task failed: {e}", exc_info=True)
        raise


@nats_broker.task
async def extract_knowledge_from_messages_task(
    message_ids: list[uuid.UUID],
    agent_config_id: str,
    created_by: str | None = None,
    language: str = "uk",
) -> dict[str, int]:
    """Background task for extracting knowledge (topics and atoms) from message batches.

    Analyzes messages using LLM to identify discussion topics and atomic knowledge units
    (problems, solutions, decisions, insights). Automatically creates database entities
    and establishes relationships between atoms and topics.

    Uses language-specific prompts and validates output language with langdetect.
    Retries once with strengthened prompt if language mismatch detected.

    Args:
        message_ids: IDs of messages to analyze (10-50 recommended for best results)
        agent_config_id: AgentConfig UUID as string
        created_by: User ID who triggered extraction (default: "system")
        language: ISO 639-1 language code for AI output (default: "uk" for Ukrainian)

    Returns:
        Statistics dictionary with:
            - topics_created: Number of new topics created
            - atoms_created: Number of new atoms created
            - links_created: Number of atom links created
            - messages_updated: Number of messages assigned to topics

    Example:
        >>> task = await extract_knowledge_from_messages_task.kiq([1, 2, 3], str(agent_config_id))
        >>> result = await task.wait_result()
        >>> print(result.return_value)
        {"topics_created": 2, "atoms_created": 5, "links_created": 3, "messages_updated": 3}
    """
    logger.info(f"Starting knowledge extraction task: {len(message_ids)} messages with agent {agent_config_id}")

    db_context = get_db_session_context()
    db = await anext(db_context)

    try:
        agent_config = await db.get(AgentConfig, UUID(agent_config_id))
        if not agent_config:
            raise ValueError(f"Agent config {agent_config_id} not found")

        provider = await db.get(LLMProvider, agent_config.provider_id)
        if not provider:
            raise ValueError(f"Provider {agent_config.provider_id} not found")

        stmt = select(Message).where(Message.id.in_(message_ids))  # type: ignore[union-attr]
        result = await db.execute(stmt)
        messages = list(result.scalars().all())

        if len(messages) == 0:
            logger.warning("No messages found for extraction")
            return {"topics_created": 0, "atoms_created": 0, "links_created": 0, "messages_updated": 0}

        logger.info(f"Found {len(messages)} messages to process")

        await websocket_manager.broadcast(
            "knowledge",
            {
                "type": "knowledge.extraction_started",
                "data": {
                    "message_count": len(messages),
                    "agent_config_id": agent_config_id,
                    "agent_name": agent_config.name,
                },
            },
        )

        service = KnowledgeExtractionService(
            agent_config=agent_config, provider=provider, language=language
        )

        extraction_output = await service.extract_knowledge(messages)

        logger.info(
            f"LLM extraction completed: {len(extraction_output.topics)} topics, {len(extraction_output.atoms)} atoms"
        )

        topic_map, version_created_topic_ids = await service.save_topics(
            extraction_output.topics, db, created_by=created_by or "system"
        )
        saved_atoms, version_created_atom_ids = await service.save_atoms(
            extraction_output.atoms, topic_map, db, created_by=created_by or "system"
        )
        links_created = await service.link_atoms(extraction_output.atoms, saved_atoms, db)
        messages_updated = await service.update_messages(messages, topic_map, extraction_output.topics, db)

        logger.info(
            f"Knowledge extraction completed: {len(topic_map)} topics processed, "
            f"{len(saved_atoms)} atoms processed, {links_created} links created, "
            f"{messages_updated} messages updated, "
            f"{len(version_created_topic_ids)} topic versions created, "
            f"{len(version_created_atom_ids)} atom versions created"
        )

        if version_created_atom_ids:
            logger.info(f"Queueing embedding generation for {len(version_created_atom_ids)} atoms")
            await embed_atoms_batch_task.kiq(atom_ids=version_created_atom_ids, provider_id=str(provider.id))

        if message_ids:
            logger.info(f"Queueing embedding generation for {len(message_ids)} messages")
            await embed_messages_batch_task.kiq(message_ids=message_ids, provider_id=str(provider.id))

        await websocket_manager.broadcast(
            "knowledge",
            {
                "type": "knowledge.extraction_completed",
                "data": {
                    "message_count": len(messages),
                    "topics_created": len(topic_map),
                    "atoms_created": len(saved_atoms),
                    "links_created": links_created,
                    "messages_updated": messages_updated,
                    "topic_versions_created": len(version_created_topic_ids),
                    "atom_versions_created": len(version_created_atom_ids),
                },
            },
        )

        for topic_name in topic_map:
            topic = topic_map[topic_name]
            if topic.id not in version_created_topic_ids:
                await websocket_manager.broadcast(
                    "knowledge",
                    {
                        "type": "knowledge.topic_created",
                        "data": {
                            "topic_id": topic.id,
                            "topic_name": topic_name,
                        },
                    },
                )

        for topic_id in version_created_topic_ids:
            await websocket_manager.broadcast(
                "knowledge",
                {
                    "type": "knowledge.version_created",
                    "data": {
                        "entity_type": "topic",
                        "entity_id": topic_id,
                        "approved": False,
                    },
                },
            )

        for atom in saved_atoms:
            if atom.id is not None and atom.id not in version_created_atom_ids:
                await websocket_manager.broadcast(
                    "knowledge",
                    {
                        "type": "knowledge.atom_created",
                        "data": {
                            "atom_id": atom.id,
                            "atom_title": atom.title,
                            "atom_type": atom.type,
                        },
                    },
                )

        for atom_id in version_created_atom_ids:
            await websocket_manager.broadcast(
                "knowledge",
                {
                    "type": "knowledge.version_created",
                    "data": {
                        "entity_type": "atom",
                        "entity_id": atom_id,
                        "approved": False,
                    },
                },
            )

        return {
            "topics_created": len(topic_map),
            "atoms_created": len(saved_atoms),
            "links_created": links_created,
            "messages_updated": messages_updated,
        }

    except Exception as e:
        logger.error(f"Knowledge extraction task failed: {e!r}", exc_info=True)

        await websocket_manager.broadcast(
            "knowledge",
            {
                "type": "knowledge.extraction_failed",
                "data": {
                    "error": str(e),
                },
            },
        )

        raise


@nats_broker.task
async def scheduled_knowledge_extraction_task() -> dict[str, Any]:
    """
    Scheduled task for automatic knowledge extraction from unprocessed messages.

    Finds all messages without topic_id in the last 24 hours and triggers
    knowledge extraction using the active knowledge extractor agent.

    This task is designed to be called by the scheduler service on a cron schedule
    (e.g., daily at 9 AM).

    Returns:
        Dictionary with extraction results and statistics
    """
    logger.info("🔄 Scheduled knowledge extraction task started")

    try:
        async with AsyncSessionLocal() as db:
            cutoff_time = datetime.utcnow() - timedelta(hours=ai_config.knowledge_extraction.lookback_hours)

            count_stmt = (
                select(func.count())
                .select_from(Message)
                .where(Message.topic_id.is_(None), Message.sent_at >= cutoff_time)  # type: ignore[union-attr]
            )
            result = await db.execute(count_stmt)
            unprocessed_count = result.scalar() or 0

            if unprocessed_count == 0:
                logger.info("No unprocessed messages found, skipping extraction")
                return {"status": "skipped", "reason": "no_messages", "count": 0}

            agent_config_stmt = (
                select(AgentConfig)
                .where(AgentConfig.is_active == True, AgentConfig.name == "knowledge_extractor")  # noqa: E712
                .limit(1)
            )
            agent_config_result = await db.execute(agent_config_stmt)
            agent_config = agent_config_result.scalar_one_or_none()

            if not agent_config:
                logger.warning("No active agent config 'knowledge_extractor' found")
                return {"status": "error", "reason": "no_agent", "count": 0}

            messages_stmt = (
                select(Message.id)
                .where(Message.topic_id.is_(None), Message.sent_at >= cutoff_time)  # type: ignore[union-attr]
                .order_by(Message.sent_at)
                .limit(100)
            )
            messages_result = await db.execute(messages_stmt)
            message_ids = [row[0] for row in messages_result.all()]

            if len(message_ids) == 0:
                return {"status": "skipped", "reason": "no_messages", "count": 0}

            logger.info(f"🧠 Processing {len(message_ids)} unprocessed messages")

            await extract_knowledge_from_messages_task.kiq(
                message_ids=message_ids,
                agent_config_id=str(agent_config.id),
                created_by="scheduled_task",
            )

            return {
                "status": "success",
                "message_count": len(message_ids),
                "agent_name": agent_config.name,
                "created_by": "scheduled_task",
            }

    except Exception as e:
        logger.error(f"Scheduled knowledge extraction failed: {e}", exc_info=True)
        return {"status": "error", "reason": str(e), "count": 0}


@nats_broker.task
async def scheduled_auto_approval_task() -> dict[str, Any]:
    """
    Scheduled task for applying auto-approval rules to pending versions.

    Currently a placeholder as TopicVersion/AtomVersion models don't yet have
    confidence/similarity scores. This will be implemented when versioning
    system adds LLM confidence scoring.

    This task is designed to be called by the scheduler service on a cron schedule
    (e.g., hourly).

    Returns:
        Dictionary with approval results and statistics
    """
    logger.info("🔄 Scheduled auto-approval task started")

    logger.info("Auto-approval system pending - awaiting versioning confidence scores")

    return {
        "status": "pending",
        "reason": "awaiting_confidence_scores",
        "message": "TopicVersion/AtomVersion models need confidence/similarity fields",
    }


