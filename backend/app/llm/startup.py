"""LLM startup initialization - registers frameworks on app startup."""

import logging

from sqlmodel.ext.asyncio.session import AsyncSession

from app.llm.application.framework_registry import FrameworkRegistry
from app.llm.application.llm_service import LLMService
from app.llm.application.provider_resolver import ProviderResolver
from app.llm.infrastructure.adapters.pydantic_ai import PydanticAIFramework
from app.services.provider_crud import ProviderCRUD

logger = logging.getLogger(__name__)


def initialize_llm_system() -> None:
    """Initialize LLM system on application startup.

    Registers available frameworks and sets defaults.
    Should be called from app startup (lifespan or startup event).

    This function is idempotent - safe to call multiple times.
    """
    logger.info("Initializing LLM system...")

    pydantic_framework = PydanticAIFramework()
    FrameworkRegistry.register("pydantic_ai", pydantic_framework)
    FrameworkRegistry.set_default("pydantic_ai")

    logger.info("✅ LLM system initialized - framework: pydantic_ai")


def create_llm_service(session: AsyncSession) -> LLMService:
    """Factory function to create LLMService instance.

    Args:
        session: Database session for provider resolution

    Returns:
        Configured LLMService ready for use

    Usage:
        async with AsyncSessionLocal() as session:
            service = create_llm_service(session)
            agent = await service.create_agent(session, config)
    """
    provider_crud = ProviderCRUD(session)
    provider_resolver = ProviderResolver(provider_crud)

    return LLMService(
        provider_resolver=provider_resolver,
        framework_name="pydantic_ai",
    )
