"""LLM integration service for generating task proposals from message batches.

This service handles interaction with LLM providers to generate structured
task proposals from batches of messages.
"""

import logging

from pydantic import BaseModel, Field
from pydantic_ai import Agent as PydanticAgent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.ollama import OllamaProvider
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.settings import ModelSettings
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AgentConfig, LLMProvider, Message, ProjectConfig, ProviderType
from app.services.credential_encryption import CredentialEncryption
from app.services.rag_context_builder import RAGContext, RAGContextBuilder

logger = logging.getLogger(__name__)


class TaskProposalOutput(BaseModel):
    """Structured output from LLM for a single task proposal."""

    title: str = Field(description="Task title (50-200 chars)")
    description: str = Field(description="Task description with context")
    priority: str = Field(description="Priority: low/medium/high/critical")
    category: str = Field(description="Category: feature/bug/improvement/question/docs")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score 0-1")
    reasoning: str = Field(description="Why this is a task")
    recommendation: str = Field(description="Recommendation: new_task/update_existing/merge/reject")
    project_name: str | None = Field(default=None, description="Suggested project name (if applicable)")
    tags: list[str] = Field(default_factory=list, description="Relevant tags")


class BatchProposalsOutput(BaseModel):
    """Structured output containing multiple proposals from a batch."""

    proposals: list[TaskProposalOutput] = Field(description="List of task proposals extracted from messages")


class LLMProposalService:
    """Service for generating task proposals using LLM providers.

    Uses pydantic-ai for structured output and supports multiple LLM providers
    (Ollama, OpenAI). Handles API key encryption/decryption and provider validation.
    """

    def __init__(
        self, agent_config: AgentConfig, provider: LLMProvider, rag_context_builder: RAGContextBuilder | None = None
    ):
        """Initialize LLM proposal service.

        Args:
            agent_config: Agent configuration with system prompt and model settings
            provider: LLM provider configuration
            rag_context_builder: Optional RAG context builder for enhanced proposals
        """
        self.agent_config = agent_config
        self.provider = provider
        self.encryptor = CredentialEncryption()
        self.rag_context_builder = rag_context_builder

    async def generate_proposals(
        self,
        messages: list[Message],
        project_config: ProjectConfig | None = None,
    ) -> list[dict]:
        """Generate task proposals from message batch using LLM.

        Args:
            messages: List of messages to analyze
            project_config: Optional project configuration for classification hints

        Returns:
            List of proposal dictionaries ready for database insertion

        Raises:
            ValueError: If provider configuration is invalid
            Exception: If LLM request fails

        Example:
            >>> proposals = await service.generate_proposals(messages, project_config)
            >>> # Returns: [{"title": "...", "description": "...", ...}, ...]
        """
        logger.info(f"Generating proposals for {len(messages)} messages using agent '{self.agent_config.name}'")

        prompt = self._build_prompt(messages, project_config)

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
            output_type=BatchProposalsOutput,
        )

        model_settings_obj: ModelSettings | None = None
        if self.agent_config.temperature is not None or self.agent_config.max_tokens is not None:
            model_settings_obj = ModelSettings()
            if self.agent_config.temperature is not None:
                model_settings_obj["temperature"] = self.agent_config.temperature
            if self.agent_config.max_tokens is not None:
                model_settings_obj["max_tokens"] = self.agent_config.max_tokens

        try:
            # Run LLM
            result = await agent.run(
                prompt,
                model_settings=model_settings_obj,
            )

            batch_output: BatchProposalsOutput = result.output
            proposals = self._parse_proposals(batch_output.proposals, messages)

            logger.info(f"Generated {len(proposals)} proposals from {len(messages)} messages")

            return proposals

        except Exception as e:
            logger.error(
                f"LLM request failed for agent '{self.agent_config.name}': {e}",
                exc_info=True,
            )
            raise Exception(f"LLM request failed: {str(e)}. Check provider configuration and connectivity.") from e

    async def generate_proposals_with_rag(
        self,
        session: AsyncSession,
        messages: list[Message],
        project_config: ProjectConfig | None = None,
        use_rag: bool = True,
    ) -> list[dict]:
        """Generate task proposals with RAG (Retrieval-Augmented Generation) context.

        Enhances proposal generation by retrieving and injecting relevant historical
        context from past proposals, knowledge base atoms, and related messages.

        Flow:
        1. Build RAG context if enabled
        2. Inject context into prompt
        3. Generate proposals with enhanced context
        4. Return proposals

        Args:
            session: Database session for RAG queries
            messages: List of messages to analyze
            project_config: Optional project configuration for classification hints
            use_rag: Enable RAG context retrieval (default: True)

        Returns:
            List of proposal dictionaries ready for database insertion

        Raises:
            ValueError: If provider configuration is invalid or RAG builder not initialized
            Exception: If LLM request fails

        Example:
            >>> service = LLMProposalService(agent, provider, rag_builder)
            >>> proposals = await service.generate_proposals_with_rag(session, messages, project_config, use_rag=True)
            >>> # Returns enhanced proposals with historical context
        """
        if use_rag and not self.rag_context_builder:
            raise ValueError("RAG context builder not initialized. Cannot use RAG mode.")

        logger.info(
            f"Generating proposals for {len(messages)} messages using agent '{self.agent_config.name}' "
            f"(RAG: {'enabled' if use_rag else 'disabled'})"
        )

        rag_context: RAGContext | None = None
        if use_rag and self.rag_context_builder:
            try:
                rag_context = await self.rag_context_builder.build_context(session, messages, top_k=5)
                logger.info(f"Built RAG context: {rag_context['context_summary']}")
            except Exception as e:
                logger.error(f"Failed to build RAG context: {e}. Falling back to standard generation.")
                rag_context = None

        prompt = self._build_prompt_with_rag(messages, project_config, rag_context)

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
            output_type=BatchProposalsOutput,
        )

        model_settings_obj: ModelSettings | None = None
        if self.agent_config.temperature is not None or self.agent_config.max_tokens is not None:
            model_settings_obj = ModelSettings()
            if self.agent_config.temperature is not None:
                model_settings_obj["temperature"] = self.agent_config.temperature
            if self.agent_config.max_tokens is not None:
                model_settings_obj["max_tokens"] = self.agent_config.max_tokens

        try:
            result = await agent.run(
                prompt,
                model_settings=model_settings_obj,
            )

            batch_output: BatchProposalsOutput = result.output
            proposals = self._parse_proposals(batch_output.proposals, messages)

            logger.info(
                f"Generated {len(proposals)} proposals from {len(messages)} messages "
                f"(with RAG: {'yes' if rag_context else 'no'})"
            )

            return proposals

        except Exception as e:
            logger.error(
                f"LLM request failed for agent '{self.agent_config.name}': {e}",
                exc_info=True,
            )
            raise Exception(f"LLM request failed: {str(e)}. Check provider configuration and connectivity.") from e

    def _build_prompt(
        self,
        messages: list[Message],
        project_config: ProjectConfig | None,
    ) -> str:
        """Build LLM prompt from messages and project context.

        Args:
            messages: Messages to analyze
            project_config: Optional project configuration

        Returns:
            Formatted prompt string
        """
        messages_text = "\n\n".join([
            f"Message {i + 1} (ID: {msg.id}, Time: {msg.sent_at}):\n{msg.content}" for i, msg in enumerate(messages)
        ])

        project_context = ""
        if project_config:
            project_context = f"""
Project Context:
- Name: {project_config.name}
- Keywords: {", ".join(project_config.keywords or [])}
- Description: {project_config.description or "N/A"}
"""

        prompt = f"""
Analyze the following messages and extract actionable task proposals.

{project_context}

Messages to Analyze:
{messages_text}

Instructions:
1. Group related messages into coherent tasks
2. Extract clear task titles and descriptions
3. Assign priority based on urgency and impact
4. Categorize as feature/bug/improvement/question/docs
5. Provide confidence score (0.0-1.0) for each proposal
6. Explain your reasoning
7. Recommend action: new_task/update_existing/merge/reject

Return a structured list of task proposals.
"""
        return prompt

    def _build_prompt_with_rag(
        self,
        messages: list[Message],
        project_config: ProjectConfig | None,
        rag_context: RAGContext | None,
    ) -> str:
        """Build LLM prompt with optional RAG context injection.

        Creates an enhanced prompt that includes historical context from past
        proposals, knowledge base items, and related messages when available.

        Args:
            messages: Messages to analyze
            project_config: Optional project configuration
            rag_context: Optional RAG context with historical data

        Returns:
            Formatted prompt string with RAG context (if available)
        """
        prompt_parts = []

        if rag_context:
            context_text = self.rag_context_builder.format_context(rag_context) if self.rag_context_builder else ""
            if context_text:
                prompt_parts.append(context_text)
                prompt_parts.append("\n---\n")

        prompt_parts.append("## Current Messages to Analyze\n")
        for i, msg in enumerate(messages):
            prompt_parts.append(f"Message {i + 1} (ID: {msg.id}, Time: {msg.sent_at}):\n{msg.content}\n")

        prompt_parts.append("\n## Instructions")

        if rag_context:
            prompt_parts.append(
                "\nConsider the past context above when generating proposals. "
                "Look for patterns, similar issues, and relevant knowledge from previous work. "
                "Avoid duplicating existing proposals unless there's significant new information.\n"
            )

        prompt_parts.append(
            "\n1. Group related messages into coherent tasks\n"
            "2. Extract clear task titles and descriptions\n"
            "3. Assign priority based on urgency and impact\n"
            "4. Categorize as feature/bug/improvement/question/docs\n"
            "5. Provide confidence score (0.0-1.0) for each proposal\n"
            "6. Explain your reasoning\n"
            "7. Recommend action: new_task/update_existing/merge/reject\n"
        )

        if project_config:
            prompt_parts.append(f"\nProject Context:\n")
            prompt_parts.append(f"- Name: {project_config.name}\n")
            prompt_parts.append(f"- Keywords: {', '.join(project_config.keywords or [])}\n")
            if project_config.description:
                prompt_parts.append(f"- Description: {project_config.description}\n")

        prompt_parts.append("\nReturn a structured list of task proposals.")

        return "".join(prompt_parts)

    def _parse_proposals(
        self,
        llm_proposals: list[TaskProposalOutput],
        messages: list[Message],
    ) -> list[dict]:
        """Parse LLM output into proposal dictionaries.

        Args:
            llm_proposals: Structured proposals from LLM
            messages: Source messages

        Returns:
            List of proposal dictionaries
        """
        proposals = []

        for llm_prop in llm_proposals:
            if len(messages) > 1:
                first_time = min(msg.sent_at for msg in messages)
                last_time = max(msg.sent_at for msg in messages)
                time_span_seconds = int((last_time - first_time).total_seconds())
            else:
                time_span_seconds = 0

            proposal = {
                "proposed_title": llm_prop.title,
                "proposed_description": llm_prop.description,
                "proposed_priority": llm_prop.priority,
                "proposed_category": llm_prop.category,
                "proposed_tags": llm_prop.tags,
                "source_message_ids": [msg.id for msg in messages],
                "message_count": len(messages),
                "time_span_seconds": time_span_seconds,
                "llm_recommendation": llm_prop.recommendation,
                "confidence": llm_prop.confidence,
                "reasoning": llm_prop.reasoning,
            }

            proposals.append(proposal)

        return proposals

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
            # For Ollama, create provider with base_url
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
            # For OpenAI, create provider with API key
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
