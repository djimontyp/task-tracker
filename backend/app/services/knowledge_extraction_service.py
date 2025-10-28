"""Knowledge extraction service for automatically extracting Topics and Atoms from messages.

This service uses Pydantic AI with Ollama to analyze message batches and extract
structured knowledge in the form of topics (discussion themes) and atoms (atomic
knowledge units like problems, solutions, insights).
"""

import logging
from collections.abc import Sequence
from datetime import UTC, datetime, timedelta
from typing import Literal

from pydantic import BaseModel, Field
from pydantic_ai import Agent as PydanticAgent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.ollama import OllamaProvider
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.settings import ModelSettings
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.ai_config import ai_config
from app.models import AgentConfig, Atom, AtomLink, LLMProvider, Message, ProviderType, Topic, TopicAtom
from app.models.topic import auto_select_color, auto_select_icon
from app.services.credential_encryption import CredentialEncryption
from app.services.versioning_service import VersioningService

logger = logging.getLogger(__name__)

PeriodType = Literal["last_24h", "last_7d", "last_30d", "custom"]


class ExtractedTopic(BaseModel):
    """Topic extracted from messages."""

    name: str = Field(max_length=100, description="Concise topic name (2-4 words max)")
    description: str = Field(default="", description="Clear description of the discussion theme")
    confidence: float = Field(
        default=0.7, ge=0.0, le=1.0, description="Extraction confidence (0.7+ recommended for auto-creation)"
    )
    keywords: list[str] = Field(default_factory=list, description="Key terms associated with this topic")
    related_message_ids: list[int] = Field(
        default_factory=list, description="Source message IDs that contributed to this topic"
    )


class ExtractedAtom(BaseModel):
    """Atom extracted from messages."""

    type: str = Field(
        default="insight", description="Atom type: problem/solution/decision/insight/question/pattern/requirement"
    )
    title: str = Field(max_length=200, description="Brief title summarizing the atomic knowledge unit")
    content: str = Field(default="", description="Full self-contained content of the atom")
    confidence: float = Field(
        default=0.7, ge=0.0, le=1.0, description="Extraction confidence (0.7+ recommended for auto-creation)"
    )
    topic_name: str = Field(default="", description="Parent topic name this atom belongs to")
    related_message_ids: list[int] = Field(
        default_factory=list, description="Source message IDs that contributed to this atom"
    )
    links_to_atom_titles: list[str] = Field(default_factory=list, description="Titles of related atoms to link with")
    link_types: list[str] = Field(
        default_factory=list,
        description="Link relationship types: solves/supports/contradicts/continues/refines/relates_to/depends_on",
    )


class KnowledgeExtractionOutput(BaseModel):
    """Full knowledge extraction output from LLM."""

    topics: list[ExtractedTopic] = Field(description="Extracted discussion topics")
    atoms: list[ExtractedAtom] = Field(description="Extracted atomic knowledge units")


KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT = """You are a knowledge extraction expert. Your ONLY job is to analyze messages and return valid JSON.

CRITICAL: You must respond with ONLY a JSON object. No explanations, no markdown, no extra text.

Extract two things:
1. TOPICS - Main discussion themes (2-4 words each)
2. ATOMS - Specific knowledge units (problem/solution/insight/decision/question/pattern/requirement)

JSON STRUCTURE (respond with EXACTLY this format):
{
  "topics": [
    {
      "name": "Topic Name",
      "description": "Brief description",
      "confidence": 0.8,
      "keywords": ["keyword1", "keyword2"],
      "related_message_ids": [1, 2]
    }
  ],
  "atoms": [
    {
      "type": "problem",
      "title": "Brief title",
      "content": "Full description",
      "confidence": 0.8,
      "topic_name": "Topic Name",
      "related_message_ids": [1],
      "links_to_atom_titles": [],
      "link_types": []
    }
  ]
}

RULES:
1. ALL fields must be present (use empty arrays [] for lists if no data)
2. confidence must be a number between 0.0 and 1.0
3. type must be one of: problem, solution, insight, decision, question, pattern, requirement
4. NO extra fields allowed
5. Respond ONLY with JSON - no markdown formatting, no explanations

If you cannot extract any topics or atoms, return:
{"topics": [], "atoms": []}"""


class KnowledgeExtractionService:
    """Service for extracting topics and atoms from message batches using LLM.

    This service processes batches of messages (10-50 recommended) and uses
    Pydantic AI with Ollama/OpenAI to identify discussion topics and atomic knowledge units,
    automatically creating database entities and establishing relationships.
    """

    def __init__(self, agent_config: AgentConfig, provider: LLMProvider):
        """Initialize knowledge extraction service.

        Args:
            agent_config: Agent configuration with system prompt and model settings
            provider: LLM provider configuration (must be Ollama or OpenAI)
        """
        self.agent_config = agent_config
        self.provider = provider
        self.encryptor = CredentialEncryption()

    async def extract_knowledge(
        self,
        messages: Sequence[Message],
    ) -> KnowledgeExtractionOutput:
        """Extract topics and atoms from message batch using LLM.

        Args:
            messages: Sequence of messages to analyze (10-50 recommended)

        Returns:
            Structured extraction output with topics and atoms

        Raises:
            ValueError: If provider configuration is invalid
            Exception: If LLM request fails
        """
        logger.info(
            f"Starting knowledge extraction for {len(messages)} messages "
            f"using agent '{self.agent_config.name}' (model: {self.agent_config.model_name})"
        )

        if len(messages) == 0:
            logger.warning("No messages provided for extraction, returning empty result")
            return KnowledgeExtractionOutput(topics=[], atoms=[])

        prompt = self._build_prompt(messages)

        api_key = None
        if self.provider.api_key_encrypted:
            try:
                api_key = self.encryptor.decrypt(self.provider.api_key_encrypted)
            except Exception as e:
                raise ValueError(f"Failed to decrypt API key for provider '{self.provider.name}': {e}")

        model = self._build_model_instance(api_key)

        agent = PydanticAgent(
            model=model,
            system_prompt=self.agent_config.system_prompt,
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
            extraction_output: KnowledgeExtractionOutput = result.output

            logger.info(
                f"Extraction completed: {len(extraction_output.topics)} topics, "
                f"{len(extraction_output.atoms)} atoms extracted"
            )

            return extraction_output

        except Exception as e:
            logger.error(
                f"LLM knowledge extraction failed for agent '{self.agent_config.name}': {e}",
                exc_info=True,
            )

            error_details = []
            error_details.append(f"Agent: {self.agent_config.name}")
            error_details.append(f"Model: {self.agent_config.model_name}")
            error_details.append(f"Provider type: {self.provider.type}")
            error_details.append(f"Messages analyzed: {len(messages)}")

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

        versioning_service = VersioningService()
        topic_map: dict[str, Topic] = {}
        version_created_topic_ids: list[int] = []

        for extracted_topic in extracted_topics:
            if extracted_topic.confidence < confidence_threshold:
                logger.warning(
                    f"Topic '{extracted_topic.name}' has low confidence {extracted_topic.confidence:.2f}, "
                    f"skipping auto-creation (threshold: {confidence_threshold})"
                )
                continue

            result = await session.execute(select(Topic).where(Topic.name == extracted_topic.name))  # type: ignore[arg-type]
            existing_topic = result.scalar_one_or_none()

            if existing_topic:
                logger.info(
                    f"Topic '{extracted_topic.name}' already exists (ID: {existing_topic.id}), "
                    "creating version snapshot"
                )

                icon = auto_select_icon(extracted_topic.name, extracted_topic.description)
                color = auto_select_color(icon)

                version_data = {
                    "name": extracted_topic.name,
                    "description": extracted_topic.description,
                    "icon": icon,
                    "color": color,
                }

                version = await versioning_service.create_topic_version(
                    db=session,
                    topic_id=existing_topic.id,
                    data=version_data,
                    created_by=created_by or "knowledge_extraction",
                )

                if existing_topic.id is not None:
                    version_created_topic_ids.append(existing_topic.id)

                topic_map[extracted_topic.name] = existing_topic
            else:
                icon = auto_select_icon(extracted_topic.name, extracted_topic.description)
                color = auto_select_color(icon)

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
            f"Saved {len(topic_map)} topics to database ({len(version_created_topic_ids)} had versions created)"
        )
        return topic_map, version_created_topic_ids

    async def save_atoms(
        self,
        extracted_atoms: list[ExtractedAtom],
        topic_map: dict[str, Topic],
        session: AsyncSession,
        confidence_threshold: float | None = None,
        created_by: str | None = None,
    ) -> tuple[list[Atom], list[int]]:
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

        versioning_service = VersioningService()
        saved_atoms: list[Atom] = []
        version_created_atom_ids: list[int] = []

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

            result = await session.execute(select(Atom).where(Atom.title == extracted_atom.title))  # type: ignore[arg-type]
            existing_atom = result.scalar_one_or_none()

            if existing_atom:
                logger.info(
                    f"Atom '{extracted_atom.title}' already exists (ID: {existing_atom.id}), creating version snapshot"
                )

                version_data = {
                    "type": extracted_atom.type,
                    "title": extracted_atom.title,
                    "content": extracted_atom.content,
                    "confidence": extracted_atom.confidence,
                    "meta": {"source": "llm_extraction", "message_ids": extracted_atom.related_message_ids},
                }

                version = await versioning_service.create_atom_version(
                    db=session,
                    atom_id=existing_atom.id,
                    data=version_data,
                    created_by=created_by or "knowledge_extraction",
                )

                if existing_atom.id is not None:
                    version_created_atom_ids.append(existing_atom.id)

                saved_atoms.append(existing_atom)
            else:
                new_atom = Atom(
                    type=extracted_atom.type,
                    title=extracted_atom.title,
                    content=extracted_atom.content,
                    confidence=extracted_atom.confidence,
                    user_approved=False,
                    meta={"source": "llm_extraction", "message_ids": extracted_atom.related_message_ids},
                )
                session.add(new_atom)
                await session.flush()

                topic = topic_map[extracted_atom.topic_name]
                topic_atom = TopicAtom(
                    topic_id=topic.id,
                    atom_id=new_atom.id,
                    note=f"Auto-extracted with confidence {extracted_atom.confidence:.2f}",
                )
                session.add(topic_atom)

                logger.info(
                    f"Created atom '{extracted_atom.title}' (ID: {new_atom.id}, type: {extracted_atom.type}, "
                    f"topic: {extracted_atom.topic_name}, confidence: {extracted_atom.confidence:.2f})"
                )
                saved_atoms.append(new_atom)

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
        message_id_to_topic: dict[int, int] = {}

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

    def _build_prompt(self, messages: Sequence[Message]) -> str:
        """Build LLM prompt from message batch.

        Args:
            messages: Messages to analyze

        Returns:
            Formatted prompt string
        """
        messages_text = "\n\n".join([
            f"Message {i + 1} (ID: {msg.id}, Author: {msg.author_id}, Time: {msg.sent_at}):\n{msg.content}"
            for i, msg in enumerate(messages)
        ])

        prompt = f"""Analyze the following {len(messages)} messages and extract knowledge.

Messages:
{messages_text}

Instructions:
1. Identify 1-3 main discussion topics these messages belong to
2. Extract atomic knowledge units (problems, solutions, decisions, insights, questions, patterns, requirements)
3. Assign each atom to a topic
4. Create links between related atoms (e.g., solution solves problem, insight supports decision)
5. Provide confidence scores (0.7+ for auto-creation, lower for review)

Return structured output with topics and atoms."""
        return prompt

    def _build_model_instance(self, api_key: str | None = None) -> OpenAIChatModel:
        """Build pydantic-ai model instance from provider configuration.

        Args:
            api_key: Decrypted API key (if required)

        Returns:
            Configured model instance for pydantic-ai

        Raises:
            ValueError: If provider type is unsupported or configuration invalid
        """
        if self.provider.type == ProviderType.ollama:
            if not self.provider.base_url:
                raise ValueError(
                    f"Provider '{self.provider.name}' is missing base_url. "
                    "Ollama providers require a base_url configuration."
                )

            ollama_provider = OllamaProvider(base_url=self.provider.base_url)
            return OpenAIChatModel(
                model_name=self.agent_config.model_name,
                provider=ollama_provider,
            )

        elif self.provider.type == ProviderType.openai:
            if not api_key:
                raise ValueError(
                    f"Provider '{self.provider.name}' requires an API key. "
                    "OpenAI providers must have an API key configured."
                )

            openai_provider = OpenAIProvider(api_key=api_key)
            return OpenAIChatModel(
                model_name=self.agent_config.model_name,
                provider=openai_provider,
            )

        else:
            raise ValueError(f"Unsupported provider type: {self.provider.type}. Supported types: ollama, openai")


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
