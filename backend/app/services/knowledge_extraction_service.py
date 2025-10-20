"""Knowledge extraction service for automatically extracting Topics and Atoms from messages.

This service uses Pydantic AI with Ollama to analyze message batches and extract
structured knowledge in the form of topics (discussion themes) and atoms (atomic
knowledge units like problems, solutions, insights).
"""

import logging
from collections.abc import Sequence

from pydantic import BaseModel, Field
from pydantic_ai import Agent as PydanticAgent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.ollama import OllamaProvider
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.settings import ModelSettings
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AgentConfig, Atom, AtomLink, LLMProvider, Message, ProviderType, Topic, TopicAtom
from app.models.topic import auto_select_color, auto_select_icon
from app.services.credential_encryption import CredentialEncryption

logger = logging.getLogger(__name__)


class ExtractedTopic(BaseModel):
    """Topic extracted from messages."""

    name: str = Field(max_length=100, description="Concise topic name (2-4 words max)")
    description: str = Field(description="Clear description of the discussion theme")
    confidence: float = Field(ge=0.0, le=1.0, description="Extraction confidence (0.7+ recommended for auto-creation)")
    keywords: list[str] = Field(description="Key terms associated with this topic")
    related_message_ids: list[int] = Field(description="Source message IDs that contributed to this topic")


class ExtractedAtom(BaseModel):
    """Atom extracted from messages."""

    type: str = Field(description="Atom type: problem/solution/decision/insight/question/pattern/requirement")
    title: str = Field(max_length=200, description="Brief title summarizing the atomic knowledge unit")
    content: str = Field(description="Full self-contained content of the atom")
    confidence: float = Field(ge=0.0, le=1.0, description="Extraction confidence (0.7+ recommended for auto-creation)")
    topic_name: str = Field(description="Parent topic name this atom belongs to")
    related_message_ids: list[int] = Field(description="Source message IDs that contributed to this atom")
    links_to_atom_titles: list[str] = Field(default_factory=list, description="Titles of related atoms to link with")
    link_types: list[str] = Field(
        default_factory=list,
        description="Link relationship types: solves/supports/contradicts/continues/refines/relates_to/depends_on",
    )


class KnowledgeExtractionOutput(BaseModel):
    """Full knowledge extraction output from LLM."""

    topics: list[ExtractedTopic] = Field(description="Extracted discussion topics")
    atoms: list[ExtractedAtom] = Field(description="Extracted atomic knowledge units")


KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT = """You are a knowledge extraction expert analyzing conversation messages.

Your task is to identify:
1. TOPICS - Discussion themes, problem domains, or contexts (e.g., "API Design", "Database Migration")
2. ATOMS - Specific atomic knowledge units: problems, solutions, decisions, insights, questions, patterns, requirements

Guidelines for Topics:
- Keep names concise: 2-4 words maximum
- Each topic should represent a coherent discussion theme
- Confidence 0.7+ for auto-creation, lower for review flagging
- Extract 2-5 keywords that characterize the topic

Guidelines for Atoms:
- Each atom must be self-contained and actionable
- Title: Brief but descriptive (under 200 chars)
- Content: Complete thought that stands alone
- Type classification:
  * problem: Issues, bugs, challenges identified
  * solution: Answers, fixes, resolutions proposed
  * decision: Choices made, directions selected
  * insight: Realizations, observations, learnings
  * question: Unclear points needing clarification
  * pattern: Recurring themes, architectural patterns
  * requirement: Needs, constraints, specifications
- Confidence 0.7+ for auto-creation
- Link atoms that have relationships:
  * solves: Solution atom solves problem atom
  * supports: Atom provides evidence/reasoning for another
  * contradicts: Atom conflicts with another
  * continues: Atom builds upon another
  * refines: Atom adds detail/nuance to another
  * relates_to: General thematic connection
  * depends_on: Atom requires another as prerequisite

Quality standards:
- Avoid duplicating existing knowledge
- Only extract clear, meaningful knowledge units
- Ensure atoms are genuinely atomic (single complete thought)
- Link related atoms to build knowledge graph
- If confidence is low (<0.7), still extract but flag with lower score

Return structured output with topics and atoms."""


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
            raise Exception(f"Knowledge extraction failed: {str(e)}. Check provider configuration.") from e

    async def save_topics(
        self, extracted_topics: list[ExtractedTopic], session: AsyncSession, confidence_threshold: float = 0.7
    ) -> dict[str, Topic]:
        """Create or update topics in database.

        Args:
            extracted_topics: Topics extracted from LLM
            session: Database session
            confidence_threshold: Minimum confidence to auto-create (default: 0.7)

        Returns:
            Mapping of topic name -> Topic entity (only for topics meeting threshold)
        """
        topic_map: dict[str, Topic] = {}

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
                logger.info(f"Topic '{extracted_topic.name}' already exists (ID: {existing_topic.id}), reusing")
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
        logger.info(f"Saved {len(topic_map)} topics to database")
        return topic_map

    async def save_atoms(
        self,
        extracted_atoms: list[ExtractedAtom],
        topic_map: dict[str, Topic],
        session: AsyncSession,
        confidence_threshold: float = 0.7,
    ) -> list[Atom]:
        """Create atoms and link them to topics.

        Args:
            extracted_atoms: Atoms extracted from LLM
            topic_map: Mapping of topic names to Topic entities
            session: Database session
            confidence_threshold: Minimum confidence to auto-create (default: 0.7)

        Returns:
            List of created Atom entities
        """
        saved_atoms: list[Atom] = []

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
        logger.info(f"Saved {len(saved_atoms)} atoms to database")
        return saved_atoms

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
