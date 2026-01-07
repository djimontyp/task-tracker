"""Agent testing service with LLM integration.

Provides functionality to test agent configurations with custom prompts
using pydantic-ai for structured LLM interactions.
"""

import logging
import time
from uuid import UUID

from pydantic_ai import Agent as PydanticAgent, PromptedOutput
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.settings import ModelSettings
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.v1.schemas.agent import AgentTestResponse
from app.models import AgentConfig, LLMProvider, ProviderType, ValidationStatus
from app.models.project_config import ProjectConfig
from app.services.credential_encryption import CredentialEncryption
from app.services.knowledge.knowledge_schemas import KnowledgeExtractionOutput
from app.services.knowledge.llm_agents import KNOWLEDGE_EXTRACTION_PROMPT_UK

logger = logging.getLogger(__name__)


def compose_prompt(
    base: str,
    project_context: str | None = None,
    custom: str | None = None,
) -> str:
    """Compose final system prompt from base, project context, and custom instructions.

    The composition follows a layered approach:
    1. Base prompt - read-only template with JSON schema and rules
    2. Project context - domain keywords, glossary, components (injected dynamically)
    3. Custom instructions - user-defined agent-specific instructions

    Args:
        base: Base prompt with JSON schema and extraction rules (required)
        project_context: Optional project-specific context (keywords, glossary, etc.)
        custom: Optional custom agent instructions from user

    Returns:
        Composed system prompt string

    Example:
        >>> prompt = compose_prompt(
        ...     base=KNOWLEDGE_EXTRACTION_PROMPT_UK,
        ...     project_context="Keywords: python, fastapi\\nGlossary: API - ...",
        ...     custom="Focus on security-related topics"
        ... )
    """
    sections: list[str] = [base]

    if project_context:
        sections.append(f"\n---\n\n## Project Context\n\n{project_context}")

    if custom:
        sections.append(f"\n---\n\n## Additional Instructions\n\n{custom}")

    return "\n".join(sections)


def merge_project_contexts(projects: list[ProjectConfig]) -> str:
    """Merge keywords, glossary, and components from multiple projects.

    Combines context from all linked projects into a single formatted string
    suitable for injection into LLM prompts via compose_prompt().

    Deduplication rules:
    - Keywords: case-insensitive deduplication, preserves original casing
    - Glossary: later projects override earlier ones for same term
    - Components: deduped by name, keywords merged

    Args:
        projects: List of ProjectConfig instances to merge

    Returns:
        Formatted context string with Keywords, Glossary, and Components sections.
        Returns empty string if projects list is empty.

    Example:
        >>> projects = [project_backend, project_frontend]
        >>> context = merge_project_contexts(projects)
        >>> prompt = compose_prompt(base=BASE_PROMPT, project_context=context)
    """
    if not projects:
        return ""

    # Collect all keywords (case-insensitive dedup, preserve original case)
    seen_keywords_lower: set[str] = set()
    merged_keywords: list[str] = []
    for project in projects:
        for kw in project.keywords:
            kw_lower = kw.lower()
            if kw_lower not in seen_keywords_lower:
                seen_keywords_lower.add(kw_lower)
                merged_keywords.append(kw)

    # Merge glossaries (later projects override earlier for same term)
    merged_glossary: dict[str, str] = {}
    for project in projects:
        if project.glossary:
            merged_glossary.update(project.glossary)

    # Merge components (dedup by name, merge keywords)
    components_by_name: dict[str, set[str]] = {}
    for project in projects:
        if project.components:
            for comp in project.components:
                name = comp.get("name", "")
                if not name:
                    continue
                if name not in components_by_name:
                    components_by_name[name] = set()
                comp_keywords = comp.get("keywords", [])
                if isinstance(comp_keywords, list):
                    components_by_name[name].update(comp_keywords)

    # Format output sections
    sections: list[str] = []

    # Keywords section
    if merged_keywords:
        sections.append(f"## Keywords\n{', '.join(merged_keywords)}")

    # Glossary section
    if merged_glossary:
        glossary_lines = [f"- **{term}**: {definition}" for term, definition in merged_glossary.items()]
        sections.append(f"## Glossary\n{chr(10).join(glossary_lines)}")

    # Components section
    if components_by_name:
        component_lines = []
        for name, keywords in components_by_name.items():
            if keywords:
                component_lines.append(f"- **{name}**: {', '.join(sorted(keywords))}")
            else:
                component_lines.append(f"- **{name}**")
        sections.append(f"## Components\n{chr(10).join(component_lines)}")

    return "\n\n".join(sections)


class AgentTestService:
    """Service for testing agent configurations with LLM providers."""

    def __init__(self, session: AsyncSession):
        """Initialize the agent test service.

        Args:
            session: Async database session
        """
        self.session = session
        self.encryptor = CredentialEncryption()

    async def test_agent(self, agent_id: UUID, test_prompt: str) -> AgentTestResponse:
        """Test an agent configuration with a custom prompt.

        Args:
            agent_id: UUID of the agent to test
            test_prompt: Prompt to send to the LLM

        Returns:
            Test response with LLM output and metadata

        Raises:
            ValueError: If agent not found, provider not found, or validation failed
            Exception: If LLM request fails
        """
        agent = await self.session.get(AgentConfig, agent_id)
        if not agent:
            raise ValueError(f"Agent with ID '{agent_id}' not found")

        provider = await self.session.get(LLMProvider, agent.provider_id)
        if not provider:
            raise ValueError(f"Provider with ID '{agent.provider_id}' not found. Agent configuration is invalid.")

        # Verify provider is validated and active
        if not provider.is_active:
            raise ValueError(f"Provider '{provider.name}' is inactive. Please activate the provider before testing.")

        if provider.validation_status != ValidationStatus.connected:
            raise ValueError(
                f"Provider '{provider.name}' is not validated "
                f"(status: {provider.validation_status}). "
                "Please validate the provider before testing."
            )

        api_key = None
        if provider.api_key_encrypted:
            try:
                api_key = self.encryptor.decrypt(provider.api_key_encrypted)
            except Exception as e:
                raise ValueError(f"Failed to decrypt API key for provider '{provider.name}': {e}")

        model = self._build_model_instance(provider, agent.model_name, api_key)

        # Compose system prompt: base + project_context + custom
        # project_context is None for now (will be added when M:N relation is ready)
        system_prompt = compose_prompt(
            base=KNOWLEDGE_EXTRACTION_PROMPT_UK,
            project_context=None,  # TODO: inject from agent.projects when M:N ready
            custom=agent.system_prompt,
        )

        start_time = time.time()

        try:
            # Use PromptedOutput for Ollama to avoid Python repr parsing issues
            # Ollama models work better with prompted mode than tool-based structured output
            if provider.type == ProviderType.ollama:
                logger.debug(
                    f"Using PromptedOutput for Ollama provider '{provider.name}' "
                    f"to ensure reliable JSON parsing"
                )
                pydantic_agent = PydanticAgent(
                    model=model,
                    system_prompt=system_prompt,
                    output_type=PromptedOutput(KnowledgeExtractionOutput),
                    output_retries=5,
                )
            else:
                pydantic_agent = PydanticAgent(
                    model=model,
                    system_prompt=system_prompt,
                    output_type=KnowledgeExtractionOutput,
                    output_retries=5,
                )

            # Build model settings
            model_settings_obj: ModelSettings | None = None
            if agent.temperature is not None or agent.max_tokens is not None:
                model_settings_obj = {}
                if agent.temperature is not None:
                    model_settings_obj["temperature"] = agent.temperature
                if agent.max_tokens is not None:
                    model_settings_obj["max_tokens"] = agent.max_tokens

            # Run the agent
            result = await pydantic_agent.run(
                test_prompt,
                model_settings=model_settings_obj,
            )

            elapsed_time = time.time() - start_time

            # Extract response text as proper JSON
            response_text = result.output.model_dump_json()

            logger.info(f"Successfully tested agent '{agent.name}' (elapsed: {elapsed_time:.2f}s)")

            return AgentTestResponse(
                agent_id=agent.id,
                agent_name=agent.name,
                prompt=test_prompt,
                response=response_text,
                elapsed_time=elapsed_time,
                model_name=agent.model_name,
                provider_name=provider.name,
                provider_type=provider.type.value,
            )

        except Exception as e:
            elapsed_time = time.time() - start_time
            logger.error(
                f"Agent test failed for '{agent.name}' after {elapsed_time:.2f}s: {e}",
                exc_info=True,
            )
            raise Exception(f"LLM request failed: {str(e)}. Check provider configuration and connectivity.") from e

    def _build_model_instance(
        self,
        provider: LLMProvider,
        model_name: str,
        api_key: str | None = None,
    ) -> OpenAIChatModel:
        """Build pydantic-ai model instance from provider configuration.

        Args:
            provider: LLM provider configuration
            model_name: Name of the model to use
            api_key: Decrypted API key (if required)

        Returns:
            Configured model instance for pydantic-ai

        Raises:
            ValueError: If provider type is unsupported
        """
        from pydantic_ai.models.openai import OpenAIChatModel
        from pydantic_ai.providers.ollama import OllamaProvider
        from pydantic_ai.providers.openai import OpenAIProvider

        if provider.type == ProviderType.ollama:
            # For Ollama, create provider with base_url
            if not provider.base_url:
                raise ValueError(
                    f"Provider '{provider.name}' is missing base_url. "
                    "Ollama providers require a base_url configuration."
                )

            ollama_provider = OllamaProvider(base_url=provider.base_url)
            return OpenAIChatModel(
                model_name=model_name,
                provider=ollama_provider,
            )

        elif provider.type == ProviderType.openai:
            # For OpenAI, create provider with API key
            if not api_key:
                raise ValueError(
                    f"Provider '{provider.name}' requires an API key. OpenAI providers must have an API key configured."
                )

            openai_provider = OpenAIProvider(api_key=api_key)
            return OpenAIChatModel(
                model_name=model_name,
                provider=openai_provider,
            )

        else:
            raise ValueError(f"Unsupported provider type: {provider.type}. Supported types: ollama, openai")
