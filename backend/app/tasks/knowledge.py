import uuid
from datetime import datetime, timedelta, UTC
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    from app.models.scheduled_extraction_task import ScheduledExtractionTask
from uuid import UUID

from core.taskiq_config import nats_broker
from loguru import logger
from sqlalchemy import func, select

from app.config.ai_config import ai_config
from app.database import AsyncSessionLocal, get_db_session_context
from app.models import (
    AgentConfig,
    ExtractionStatus,
    KnowledgeExtractionRun,
    LLMProvider,
    Message,
    ProjectConfig,
)
from app.services.embedding_service import EmbeddingService
from app.services.knowledge.knowledge_orchestrator import KnowledgeOrchestrator as KnowledgeExtractionService
from app.services.rag_context_builder import RAGContextBuilder
from app.services.semantic_search_service import SemanticSearchService
from app.services.websocket_manager import websocket_manager


async def check_cancellation(db: "AsyncSession", run_id: str) -> bool:
    """Check if extraction run has cancellation requested.

    Args:
        db: Database session
        run_id: Extraction run UUID as string

    Returns:
        True if cancellation was requested, False otherwise
    """
    extraction_run = await db.get(KnowledgeExtractionRun, UUID(run_id))
    if extraction_run is None:
        logger.warning(f"Extraction run {run_id} not found during cancellation check")
        return False
    return extraction_run.cancel_requested


async def handle_cancellation(db: "AsyncSession", run_id: str, checkpoint: str) -> dict[str, int]:
    """Handle extraction cancellation - update status and broadcast event.

    Args:
        db: Database session
        run_id: Extraction run UUID as string
        checkpoint: Name of the checkpoint where cancellation occurred

    Returns:
        Empty result dictionary indicating cancelled state
    """
    extraction_run = await db.get(KnowledgeExtractionRun, UUID(run_id))
    if extraction_run:
        extraction_run.status = ExtractionStatus.cancelled
        extraction_run.cancelled_at = datetime.now(UTC)
        db.add(extraction_run)
        await db.commit()

        logger.info(f"Extraction {run_id} cancelled at checkpoint: {checkpoint}")

        await websocket_manager.broadcast(
            "knowledge",
            {
                "type": "knowledge.extraction_cancelled",
                "data": {
                    "extraction_id": run_id,
                    "checkpoint": checkpoint,
                    "topics_created": extraction_run.topics_created,
                    "atoms_created": extraction_run.atoms_created,
                },
            },
        )

    return {"topics_created": 0, "atoms_created": 0, "links_created": 0, "messages_updated": 0, "cancelled": True}


async def update_extraction_run_status(
    db: "AsyncSession",
    run_id: str,
    status: ExtractionStatus,
    **kwargs: Any,
) -> None:
    """Update extraction run status and optional fields.

    Args:
        db: Database session
        run_id: Extraction run UUID as string
        status: New status
        **kwargs: Additional fields to update (topics_created, atoms_created, etc.)
    """
    extraction_run = await db.get(KnowledgeExtractionRun, UUID(run_id))
    if extraction_run:
        extraction_run.status = status
        for key, value in kwargs.items():
            if hasattr(extraction_run, key):
                setattr(extraction_run, key, value)
        db.add(extraction_run)
        await db.commit()


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
    project_config_id: str | None = None,
    extraction_run_id: str | None = None,
    include_context: bool = False,
    context_window: int = 5,
) -> dict[str, int]:
    """Background task for extracting knowledge (topics and atoms) from message batches.

    Analyzes messages using LLM to identify discussion topics and atomic knowledge units
    (problems, solutions, decisions, insights). Automatically creates database entities
    and establishes relationships between atoms and topics.

    Uses language-specific prompts and validates output language with langdetect.
    Retries once with strengthened prompt if language mismatch detected.

    Optionally injects project-specific context (keywords, glossary, components) when
    project_config_id is provided.

    Supports cooperative cancellation via extraction_run_id - checks DB flag at
    3 checkpoints and exits gracefully if cancellation requested.

    Args:
        message_ids: IDs of messages to analyze (10-50 recommended for best results)
        agent_config_id: AgentConfig UUID as string
        created_by: User ID who triggered extraction (default: "system")
        language: ISO 639-1 language code for AI output (default: "uk" for Ukrainian)
        project_config_id: Optional ProjectConfig UUID for domain-specific context
        extraction_run_id: Optional extraction run UUID for cancellation support
        include_context: Whether to include surrounding messages (CAG)
        context_window: Number of messages to fetch before/after targets

    Returns:
        Statistics dictionary with:
            - topics_created: Number of new topics created
            - atoms_created: Number of new atoms created
            - links_created: Number of atom links created
            - messages_updated: Number of messages assigned to topics
            - cancelled: True if extraction was cancelled (optional)

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
        # Update extraction run status to running
        if extraction_run_id:
            await update_extraction_run_status(
                db, extraction_run_id, ExtractionStatus.running, started_at=datetime.now(UTC)
            )

        agent_config = await db.get(AgentConfig, UUID(agent_config_id))
        if not agent_config:
            raise ValueError(f"Agent config {agent_config_id} not found")

        provider = await db.get(LLMProvider, agent_config.provider_id)
        if not provider:
            raise ValueError(f"Provider {agent_config.provider_id} not found")

        # Load project config if provided
        project_config = None
        if project_config_id:
            project_config = await db.get(ProjectConfig, UUID(project_config_id))
            if project_config:
                logger.info(f"Using project context: {project_config.name}")
            else:
                logger.warning(f"ProjectConfig {project_config_id} not found, proceeding without project context")

        # Use intelligent fetch with context
        messages = await KnowledgeExtractionService.fetch_messages_with_context(
            session=db,
            message_ids=message_ids,
            include_context=include_context,
            context_window=context_window
        )

        if len(messages) == 0:
            logger.warning("No messages found for extraction")
            if extraction_run_id:
                await update_extraction_run_status(
                    db, extraction_run_id, ExtractionStatus.completed, completed_at=datetime.now(UTC)
                )
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
                    "extraction_id": extraction_run_id,
                },
            },
        )

        # CHECKPOINT 1: Before LLM call
        if extraction_run_id and await check_cancellation(db, extraction_run_id):
            return await handle_cancellation(db, extraction_run_id, "before_llm")

        # Build RAG context builder for semantic knowledge injection
        embedding_service = EmbeddingService(provider)
        search_service = SemanticSearchService(embedding_service)
        rag_builder = RAGContextBuilder(embedding_service, search_service)

        service = KnowledgeExtractionService(
            agent_config=agent_config,
            provider=provider,
            language=language,
            rag_context_builder=rag_builder,
            project_config=project_config,
        )

        # Pass session for RAG context lookup
        extraction_output = await service.extract_knowledge(messages, session=db)

        logger.info(
            f"LLM extraction completed: {len(extraction_output.topics)} topics, {len(extraction_output.atoms)} atoms"
        )

        # CHECKPOINT 2: After LLM, before save
        if extraction_run_id and await check_cancellation(db, extraction_run_id):
            return await handle_cancellation(db, extraction_run_id, "after_llm")

        topic_map, version_created_topic_ids = await service.save_topics(
            extraction_output.topics, db, created_by=created_by or "system"
        )

        # CHECKPOINT 3: After topics, before atoms
        if extraction_run_id and await check_cancellation(db, extraction_run_id):
            # Update partial progress before cancelling
            await update_extraction_run_status(
                db, extraction_run_id, ExtractionStatus.cancelling, topics_created=len(topic_map)
            )
            return await handle_cancellation(db, extraction_run_id, "after_topics")

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

        # Update extraction run with final stats
        if extraction_run_id:
            await update_extraction_run_status(
                db,
                extraction_run_id,
                ExtractionStatus.completed,
                completed_at=datetime.now(UTC),
                topics_created=len(topic_map),
                atoms_created=len(saved_atoms),
                links_created=links_created,
                messages_processed=len(messages),
            )

        # Embed new atoms (messages are embedded during scoring for RAG)
        if version_created_atom_ids:
            logger.info(f"Queueing embedding generation for {len(version_created_atom_ids)} atoms")
            await embed_atoms_batch_task.kiq(atom_ids=version_created_atom_ids, provider_id=str(provider.id))

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
                    "extraction_id": extraction_run_id,
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

        # Update extraction run with error
        if extraction_run_id:
            await update_extraction_run_status(
                db,
                extraction_run_id,
                ExtractionStatus.failed,
                error=str(e)[:2000],
                completed_at=datetime.now(UTC),
            )

        await websocket_manager.broadcast(
            "knowledge",
            {
                "type": "knowledge.extraction_failed",
                "data": {
                    "error": str(e),
                    "extraction_id": extraction_run_id,
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
    logger.info("Scheduled knowledge extraction task started")

    try:
        async with AsyncSessionLocal() as db:
            cutoff_time = datetime.utcnow() - timedelta(hours=ai_config.knowledge_extraction.lookback_hours)

            count_stmt = (
                select(func.count())
                .select_from(Message)
                .where(Message.topic_id.is_(None), Message.sent_at >= cutoff_time)  # type: ignore[arg-type,union-attr]
            )
            result = await db.execute(count_stmt)
            unprocessed_count = result.scalar() or 0

            if unprocessed_count == 0:
                logger.info("No unprocessed messages found, skipping extraction")
                return {"status": "skipped", "reason": "no_messages", "count": 0}

            agent_config_stmt = (
                select(AgentConfig)
                .where(AgentConfig.is_active == True, AgentConfig.name == "knowledge_extractor")  # type: ignore[arg-type]  # noqa: E712
                .limit(1)
            )
            agent_config_result = await db.execute(agent_config_stmt)
            agent_config = agent_config_result.scalar_one_or_none()

            if not agent_config:
                logger.warning("No active agent config 'knowledge_extractor' found")
                return {"status": "error", "reason": "no_agent", "count": 0}

            messages_stmt = (
                select(Message.id)  # type: ignore[call-overload]
                .where(Message.topic_id.is_(None), Message.sent_at >= cutoff_time)  # type: ignore[union-attr]
                .order_by(Message.sent_at)
                .limit(100)
            )
            messages_result = await db.execute(messages_stmt)
            message_ids = [row[0] for row in messages_result.all()]

            if len(message_ids) == 0:
                return {"status": "skipped", "reason": "no_messages", "count": 0}

            logger.info(f"Processing {len(message_ids)} unprocessed messages")

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
async def scheduled_auto_approval_task(
    task_id: str | None = None,
) -> dict[str, Any]:
    """
    Scheduled task for applying auto-approval rules to pending atoms.

    Processes atoms that:
    - Have user_approved=False (pending review)
    - Have confidence >= threshold (from ScheduledExtractionTask config)
    - Match allowed atom types (if specified)

    Args:
        task_id: Optional ScheduledExtractionTask UUID. If None, processes
                 all active extraction tasks with auto_approve_enabled=True.

    Returns:
        Dictionary with approval results.
    """
    logger.info("Auto-approval task started")

    try:
        async with AsyncSessionLocal() as db:
            from app.models import Atom
            from app.models.scheduled_extraction_task import ScheduledExtractionTask

            if task_id:
                task = await db.get(ScheduledExtractionTask, UUID(task_id))
                if not task:
                    logger.warning(f"ScheduledExtractionTask {task_id} not found")
                    return {"status": "error", "reason": "task_not_found", "approved_count": 0}
                tasks = [task] if task.auto_approve_enabled else []
            else:
                stmt = select(ScheduledExtractionTask).where(
                    ScheduledExtractionTask.is_active == True,  # type: ignore[arg-type]  # noqa: E712
                    ScheduledExtractionTask.auto_approve_enabled == True,  # type: ignore[arg-type]  # noqa: E712
                )
                result = await db.execute(stmt)
                tasks = list(result.scalars().all())

            if not tasks:
                logger.info("No extraction tasks with auto-approve enabled")
                return {"status": "skipped", "reason": "no_auto_approve_tasks", "approved_count": 0}

            total_approved = 0
            details: list[dict[str, Any]] = []

            for extraction_task in tasks:
                task_approved = await _process_auto_approval_for_task(db=db, extraction_task=extraction_task)
                total_approved += task_approved
                details.append({
                    "task_id": str(extraction_task.id),
                    "task_name": extraction_task.name,
                    "approved_count": task_approved,
                    "confidence_threshold": extraction_task.confidence_threshold,
                    "allowed_atom_types": extraction_task.allowed_atom_types,
                })

            logger.info(f"Auto-approval completed: {total_approved} atoms approved across {len(tasks)} task(s)")

            if total_approved > 0:
                await websocket_manager.broadcast(
                    "knowledge",
                    {"type": "knowledge.auto_approval_completed", "data": {"approved_count": total_approved, "tasks_processed": len(tasks)}},
                )

            return {"status": "success", "approved_count": total_approved, "tasks_processed": len(tasks), "details": details}

    except Exception as e:
        logger.error(f"Scheduled auto-approval failed: {e}", exc_info=True)
        return {"status": "error", "reason": str(e), "approved_count": 0}


async def _process_auto_approval_for_task(
    db: "AsyncSession",
    extraction_task: "ScheduledExtractionTask",
) -> int:
    """
    Process auto-approval for a single ScheduledExtractionTask.

    Finds atoms matching criteria and marks them as approved.

    Args:
        db: Database session
        extraction_task: The extraction task with auto-approve config

    Returns:
        Number of atoms approved
    """
    from app.models import Atom

    threshold = extraction_task.confidence_threshold or 0.8
    allowed_types = extraction_task.allowed_atom_types

    logger.info(f"Processing auto-approval for task '{extraction_task.name}': threshold={threshold}, allowed_types={allowed_types}")

    query = (
        select(Atom)
        .where(
            Atom.user_approved == False,  # type: ignore[arg-type]  # noqa: E712
            Atom.archived == False,  # type: ignore[arg-type]  # noqa: E712
            Atom.confidence.isnot(None),  # type: ignore[union-attr]
            Atom.confidence >= threshold,  # type: ignore[arg-type, operator]
        )
    )

    if allowed_types and len(allowed_types) > 0:
        query = query.where(Atom.type.in_(allowed_types))  # type: ignore[attr-defined]

    result = await db.execute(query)
    atoms = list(result.scalars().all())

    if not atoms:
        logger.info(f"No atoms matching auto-approval criteria for task '{extraction_task.name}'")
        return 0

    approved_count = 0
    for atom in atoms:
        atom.user_approved = True
        db.add(atom)
        approved_count += 1
        if atom.confidence:
            logger.debug(f"Auto-approved atom '{atom.title}' (type={atom.type}, confidence={atom.confidence:.2f})")

    await db.commit()
    logger.info(f"Auto-approved {approved_count} atoms for task '{extraction_task.name}'")

    return approved_count




@nats_broker.task
async def run_scheduled_extraction(scheduled_task_id: str) -> dict[str, Any]:
    """
    Execute a scheduled extraction task by its ID.

    This task is triggered by the TaskIQ scheduler based on cron expressions
    defined in ScheduledExtractionTask. It loads the task configuration from DB,
    finds matching messages, and triggers knowledge extraction.

    Args:
        scheduled_task_id: UUID of ScheduledExtractionTask as string

    Returns:
        Dictionary with execution status and statistics
    """
    from app.models.scheduled_extraction_task import ScheduledExtractionTask

    logger.info(f"Running scheduled extraction task: {scheduled_task_id}")

    try:
        async with AsyncSessionLocal() as db:
            # Load scheduled task configuration
            task = await db.get(ScheduledExtractionTask, UUID(scheduled_task_id))
            if not task:
                logger.error(f"ScheduledExtractionTask {scheduled_task_id} not found")
                return {"status": "error", "reason": "task_not_found"}

            if not task.is_active:
                logger.warning(f"ScheduledExtractionTask {task.name} is inactive, skipping")
                return {"status": "skipped", "reason": "task_inactive"}

            # Load agent config
            agent_config = await db.get(AgentConfig, task.agent_id)
            if not agent_config:
                logger.error(f"AgentConfig {task.agent_id} not found for task {task.name}")
                return {"status": "error", "reason": "agent_not_found"}

            if not agent_config.is_active:
                logger.warning(f"Agent {agent_config.name} is inactive, skipping")
                return {"status": "skipped", "reason": "agent_inactive"}

            # Build query for unprocessed messages
            cutoff_time = datetime.now(UTC) - timedelta(hours=task.lookback_hours)

            query = select(Message.id).where(  # type: ignore[call-overload]
                Message.topic_id.is_(None),  # type: ignore[union-attr]
                Message.sent_at >= cutoff_time,
            )

            # Apply channel filter if specified
            if task.channel_ids:
                query = query.where(Message.source_channel_id.in_(task.channel_ids))  # type: ignore[union-attr]

            # Apply minimum score filter if specified
            if task.min_score is not None:
                query = query.where(Message.importance_score >= task.min_score)  # type: ignore[operator]

            query = query.order_by(Message.sent_at).limit(100)

            result = await db.execute(query)
            message_ids = [row[0] for row in result.all()]

            if not message_ids:
                logger.info(f"No matching messages for task {task.name}, skipping")
                # Update last_run_at even if no messages
                task.last_run_at = datetime.now(UTC)
                await db.commit()
                return {"status": "skipped", "reason": "no_messages", "task_name": task.name}

            logger.info(f"Found {len(message_ids)} messages for task {task.name}")

            # Update last_run_at
            task.last_run_at = datetime.now(UTC)
            await db.commit()

            # Queue extraction task
            await extract_knowledge_from_messages_task.kiq(
                message_ids=message_ids,
                agent_config_id=str(agent_config.id),
                created_by=f"scheduled:{task.name}",
            )

            # Broadcast WebSocket event
            await websocket_manager.broadcast(
                "scheduler",
                {
                    "type": "scheduled_extraction.started",
                    "data": {
                        "task_id": str(task.id),
                        "task_name": task.name,
                        "message_count": len(message_ids),
                        "agent_name": agent_config.name,
                    },
                },
            )

            return {
                "status": "success",
                "task_id": str(task.id),
                "task_name": task.name,
                "message_count": len(message_ids),
                "agent_name": agent_config.name,
            }

    except Exception as e:
        logger.error(f"Scheduled extraction task failed: {e}", exc_info=True)

        await websocket_manager.broadcast(
            "scheduler",
            {
                "type": "scheduled_extraction.failed",
                "data": {
                    "task_id": scheduled_task_id,
                    "error": str(e),
                },
            },
        )

        return {"status": "error", "reason": str(e)}
