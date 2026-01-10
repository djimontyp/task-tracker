"""High-level orchestration for knowledge extraction workflow."""

from __future__ import annotations

import logging
import uuid
from collections.abc import Sequence
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

from pydantic_ai import Agent as PydanticAgent, PromptedOutput
from pydantic_ai.settings import ModelSettings
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

if TYPE_CHECKING:
    from pydantic_ai.models.openai import OpenAIChatModel

from app.config.ai_config import ai_config
from app.models import AgentConfig, Atom, AtomLink, LLMProvider, Message, ProjectConfig, Topic, TopicAtom
from app.models.topic import auto_select_color, auto_select_icon
from app.services.atom_crud import AtomCRUD, DeduplicationAction
from app.services.credential_encryption import CredentialEncryption
from app.services.embedding_service import EmbeddingService
from app.services.knowledge.knowledge_schemas import (
    ExtractedAtom,
    ExtractedTopic,
    KnowledgeExtractionOutput,
    PeriodType,
)
from app.services.knowledge.llm_agents import (
    build_model_instance,
    get_extraction_prompt,
    get_strengthened_prompt,
    validate_output_language,
)
from app.services.rag_context_builder import RAGContextBuilder
from app.services.semantic_search_service import SemanticSearchService
from app.services.topic_crud import TopicCRUD
from app.services.versioning import VersioningService

logger = logging.getLogger(__name__)


class KnowledgeOrchestrator:
    """Service for extracting topics and atoms from message batches using LLM.

    This service processes batches of messages (10-50 recommended) and uses
    Pydantic AI with Ollama/OpenAI to identify discussion topics and atomic knowledge units,
    automatically creating database entities and establishing relationships.
    """

    def __init__(
        self,
        agent_config: AgentConfig,
        provider: LLMProvider,
        language: str = "uk",
        rag_context_builder: RAGContextBuilder | None = None,
        project_config: ProjectConfig | None = None,
    ):
        """Initialize knowledge extraction service.

        Args:
            agent_config: Agent configuration with system prompt and model settings
            provider: LLM provider configuration (must be Ollama or OpenAI)
            language: ISO 639-1 language code for AI output (default: 'uk')
            rag_context_builder: Optional RAG context builder for semantic context injection
            project_config: Optional project configuration for domain-specific context injection
        """
        self.agent_config = agent_config
        self.provider = provider
        self.language = language
        self.rag_context_builder = rag_context_builder
        self.project_config = project_config
        self.encryptor = CredentialEncryption()

    @staticmethod
    async def fetch_messages_with_context(
        session: AsyncSession,
        message_ids: Sequence[uuid.UUID],
        include_context: bool = False,
        context_window: int = 5,
    ) -> Sequence[Message]:
        """Fetch messages by IDs, optionally including surrounding context.

        If include_context is True, for each target message, fetches 'context_window'
        messages before and after within the same thread. Deduplicates results.

        Args:
            session: Database session
            message_ids: IDs of core messages to analyze
            include_context: Whether to fetch surrounding messages
            context_window: Number of messages to include before/after (default 5)

        Returns:
            List of unique Message objects sorted by sent_at
        """
        # Fetch target messages first
        stmt = select(Message).where(Message.id.in_(message_ids))
        result = await session.execute(stmt)
        target_messages = list(result.scalars().all())

        if not include_context or not target_messages:
            return sorted(target_messages, key=lambda m: m.sent_at)

        # Context expansion logic
        # We need to find neighbors for each message in its thread
        # To avoid N+1 queries for large batches, we could optimize, but
        # for typical batch sizes (10-50), individual queries per thread group are acceptable.
        
        # Group by thread to optimize queries
        thread_map: dict[str, list[Message]] = {}
        for msg in target_messages:
            thread_id = msg.source_thread_id or "general"
            if thread_id not in thread_map:
                thread_map[thread_id] = []
            thread_map[thread_id].append(msg)

        all_messages_map: dict[uuid.UUID, Message] = {m.id: m for m in target_messages if m.id}

        for thread_id, msgs in thread_map.items():
            # For each message in thread, get window
            # We can optimize by getting the min/max time range for the thread's messages
            # but gaps in time might miss context. Safer to query neighbors per message.
            
            # Optimization: If many messages in same thread are close, ranges overlap.
            # But simple neighbor query is robust.
            
            for msg in msgs:
                # Get N messages before
                prev_stmt = (
                    select(Message)
                    .where(
                        Message.source_thread_id == (None if thread_id == "general" else thread_id),
                        Message.sent_at < msg.sent_at
                    )
                    .order_by(Message.sent_at.desc())
                    .limit(context_window)
                )
                prev_res = await session.execute(prev_stmt)
                for pm in prev_res.scalars():
                    if pm.id not in all_messages_map:
                        all_messages_map[pm.id] = pm # type: ignore[index]

                # Get N messages after
                next_stmt = (
                    select(Message)
                    .where(
                        Message.source_thread_id == (None if thread_id == "general" else thread_id),
                        Message.sent_at > msg.sent_at
                    )
                    .order_by(Message.sent_at.asc())
                    .limit(context_window)
                )
                next_res = await session.execute(next_stmt)
                for nm in next_res.scalars():
                    if nm.id not in all_messages_map:
                        all_messages_map[nm.id] = nm # type: ignore[index]

        return sorted(all_messages_map.values(), key=lambda m: m.sent_at)


    async def extract_knowledge(
        self,
        messages: Sequence[Message],
        session: AsyncSession | None = None,
    ) -> tuple[KnowledgeExtractionOutput, dict[str, int]]:
        """Extract topics and atoms from message batch using LLM.

        Uses language-specific prompts and validates output language.
        Retries once with strengthened prompt if language mismatch detected.

        If RAG context builder is configured and session provided, injects
        semantic context from similar atoms and related messages.

        Args:
            messages: Sequence of messages to analyze (10-50 recommended)
            session: Optional database session for RAG context lookup

        Returns:
            Structured extraction output with topics and atoms

        Raises:
            ValueError: If provider configuration is invalid
            Exception: If LLM request fails
        """
        logger.info(
            f"Starting knowledge extraction for {len(messages)} messages "
            f"using agent '{self.agent_config.name}' (model: {self.agent_config.model_name}), "
            f"language: {self.language}"
        )

        if len(messages) == 0:
            logger.warning("No messages provided for extraction, returning empty result")
            return KnowledgeExtractionOutput(topics=[], atoms=[])

        # Build RAG context if available
        rag_context_str = ""
        if self.rag_context_builder and session:
            try:
                logger.info("Building RAG context for extraction...")
                rag_context = await self.rag_context_builder.build_context(
                    session=session,
                    messages=list(messages),
                    top_k=5,
                )
                rag_context_str = self.rag_context_builder.format_context(rag_context)
                logger.info(
                    f"RAG context built: {len(rag_context.get('similar_proposals', []))} proposals, "
                    f"{len(rag_context.get('relevant_atoms', []))} atoms, "
                    f"{len(rag_context.get('related_messages', []))} messages"
                )
            except Exception as e:
                logger.warning(f"Failed to build RAG context, proceeding without: {e}")

        prompt = self._build_prompt(messages, rag_context_str)

        api_key = None
        if self.provider.api_key_encrypted:
            try:
                api_key = self.encryptor.decrypt(self.provider.api_key_encrypted)
            except Exception as e:
                raise ValueError(f"Failed to decrypt API key for provider '{self.provider.name}': {e}")

        model = build_model_instance(self.agent_config, self.provider, api_key)

        # Use language-specific system prompt
        system_prompt = get_extraction_prompt(self.language)

        result = await self._run_extraction(
            model=model,
            system_prompt=system_prompt,
            prompt=prompt,
        )
        extraction_output = result.data

        # Validate output language
        if not self._validate_extraction_language(extraction_output):
            logger.warning(
                f"Language mismatch detected in extraction output, "
                f"retrying with strengthened prompt for '{self.language}'"
            )
            # Retry with strengthened prompt (max 1 retry)
            strengthened_prompt = get_strengthened_prompt(self.language)
            result = await self._run_extraction(
                model=model,
                system_prompt=strengthened_prompt,
                prompt=prompt,
            )
            extraction_output = result.data

            # Log if still mismatched after retry
            if not self._validate_extraction_language(extraction_output):
                logger.warning(
                    "Language mismatch persists after retry, proceeding with current output"
                )

        logger.info(
            f"Extraction completed: {len(extraction_output.topics)} topics, "
            f"{len(extraction_output.atoms)} atoms extracted"
        )

        # Extract usage stats
        try:
            usage = result.usage()
            usage_dict = {
                "prompt_tokens": usage.request_tokens,
                "completion_tokens": usage.response_tokens,
                "total_tokens": usage.total_tokens
            }
        except Exception:
            logger.warning("Failed to extract usage stats from PydanticAI result")
            usage_dict = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

        return extraction_output, usage_dict

    async def _run_extraction(
        self,
        model: "OpenAIChatModel",
        system_prompt: str,
        prompt: str,
    ) -> Any:
        """Run single extraction attempt with given prompt.

        Uses PromptedOutput for Ollama providers to ensure reliable JSON parsing.
        Ollama models often return Python repr instead of JSON when using tool-based
        structured output, so we use prompted mode which injects JSON schema into
        the system prompt.

        Args:
            model: Configured LLM model
            system_prompt: System prompt for extraction
            prompt: User prompt with messages

        Returns:
            Extraction output

        Raises:
            Exception: If LLM request fails
        """
        # Use PromptedOutput for Ollama to avoid Python repr parsing issues
        # Ollama models work better with prompted mode than tool-based structured output
        from app.models import ProviderType

        use_prompted_output = self.provider.type == ProviderType.ollama

        if use_prompted_output:
            logger.debug(
                f"Using PromptedOutput for Ollama provider '{self.provider.name}' "
                f"to ensure reliable JSON parsing"
            )
            agent = PydanticAgent(
                model=model,
                system_prompt=system_prompt,
                output_type=PromptedOutput(KnowledgeExtractionOutput),
                output_retries=5,
            )
        else:
            agent = PydanticAgent(
                model=model,
                system_prompt=system_prompt,
                output_type=KnowledgeExtractionOutput,
                output_retries=5,
            )

        model_settings_obj: ModelSettings | None = None
        if self.agent_config.temperature is not None or self.agent_config.max_tokens is not None:
            model_settings_obj = ModelSettings()
            if self.agent_config.temperature is not None:
                model_settings_obj["temperature"] = self.agent_config.temperature
            if self.agent_config.max_tokens is not None:
                model_settings_obj["max_tokens"] = self.agent_config.max_tokens

        try:
            result = await agent.run(prompt, model_settings=model_settings_obj)
            return result

        except Exception as e:
            logger.error(
                f"LLM knowledge extraction failed for agent '{self.agent_config.name}': {e}",
                exc_info=True,
            )

            error_details = []
            error_details.append(f"Agent: {self.agent_config.name}")
            error_details.append(f"Model: {self.agent_config.model_name}")
            error_details.append(f"Provider type: {self.provider.type}")

            logger.error(f"Exception type: {type(e).__name__}")
            logger.error(f"Exception details: {repr(e)}")

            if hasattr(e, "__cause__") and e.__cause__ is not None:
                logger.error(f"Root cause: {type(e.__cause__).__name__}: {str(e.__cause__)}")

            if "validation" in str(e).lower() or "retries" in str(e).lower() or "ToolRetryError" in str(type(e)):
                error_details.append(
                    "LLM output validation failed - model may not be following the required JSON schema. "
                    "Consider using a more capable model (e.g., GPT-4, Claude) or adjusting the prompt."
                )

            logger.error(" | ".join(error_details))
            raise Exception(f"Knowledge extraction failed: {str(e)}. Check provider configuration.") from e

    def _validate_extraction_language(self, output: KnowledgeExtractionOutput) -> bool:
        """Validate that extraction output is in expected language.

        Checks topic names/descriptions and atom titles/content.

        Args:
            output: Extraction output to validate

        Returns:
            True if language matches or no text to validate, False if mismatch
        """
        # Collect text samples for validation
        texts_to_check: list[str] = []

        for topic in output.topics:
            if topic.name:
                texts_to_check.append(topic.name)
            if topic.description:
                texts_to_check.append(topic.description)

        for atom in output.atoms:
            if atom.title:
                texts_to_check.append(atom.title)
            if atom.content:
                texts_to_check.append(atom.content)

        if not texts_to_check:
            return True

        # Combine texts for more reliable detection
        combined_text = " ".join(texts_to_check)
        return validate_output_language(combined_text, self.language)

    async def save_topics(
        self,
        extracted_topics: list[ExtractedTopic],
        session: AsyncSession,
        confidence_threshold: float | None = None,
        created_by: str | None = None,
    ) -> tuple[dict[str, Topic], list[int]]:
        """Create or update topics in database.

        For existing topics, creates a version snapshot instead of direct update.
        For new topics, creates Topic record normally.

        Args:
            extracted_topics: Topics extracted from LLM
            session: Database session
            confidence_threshold: Minimum confidence to auto-create (default: from config)
            created_by: User ID who triggered extraction (default: "knowledge_extraction")

        Returns:
            Tuple of (topic_map, version_created_topic_ids):
                - topic_map: Mapping of topic name -> Topic entity
                - version_created_topic_ids: List of topic IDs that had versions created
        """
        if confidence_threshold is None:
            confidence_threshold = ai_config.knowledge_extraction.confidence_threshold

        topic_crud = TopicCRUD(session)
        versioning_service = VersioningService()
        
        # Initialize semantic services
        try:
            embedding_service = EmbeddingService(self.provider)
            search_service = SemanticSearchService(embedding_service)
            use_semantic_search = True
        except ValueError as e:
            logger.warning(f"Semantic search unavailable for topic dedup: {e}")
            use_semantic_search = False
            embedding_service = None
            search_service = None

        topic_map: dict[str, Topic] = {}
        version_created_topic_ids: list[int] = []

        for extracted_topic in extracted_topics:
            if extracted_topic.confidence < confidence_threshold:
                logger.warning(
                    f"Topic '{extracted_topic.name}' has low confidence {extracted_topic.confidence:.2f}, "
                    f"skipping auto-creation (threshold: {confidence_threshold})"
                )
                continue

            # Prepare topic data
            icon = auto_select_icon(extracted_topic.name, extracted_topic.description)
            color = auto_select_color(icon)
            
            from app.models import TopicCreate
            topic_data = TopicCreate(
                name=extracted_topic.name,
                description=extracted_topic.description,
                icon=icon,
                color=color
            )

            # Use semantic dedup if available
            if use_semantic_search and embedding_service and search_service:
                result = await topic_crud.find_or_create(
                    topic_data=topic_data,
                    embedding_service=embedding_service,
                    search_service=search_service,
                    threshold=0.85
                )
                
                # Convert TopicPublic back to Topic model for map (simplified)
                # We need the ID to map it
                topic_id = result.topic.id
                
                # We need the actual ORM object for the map if possible, or just enough for save_atoms
                # Re-fetch the ORM object ensures we have what we need
                topic_orm = await session.get(Topic, topic_id)
                if topic_orm:
                    topic_map[extracted_topic.name] = topic_orm
                    if result.was_merged:
                         # Optional: Create version snapshot if we want to track updates to existing topics
                         # For now, we assume "merged" means "reused" without change.
                         pass
                    else:
                        logger.info(f"Created new topic '{extracted_topic.name}' (ID: {topic_id})")
                
            else:
                # Fallback to exact name match (legacy logic)
                result = await session.execute(select(Topic).where(Topic.name == extracted_topic.name))  # type: ignore[arg-type]
                existing_topic = result.scalar_one_or_none()

                if existing_topic:
                    logger.info(
                        f"Topic '{extracted_topic.name}' already exists (ID: {existing_topic.id}), "
                        "creating version snapshot"
                    )
                    version_data = {
                        "name": extracted_topic.name,
                        "description": extracted_topic.description,
                        "icon": icon,
                        "color": color,
                    }
                    await versioning_service.create_topic_version(
                        db=session,
                        topic_id=existing_topic.id,
                        data=version_data,
                        created_by=created_by or "knowledge_extraction",
                    )
                    if existing_topic.id is not None:
                        version_created_topic_ids.append(existing_topic.id)
                    topic_map[extracted_topic.name] = existing_topic
                else:
                    new_topic = Topic(
                        name=extracted_topic.name,
                        description=extracted_topic.description,
                        icon=icon,
                        color=color,
                    )
                    session.add(new_topic)
                    await session.flush()
                    logger.info(
                        f"Created topic '{extracted_topic.name}' (ID: {new_topic.id}, "
                        f"confidence: {extracted_topic.confidence:.2f})"
                    )
                    topic_map[extracted_topic.name] = new_topic

        await session.commit()
        logger.info(
            f"Saved {len(topic_map)} topics to database"
        )
        return topic_map, version_created_topic_ids

    async def save_atoms(
        self,
        extracted_atoms: list[ExtractedAtom],
        topic_map: dict[str, Topic],
        session: AsyncSession,
        confidence_threshold: float | None = None,
        created_by: str | None = None,
    ) -> tuple[list[Atom], list[uuid.UUID]]:
        """Create atoms and link them to topics.

        For existing atoms, creates a version snapshot instead of direct update.
        For new atoms, creates Atom record normally.

        Args:
            extracted_atoms: Atoms extracted from LLM
            topic_map: Mapping of topic names to Topic entities
            session: Database session
            confidence_threshold: Minimum confidence to auto-create (default: from config)
            created_by: User ID who triggered extraction (default: "knowledge_extraction")

        Returns:
            Tuple of (saved_atoms, version_created_atom_ids):
                - saved_atoms: List of created or matched Atom entities
                - version_created_atom_ids: List of atom IDs that had versions created
        """
        if confidence_threshold is None:
            confidence_threshold = ai_config.knowledge_extraction.confidence_threshold

        atom_crud = AtomCRUD(session)
        topic_crud = TopicCRUD(session)
        
        # Initialize semantic services
        try:
            embedding_service = EmbeddingService(self.provider)
            search_service = SemanticSearchService(embedding_service)
            use_semantic_dedup = True
        except ValueError as e:
            logger.warning(f"Semantic search unavailable for atom dedup: {e}")
            use_semantic_dedup = False
            embedding_service = None
            search_service = None

        saved_atoms: list[Atom] = []
        version_created_atom_ids: list[uuid.UUID] = []

        for extracted_atom in extracted_atoms:
            if extracted_atom.confidence < confidence_threshold:
                logger.warning(
                    f"Atom '{extracted_atom.title}' has low confidence {extracted_atom.confidence:.2f}, "
                    f"skipping auto-creation (threshold: {confidence_threshold})"
                )
                continue

            if extracted_atom.topic_name not in topic_map:
                logger.warning(
                    f"Atom '{extracted_atom.title}' references unknown topic '{extracted_atom.topic_name}', "
                    "skipping (topic was likely filtered by confidence threshold)"
                )
                continue

            topic = topic_map[extracted_atom.topic_name]

            # Prepare atom data
            from app.models import AtomCreate
            atom_data = AtomCreate(
                type=extracted_atom.type,
                title=extracted_atom.title,
                content=extracted_atom.content,
                confidence=extracted_atom.confidence,
                user_approved=False,
                meta={"source": "llm_extraction", "message_ids": [str(mid) for mid in extracted_atom.related_message_ids]}
            )

            current_atom = None

            # Use semantic dedup
            if use_semantic_dedup and embedding_service and search_service:
                dedup_result = await atom_crud.create_with_dedup(
                    atom_data=atom_data,
                    embedding_service=embedding_service,
                    search_service=search_service,
                    threshold_high=0.95,
                    threshold_mid=0.85,
                    created_by=created_by or "knowledge_extraction"
                )
                
                # Fetch ORM object
                current_atom = await session.get(Atom, uuid.UUID(dedup_result.atom.id))
                
                if dedup_result.action == DeduplicationAction.CREATED_VERSION:
                    version_created_atom_ids.append(uuid.UUID(dedup_result.atom.id))
                    logger.info(f"Created version for existing atom {dedup_result.atom.id} (similarity: {dedup_result.similarity_score:.3f})")
                elif dedup_result.action == DeduplicationAction.CREATED_SIMILAR:
                    logger.info(f"Created new atom {dedup_result.atom.id} marked similar to {dedup_result.similar_atom_id}")
                else:
                    logger.info(f"Created new unique atom {dedup_result.atom.id}")
            
            else:
                # Fallback to legacy exact match
                result = await session.execute(select(Atom).where(Atom.title == extracted_atom.title))
                existing_atom = result.scalar_one_or_none()

                if existing_atom:
                    logger.info(f"Atom '{extracted_atom.title}' already exists, creating version (legacy)")
                    versioning_service = VersioningService() # Local import if needed
                    version_data = {
                        "type": extracted_atom.type,
                        "title": extracted_atom.title,
                        "content": extracted_atom.content,
                        "confidence": extracted_atom.confidence,
                        "meta": atom_data.meta
                    }
                    await versioning_service.create_atom_version(
                        db=session, atom_id=existing_atom.id, data=version_data, created_by="knowledge_extraction"
                    )
                    version_created_atom_ids.append(existing_atom.id)
                    current_atom = existing_atom
                else:
                    new_atom = Atom(
                        type=extracted_atom.type,
                        title=extracted_atom.title,
                        content=extracted_atom.content,
                        confidence=extracted_atom.confidence,
                        user_approved=False,
                        meta=atom_data.meta,
                    )
                    session.add(new_atom)
                    await session.flush()
                    current_atom = new_atom

            if current_atom:
                saved_atoms.append(current_atom)
                
                # Link to PRIMARY topic (from prompt)
                # Note: create_with_dedup doesn't link topics, we do it here
                await atom_crud.link_to_topic(
                    atom_id=current_atom.id,
                    topic_id=topic.id,
                    note=f"Extracted prompt assignment (confidence: {extracted_atom.confidence:.2f})"
                )
                
                # AUTO-LINK to other semantically similar topics
                # But only for NEW atoms (to avoid spamming links on every extraction of old atoms)
                # Or maybe check if links exist? auto_link_atom checks existence internally.
                if use_semantic_dedup:
                    await topic_crud.auto_link_atom(
                        atom_id=current_atom.id,
                        atom_content=f"{current_atom.title}\n\n{current_atom.content}",
                        threshold=0.80
                    )

        await session.commit()
        logger.info(
            f"Saved {len(saved_atoms)} atoms to database ({len(version_created_atom_ids)} had versions created)"
        )
        return saved_atoms, version_created_atom_ids

    async def link_atoms(
        self, extracted_atoms: list[ExtractedAtom], saved_atoms: list[Atom], session: AsyncSession
    ) -> int:
        """Create atom link relationships based on extraction output.

        Args:
            extracted_atoms: Original extraction output with link information
            saved_atoms: Atoms that were actually saved to database
            session: Database session

        Returns:
            Number of links created
        """
        atom_title_to_id: dict[str, int] = {atom.title: atom.id for atom in saved_atoms if atom.id is not None}
        links_created = 0

        for extracted_atom in extracted_atoms:
            if extracted_atom.title not in atom_title_to_id:
                continue

            from_atom_id = atom_title_to_id[extracted_atom.title]

            if len(extracted_atom.links_to_atom_titles) != len(extracted_atom.link_types):
                logger.warning(
                    f"Atom '{extracted_atom.title}' has mismatched link arrays "
                    f"({len(extracted_atom.links_to_atom_titles)} targets, {len(extracted_atom.link_types)} types), "
                    "skipping links"
                )
                continue

            for target_title, link_type in zip(
                extracted_atom.links_to_atom_titles, extracted_atom.link_types, strict=False
            ):
                if target_title not in atom_title_to_id:
                    logger.debug(
                        f"Cannot link '{extracted_atom.title}' -> '{target_title}': target not found in saved atoms"
                    )
                    continue

                to_atom_id = atom_title_to_id[target_title]

                if from_atom_id == to_atom_id:
                    logger.warning(f"Skipping self-referential link for atom '{extracted_atom.title}'")
                    continue

                stmt = select(AtomLink).where(
                    AtomLink.from_atom_id == from_atom_id,
                    AtomLink.to_atom_id == to_atom_id,  # type: ignore[arg-type]
                )
                result = await session.execute(stmt)
                existing_link = result.scalar_one_or_none()

                if existing_link:
                    logger.debug(
                        f"Link already exists: '{extracted_atom.title}' -> '{target_title}' ({link_type}), skipping"
                    )
                    continue

                new_link = AtomLink(
                    from_atom_id=from_atom_id,
                    to_atom_id=to_atom_id,
                    link_type=link_type,
                    strength=None,
                )
                session.add(new_link)
                links_created += 1

                logger.info(f"Created link: '{extracted_atom.title}' -> '{target_title}' ({link_type})")

        await session.commit()
        logger.info(f"Created {links_created} atom links")
        return links_created

    async def update_messages(
        self,
        messages: Sequence[Message],
        topic_map: dict[str, Topic],
        extracted_topics: list[ExtractedTopic],
        session: AsyncSession,
    ) -> int:
        """Update Message.topic_id based on extraction results.

        Args:
            messages: Original messages that were analyzed
            topic_map: Mapping of topic names to Topic entities
            extracted_topics: Original extraction output with message ID mappings
            session: Database session

        Returns:
            Number of messages updated
        """
        message_id_to_topic: dict[uuid.UUID, uuid.UUID] = {}

        for extracted_topic in extracted_topics:
            if extracted_topic.name not in topic_map:
                continue

            topic = topic_map[extracted_topic.name]
            if topic.id is None:
                continue

            topic_id = topic.id
            for msg_id in extracted_topic.related_message_ids:
                if msg_id in message_id_to_topic:
                    logger.debug(f"Message {msg_id} already assigned to a topic, keeping first assignment")
                else:
                    message_id_to_topic[msg_id] = topic_id

        updated_count = 0
        for message in messages:
            if message.id is not None and message.id in message_id_to_topic:
                message.topic_id = message_id_to_topic[message.id]
                updated_count += 1
                logger.debug(f"Assigned message {message.id} to topic {message_id_to_topic[message.id]}")

        await session.commit()
        logger.info(f"Updated {updated_count} messages with topic assignments")
        return updated_count

    def _format_glossary(self, glossary: dict[str, str]) -> str:
        """Format project glossary as markdown bullet list.

        Args:
            glossary: Dictionary of term -> definition

        Returns:
            Formatted glossary string
        """
        if not glossary:
            return "No glossary terms defined."

        lines = []
        for term, definition in glossary.items():
            lines.append(f"- **{term}**: {definition}")

        return "\n".join(lines)

    def _format_components(self, components: list[dict]) -> str:
        """Format project components with their keywords.

        Args:
            components: List of component dictionaries with 'name' and 'keywords'

        Returns:
            Formatted components string
        """
        if not components:
            return "No components defined."

        lines = []
        for comp in components:
            name = comp.get("name", "Unnamed")
            keywords = comp.get("keywords", [])
            keywords_str = ", ".join(keywords) if keywords else "no keywords"
            lines.append(f"- **{name}**: `{keywords_str}`")

        return "\n".join(lines)

    def _build_prompt(self, messages: Sequence[Message], rag_context: str = "") -> str:
        """Build LLM prompt from message batch with optional RAG context and project context.

        Groups messages by thread to preserve conversation structure.
        Injects project-specific context (keywords, glossary, components) when available.

        Args:
            messages: Messages to analyze
            rag_context: Optional formatted RAG context string

        Returns:
            Formatted prompt string
        """
        # Group messages by thread for better context
        thread_groups: dict[str, list[Message]] = {}
        for msg in messages:
            thread_key = msg.source_thread_id or "general"
            if thread_key not in thread_groups:
                thread_groups[thread_key] = []
            thread_groups[thread_key].append(msg)

        # Format messages preserving thread structure
        sections: list[str] = []
        msg_counter = 1

        for thread_id, thread_msgs in thread_groups.items():
            # Sort by time within each thread
            thread_msgs_sorted = sorted(thread_msgs, key=lambda m: m.sent_at)

            if len(thread_groups) > 1:
                # Multiple threads - show structure
                thread_label = f"Thread: {thread_id}" if thread_id != "general" else "General discussion"
                thread_text_parts = [f"### {thread_label}"]
                for msg in thread_msgs_sorted:
                    thread_text_parts.append(
                        f"[{msg.sent_at.strftime('%H:%M')}] Message {msg_counter} (ID: {msg.id}, Author: {msg.author_id}):\n{msg.content}"
                    )
                    msg_counter += 1
                sections.append("\n".join(thread_text_parts))
            else:
                # Single thread - flat format
                for msg in thread_msgs_sorted:
                    sections.append(
                        f"Message {msg_counter} (ID: {msg.id}, Author: {msg.author_id}, Time: {msg.sent_at}):\n{msg.content}"
                    )
                    msg_counter += 1

        messages_text = "\n\n".join(sections)

        # Build project context section if available
        project_context_section = ""
        if self.project_config:
            keywords_str = ", ".join(self.project_config.keywords)

            # Format priority rules
            priority_section = ""
            if self.project_config.priority_rules:
                critical_kw = self.project_config.priority_rules.get("critical_keywords", [])
                high_kw = self.project_config.priority_rules.get("high_keywords", [])

                if critical_kw or high_kw:
                    priority_section = "\n**Priority Detection Rules:**\n"
                    if critical_kw:
                        priority_section += f"- Critical (0.9+ confidence): {', '.join(critical_kw)}\n"
                    if high_kw:
                        priority_section += f"- High (0.8+ confidence): {', '.join(high_kw)}\n"

            project_context_section = f"""
## Project Context: {self.project_config.name}

**Description:** {self.project_config.description}

**Domain Keywords:**
{keywords_str}

**Glossary of Terms:**
{self._format_glossary(self.project_config.glossary)}

**System Components:**
{self._format_components(self.project_config.components)}
{priority_section}
Use this project context to:
- Recognize domain-specific terminology from glossary
- Identify component-related discussions from keywords
- Apply correct technical terms when extracting knowledge
- Maintain consistency with project terminology
- Assign higher confidence to atoms matching critical/high priority keywords

---

"""

        # Build RAG context section if available
        rag_context_section = ""
        if rag_context:
            rag_context_section = f"""
## Historical Context (RAG)

{rag_context}

Use the above context to:
- Avoid creating duplicate atoms (check similar existing atoms)
- Maintain consistent naming with existing topics
- Link new atoms to related existing knowledge
- Reference past decisions when relevant

---

"""

        prompt = f"""Analyze the following {len(messages)} messages and extract knowledge.
{project_context_section}{rag_context_section}
## Messages to Analyze

{messages_text}

## Instructions

1. Identify 1-3 main discussion topics these messages belong to
2. Extract atomic knowledge units (problems, solutions, decisions, insights, questions, patterns, requirements)
3. Assign each atom to a topic
4. Create links between related atoms (e.g., solution solves problem, insight supports decision)
5. Provide confidence scores (0.7+ for auto-creation, lower for review)

Return structured output with topics and atoms."""
        return prompt


async def get_messages_by_period(
    db: AsyncSession,
    period_type: PeriodType,
    topic_id: int | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> list[int]:
    """Get message IDs by time period and optional topic filter.

    Args:
        db: Database session
        period_type: Time period type (last_24h/last_7d/last_30d/custom)
        topic_id: Optional topic ID to filter messages
        start_date: Start date for custom period (timezone-aware)
        end_date: End date for custom period (timezone-aware)

    Returns:
        List of message IDs matching criteria

    Raises:
        ValueError: If custom period dates are invalid or missing
    """
    now = datetime.now(UTC)

    if period_type == "last_24h":
        start_time = now - timedelta(hours=24)
        end_time = now
    elif period_type == "last_7d":
        start_time = now - timedelta(days=7)
        end_time = now
    elif period_type == "last_30d":
        start_time = now - timedelta(days=30)
        end_time = now
    elif period_type == "custom":
        if not start_date or not end_date:
            raise ValueError("Custom period requires both start_date and end_date")

        if start_date > now or end_date > now:
            raise ValueError("Custom period dates cannot be in the future")

        if start_date >= end_date:
            raise ValueError("start_date must be before end_date")

        start_time = start_date.replace(tzinfo=UTC) if start_date.tzinfo is None else start_date
        end_time = end_date.replace(tzinfo=UTC) if end_date.tzinfo is None else end_date
    else:
        raise ValueError(f"Invalid period_type: {period_type}")

    start_time_naive = start_time.replace(tzinfo=None)
    end_time_naive = end_time.replace(tzinfo=None)

    stmt = select(Message).where(Message.sent_at >= start_time_naive, Message.sent_at <= end_time_naive)  # type: ignore[arg-type]

    if topic_id is not None:
        stmt = stmt.where(Message.topic_id == topic_id)  # type: ignore[arg-type]

    result = await db.execute(stmt)
    messages = result.scalars().all()
    message_ids = [msg.id for msg in messages if msg.id is not None]

    logger.info(
        f"Found {len(message_ids)} messages for period {period_type} "
        f"(start: {start_time}, end: {end_time}, topic_id: {topic_id})"
    )

    return message_ids
