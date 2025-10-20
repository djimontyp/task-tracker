"""Agent factory functions using new LLM hexagonal architecture.

This module provides factory functions to create specialized agents
using the new LLM service architecture.

Migration from legacy:
    OLD: result = agent_classification.run_sync(text)
    NEW: agent = await create_classification_agent(session)
         result = await agent.run(text)
"""

from sqlmodel.ext.asyncio.session import AsyncSession

from app.llm.application.llm_service import LLMService
from app.llm.domain.models import AgentConfig
from app.llm.domain.ports import LLMAgent
from app.llm.startup import create_llm_service
from app.schemas import EntityExtraction, EntityStructured, TextClassification
from core.config import settings


async def create_classification_agent(
    session: AsyncSession,
    provider_name: str | None = None,
) -> LLMAgent[TextClassification]:
    """Create text classification agent.

    Classifies messages to determine if they represent tasks/issues
    and assigns category and priority.

    Args:
        session: Database session
        provider_name: Optional provider name (uses default if None)

    Returns:
        Configured agent for text classification

    Example:
        agent = await create_classification_agent(session)
        result = await agent.run("Message text...")
        print(result.output.category, result.output.priority)
    """
    service: LLMService = create_llm_service(session)

    config = AgentConfig(
        name="classification",
        model_name=settings.llm.ollama_model,
        system_prompt="""
        Ві є експертом з класифікації повідомлень. Ваше завдання - визначити, чи є повідомлення
        описом задачі/проблеми, і якщо так, то визначити категорію та пріоритет.
        Ми цінуєм наших користувачів, задоволений користувач - стабільний дохід.
        """,
        output_type=TextClassification,
    )

    return await service.create_agent(session, config, provider_name=provider_name)


async def create_extraction_agent(
    session: AsyncSession,
    provider_name: str | None = None,
) -> LLMAgent[EntityExtraction]:
    """Create entity extraction agent.

    Extracts structured entities from messages (projects, components,
    technologies, mentions, dates, versions).

    Args:
        session: Database session
        provider_name: Optional provider name (uses default if None)

    Returns:
        Configured agent for entity extraction

    Example:
        agent = await create_extraction_agent(session)
        result = await agent.run("Message text...")
        print(result.output.components, result.output.technologies)
    """
    service: LLMService = create_llm_service(session)

    config = AgentConfig(
        name="extraction",
        model_name=settings.llm.ollama_model,
        system_prompt="""
        Ві є експертом з видобування сутностей з тексту. Ваше завдання - визначити
        всі важливі сутності з повідомлення
        """,
        output_type=EntityExtraction,
    )

    return await service.create_agent(session, config, provider_name=provider_name)


async def create_analysis_agent(
    session: AsyncSession,
    provider_name: str | None = None,
) -> LLMAgent[EntityStructured]:
    """Create message analysis agent.

    Analyzes messages and provides structured notes that can help
    with further processing.

    Args:
        session: Database session
        provider_name: Optional provider name (uses default if None)

    Returns:
        Configured agent for message analysis

    Example:
        agent = await create_analysis_agent(session)
        result = await agent.run("Message text...")
        print(result.output.short)
    """
    service: LLMService = create_llm_service(session)

    config = AgentConfig(
        name="analysis",
        model_name=settings.llm.ollama_model,
        system_prompt="""
        Ві є експертом з аналізу повідомлень. Ваше завдання - надати примітки щодо повідомлення,
        які можуть допомогти в подальшій обробці.
        """,
        output_type=EntityStructured,
        temperature=0.95,
    )

    return await service.create_agent(session, config, provider_name=provider_name)


if __name__ == "__main__":
    import asyncio
    from rich.pretty import pprint

    from app.database import AsyncSessionLocal

    async def test_agents() -> None:
        """Test agent factory functions."""
        problem1 = """
        Взагалі, адмінка, там де створення користувача, надання доступів,
        зміна паролів, вантажить дуже повільно, я 2 год потратила
        на надання доступів 15 користувачам, це не ок @Sucre_91
        """

        async with AsyncSessionLocal() as session:
            classification_agent = await create_classification_agent(session)  # type: ignore[arg-type]
            extraction_agent = await create_extraction_agent(session)  # type: ignore[arg-type]
            analysis_agent = await create_analysis_agent(session)  # type: ignore[arg-type]

            classification1 = await classification_agent.run(problem1)
            extraction1 = await extraction_agent.run(problem1)
            analysis1 = await analysis_agent.run(problem1)

            pprint([classification1, extraction1, analysis1])

            problem2 = """
            якщо 2-3 репліки робити (для надійності щоб меседжі не вєбались
            випадково/робота продовжилась іф один брокер відєбне)
            то до 100 доларів буде шо то шо ето
            """

            classification2 = await classification_agent.run(problem2)
            extraction2 = await extraction_agent.run(problem2)
            analysis2 = await analysis_agent.run(problem2)

            pprint([classification2, extraction2, analysis2])

    asyncio.run(test_agents())
