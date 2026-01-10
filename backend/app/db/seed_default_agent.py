"""Seed default system agents on application startup.

This module ensures that system agents exist in the database:
- knowledge_extractor: Extracts topics and atoms from messages
- importance_scorer: Scores message importance for triage

Creates agents with default Ollama provider if not present.
"""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AgentConfig, AgentType, LLMProvider, ProviderType, ValidationStatus
from app.services.knowledge.llm_agents import KNOWLEDGE_EXTRACTION_PROMPT_UK

logger = logging.getLogger(__name__)

# Provider defaults
DEFAULT_PROVIDER_NAME = "Default Ollama"
DEFAULT_MODEL_NAME = "llama3.2"
DEFAULT_OLLAMA_BASE_URL = "http://host.docker.internal:11434/v1"

# Agent names
KNOWLEDGE_EXTRACTOR_AGENT_NAME = "knowledge_extractor"
IMPORTANCE_SCORER_AGENT_NAME = "importance_scorer"

# System prompt for importance scorer (from LLMImportanceScorer)
IMPORTANCE_SCORER_SYSTEM_PROMPT = (
    "You are an expert Data Triage Judge for a DevOps/Engineering team. "
    "Your task is to rate the 'Knowledge Value' of chat messages.\n"
    "High Value (0.8-1.0): Bug reports, architectural decisions, incidents, technical insights, 'how-to' guides.\n"
    "Medium Value (0.4-0.7): Status updates, coordination, clarifications.\n"
    "Low Value (0.0-0.3): Social chatter, 'ok/thanks', logistical noise, scheduling.\n\n"
    "IMPORTANT: \n"
    "- Ignore language (support Ukrainian/English).\n"
    "- Ignore date/time.\n"
    "- Focus on SUBSTANCE and ACTIONABILITY."
)


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


async def _create_or_update_system_agent(
    session: AsyncSession,
    name: str,
    description: str,
    system_prompt: str,
    temperature: float,
    provider: LLMProvider,
) -> AgentConfig | None:
    """Create or update a system agent.

    If agent exists but is not marked as system, updates it.
    If agent doesn't exist, creates it as system agent.

    Args:
        session: Database session
        name: Agent name (unique identifier)
        description: Agent description
        system_prompt: System prompt for the agent
        temperature: Model temperature
        provider: LLM provider to use

    Returns:
        AgentConfig instance or None if no changes needed
    """
    result = await session.execute(
        select(AgentConfig).where(AgentConfig.name == name)  # type: ignore[arg-type]
    )
    existing_agent = result.scalars().first()

    if existing_agent:
        # Check if we need to upgrade to system agent
        needs_update = (
            existing_agent.agent_type != AgentType.system
            or not existing_agent.is_system_prompt_locked
            or not existing_agent.is_output_schema_locked
        )

        if needs_update:
            logger.info(f"Upgrading agent '{name}' to system agent")
            existing_agent.agent_type = AgentType.system
            existing_agent.is_system_prompt_locked = True
            existing_agent.is_output_schema_locked = True
            await session.commit()
            logger.info(f"Agent '{name}' upgraded to system agent (id={existing_agent.id})")
            return existing_agent

        logger.debug(f"Agent '{name}' already exists as system agent (id={existing_agent.id})")
        return None

    # Create new system agent
    logger.info(f"Creating system agent: {name}")
    agent = AgentConfig(
        name=name,
        description=description,
        provider_id=provider.id,
        model_name=DEFAULT_MODEL_NAME,
        system_prompt=system_prompt,
        temperature=temperature,
        is_active=True,
        agent_type=AgentType.system,
        is_system_prompt_locked=True,
        is_output_schema_locked=True,
    )
    session.add(agent)
    await session.commit()

    logger.info(f"Created system agent '{name}' (id={agent.id})")
    return agent


async def seed_default_knowledge_extractor(session: AsyncSession) -> AgentConfig | None:
    """Seed default knowledge_extractor agent if not exists.

    Creates the agent with Ukrainian system prompt and default settings.
    Requires an active Ollama provider to exist or creates one.

    Args:
        session: Database session

    Returns:
        AgentConfig instance or None if already exists or creation failed
    """
    provider = await get_or_create_default_provider(session)
    if not provider:
        logger.error("Cannot create knowledge_extractor: no provider available")
        return None

    return await _create_or_update_system_agent(
        session=session,
        name=KNOWLEDGE_EXTRACTOR_AGENT_NAME,
        description="System agent for extracting topics and atoms from messages",
        system_prompt=KNOWLEDGE_EXTRACTION_PROMPT_UK,
        temperature=0.3,
        provider=provider,
    )


async def seed_importance_scorer(session: AsyncSession) -> AgentConfig | None:
    """Seed importance_scorer system agent if not exists.

    Creates the agent for scoring message importance.
    Requires an active Ollama provider to exist or creates one.

    Args:
        session: Database session

    Returns:
        AgentConfig instance or None if already exists or creation failed
    """
    provider = await get_or_create_default_provider(session)
    if not provider:
        logger.error("Cannot create importance_scorer: no provider available")
        return None

    return await _create_or_update_system_agent(
        session=session,
        name=IMPORTANCE_SCORER_AGENT_NAME,
        description="System agent for scoring message importance and triage",
        system_prompt=IMPORTANCE_SCORER_SYSTEM_PROMPT,
        temperature=0.0,
        provider=provider,
    )


async def seed_all_system_agents(session: AsyncSession) -> list[AgentConfig]:
    """Seed all system agents.

    Convenience function to seed all required system agents at once.

    Args:
        session: Database session

    Returns:
        List of created/updated AgentConfig instances
    """
    agents: list[AgentConfig] = []

    knowledge_extractor = await seed_default_knowledge_extractor(session)
    if knowledge_extractor:
        agents.append(knowledge_extractor)

    importance_scorer = await seed_importance_scorer(session)
    if importance_scorer:
        agents.append(importance_scorer)

    if agents:
        logger.info(f"Seeded {len(agents)} system agent(s)")
    else:
        logger.debug("All system agents already exist")

    return agents
