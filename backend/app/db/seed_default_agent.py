"""Seed default knowledge_extractor agent on application startup.

This module ensures that the knowledge_extractor agent exists in the database.
It creates the agent with default Ollama provider if not present.
"""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AgentConfig, LLMProvider, ProviderType, ValidationStatus
from app.services.knowledge.llm_agents import KNOWLEDGE_EXTRACTION_PROMPT_UK

logger = logging.getLogger(__name__)

DEFAULT_AGENT_NAME = "knowledge_extractor"
DEFAULT_PROVIDER_NAME = "Default Ollama"
DEFAULT_MODEL_NAME = "llama3.2"
DEFAULT_OLLAMA_BASE_URL = "http://host.docker.internal:11434/v1"


async def get_or_create_default_provider(session: AsyncSession) -> LLMProvider | None:
    """Get existing Ollama provider or create default one.

    Looks for any active Ollama provider. If none exists, creates a default one.

    Args:
        session: Database session

    Returns:
        LLMProvider instance or None if creation failed
    """
    # First, try to find any active Ollama provider
    result = await session.execute(
        select(LLMProvider).where(
            LLMProvider.type == ProviderType.ollama,  # type: ignore[arg-type]
            LLMProvider.is_active == True,  # type: ignore[arg-type]  # noqa: E712
        )
    )
    provider = result.scalars().first()

    if provider:
        logger.debug(f"Found existing Ollama provider: {provider.name}")
        return provider

    # Create default Ollama provider
    logger.info(f"Creating default Ollama provider: {DEFAULT_PROVIDER_NAME}")
    provider = LLMProvider(
        name=DEFAULT_PROVIDER_NAME,
        type=ProviderType.ollama,
        base_url=DEFAULT_OLLAMA_BASE_URL,
        is_active=True,
        validation_status=ValidationStatus.pending,
    )
    session.add(provider)
    await session.flush()
    logger.info(f"Created default provider with id={provider.id}")
    return provider


async def seed_default_knowledge_extractor(session: AsyncSession) -> AgentConfig | None:
    """Seed default knowledge_extractor agent if not exists.

    Creates the agent with Ukrainian system prompt and default settings.
    Requires an active Ollama provider to exist or creates one.

    Args:
        session: Database session

    Returns:
        AgentConfig instance or None if already exists or creation failed
    """
    # Check if agent already exists
    result = await session.execute(
        select(AgentConfig).where(AgentConfig.name == DEFAULT_AGENT_NAME)  # type: ignore[arg-type]
    )
    existing_agent = result.scalars().first()

    if existing_agent:
        logger.debug(f"Agent '{DEFAULT_AGENT_NAME}' already exists (id={existing_agent.id})")
        return None

    # Get or create default provider
    provider = await get_or_create_default_provider(session)
    if not provider:
        logger.error("Cannot create default agent: no provider available")
        return None

    # Create default knowledge extractor agent
    logger.info(f"Creating default agent: {DEFAULT_AGENT_NAME}")
    agent = AgentConfig(
        name=DEFAULT_AGENT_NAME,
        description="Default knowledge extraction agent for processing messages and extracting topics/atoms",
        provider_id=provider.id,
        model_name=DEFAULT_MODEL_NAME,
        system_prompt=KNOWLEDGE_EXTRACTION_PROMPT_UK,
        temperature=0.3,
        is_active=True,
    )
    session.add(agent)
    await session.commit()

    logger.info(f"Created default agent '{DEFAULT_AGENT_NAME}' (id={agent.id})")
    return agent
