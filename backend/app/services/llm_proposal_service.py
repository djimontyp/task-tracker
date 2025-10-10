"""LLM integration service for generating task proposals from message batches.

This service handles interaction with LLM providers to generate structured
task proposals from batches of messages.
"""

import logging
from datetime import datetime
from typing import List

from pydantic import BaseModel, Field
from pydantic_ai import Agent as PydanticAgent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.ollama import OllamaProvider
from pydantic_ai.providers.openai import OpenAIProvider

from app.models import AgentConfig, LLMProvider, Message, ProjectConfig, ProviderType
from app.services.credential_encryption import CredentialEncryption

logger = logging.getLogger(__name__)


class TaskProposalOutput(BaseModel):
    """Structured output from LLM for a single task proposal."""

    title: str = Field(description="Task title (50-200 chars)")
    description: str = Field(description="Task description with context")
    priority: str = Field(description="Priority: low/medium/high/critical")
    category: str = Field(description="Category: feature/bug/improvement/question/docs")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score 0-1")
    reasoning: str = Field(description="Why this is a task")
    recommendation: str = Field(
        description="Recommendation: new_task/update_existing/merge/reject"
    )
    project_name: str | None = Field(
        default=None, description="Suggested project name (if applicable)"
    )
    tags: List[str] = Field(default_factory=list, description="Relevant tags")


class BatchProposalsOutput(BaseModel):
    """Structured output containing multiple proposals from a batch."""

    proposals: List[TaskProposalOutput] = Field(
        description="List of task proposals extracted from messages"
    )


class LLMProposalService:
    """Service for generating task proposals using LLM providers.

    Uses pydantic-ai for structured output and supports multiple LLM providers
    (Ollama, OpenAI). Handles API key encryption/decryption and provider validation.
    """

    def __init__(self, agent_config: AgentConfig, provider: LLMProvider):
        """Initialize LLM proposal service.

        Args:
            agent_config: Agent configuration with system prompt and model settings
            provider: LLM provider configuration
        """
        self.agent_config = agent_config
        self.provider = provider
        self.encryptor = CredentialEncryption()

    async def generate_proposals(
        self,
        messages: List[Message],
        project_config: ProjectConfig | None = None,
    ) -> List[dict]:
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
        logger.info(
            f"Generating proposals for {len(messages)} messages "
            f"using agent '{self.agent_config.name}'"
        )

        # Build prompt from messages
        prompt = self._build_prompt(messages, project_config)

        # Get API key if needed
        api_key = None
        if self.provider.api_key_encrypted:
            try:
                api_key = self.encryptor.decrypt(self.provider.api_key_encrypted)
            except Exception as e:
                raise ValueError(
                    f"Failed to decrypt API key for provider '{self.provider.name}': {e}"
                )

        # Build model instance
        model = self._build_model_instance(api_key)

        # Create pydantic-ai agent with structured output
        agent = PydanticAgent(
            model=model,
            system_prompt=self.agent_config.system_prompt,
            result_type=BatchProposalsOutput,
        )

        # Build model settings
        model_settings = {}
        if self.agent_config.temperature is not None:
            model_settings["temperature"] = self.agent_config.temperature
        if self.agent_config.max_tokens is not None:
            model_settings["max_tokens"] = self.agent_config.max_tokens

        try:
            # Run LLM
            result = await agent.run(
                prompt,
                model_settings=model_settings if model_settings else None,
            )

            # Extract proposals
            batch_output: BatchProposalsOutput = result.output
            proposals = self._parse_proposals(batch_output.proposals, messages)

            logger.info(
                f"Generated {len(proposals)} proposals from {len(messages)} messages"
            )

            return proposals

        except Exception as e:
            logger.error(
                f"LLM request failed for agent '{self.agent_config.name}': {e}",
                exc_info=True,
            )
            raise Exception(
                f"LLM request failed: {str(e)}. "
                "Check provider configuration and connectivity."
            ) from e

    def _build_prompt(
        self,
        messages: List[Message],
        project_config: ProjectConfig | None,
    ) -> str:
        """Build LLM prompt from messages and project context.

        Args:
            messages: Messages to analyze
            project_config: Optional project configuration

        Returns:
            Formatted prompt string
        """
        # Format messages
        messages_text = "\n\n".join(
            [
                f"Message {i+1} (ID: {msg.id}, Time: {msg.sent_at}):\n{msg.content}"
                for i, msg in enumerate(messages)
            ]
        )

        # Build project context
        project_context = ""
        if project_config:
            project_context = f"""
Project Context:
- Name: {project_config.name}
- Keywords: {', '.join(project_config.keywords or [])}
- Description: {project_config.description or 'N/A'}
"""

        # Build prompt
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

    def _parse_proposals(
        self,
        llm_proposals: List[TaskProposalOutput],
        messages: List[Message],
    ) -> List[dict]:
        """Parse LLM output into proposal dictionaries.

        Args:
            llm_proposals: Structured proposals from LLM
            messages: Source messages

        Returns:
            List of proposal dictionaries
        """
        proposals = []

        for llm_prop in llm_proposals:
            # Calculate time span
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

    def _build_model_instance(self, api_key: str | None = None):
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
            raise ValueError(
                f"Unsupported provider type: {self.provider.type}. "
                "Supported types: ollama, openai"
            )
