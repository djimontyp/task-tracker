"""Provider Resolver - Resolves LLM providers from DB with fallback to settings."""

import logging
from uuid import UUID

from core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession

from app.llm.domain.exceptions import ProviderNotFoundError
from app.models import LLMProvider, ProviderType
from app.services.provider_crud import ProviderCRUD

logger = logging.getLogger(__name__)


class ProviderResolver:
    """Resolves LLM providers from multiple sources with fallback.

    Resolution chain:
    1. Database (by name or ID) - user-configured providers
    2. Settings fallback - default Ollama from config
    3. Raise ProviderNotFoundError if nothing found

    This allows:
    - User to configure providers in DB (production)
    - Fallback to settings during development
    - Clear error if no provider available
    """

    def __init__(self, crud: ProviderCRUD):
        """Initialize resolver.

        Args:
            crud: Provider CRUD instance for database access
        """
        self.crud = crud

    async def resolve(
        self,
        session: AsyncSession,
        provider_name: str | None = None,
        provider_id: UUID | None = None,
    ) -> LLMProvider:
        """Resolve provider from name or ID with fallback.

        Args:
            session: Database session
            provider_name: Provider name to look up
            provider_id: Provider UUID to look up

        Returns:
            LLMProvider from DB or settings fallback

        Raises:
            ProviderNotFoundError: If no provider found in DB or settings

        Examples:
            provider = await resolver.resolve(session, provider_name="Ollama Local")

            provider = await resolver.resolve(session, provider_id=uuid)

            provider = await resolver.resolve(session)
        """
        if provider_id:
            db_provider_data = await self.crud.get(provider_id)
            if db_provider_data:
                db_provider = await session.get(LLMProvider, provider_id)
                if db_provider:
                    logger.info(f"Resolved provider by ID: {db_provider.name}")
                    return db_provider

        if provider_name:
            db_provider_data = await self.crud.get_by_name(provider_name)
            if db_provider_data:
                db_provider = await session.get(LLMProvider, db_provider_data.id)
                if db_provider:
                    logger.info(f"Resolved provider by name: {db_provider.name}")
                    return db_provider

        logger.info("No provider in DB, falling back to settings")
        return self._create_settings_fallback_provider()

    async def resolve_active(
        self,
        session: AsyncSession,
        provider_type: ProviderType | None = None,
    ) -> LLMProvider:
        """Get first active provider of given type.

        Args:
            session: Database session
            provider_type: Filter by provider type (ollama, openai)

        Returns:
            First active provider

        Raises:
            ProviderNotFoundError: If no active providers found
        """
        providers_data = await self.crud.list(active_only=True)

        if provider_type:
            providers_data = [p for p in providers_data if p.type == provider_type]

        if not providers_data:
            type_filter = f" of type '{provider_type}'" if provider_type else ""
            logger.warning(f"No active providers{type_filter}, falling back to settings")
            return self._create_settings_fallback_provider()

        provider_data = providers_data[0]
        db_provider = await session.get(LLMProvider, provider_data.id)
        if db_provider:
            logger.info(f"Resolved active provider: {db_provider.name}")
            return db_provider

        return self._create_settings_fallback_provider()

    def _create_settings_fallback_provider(self) -> LLMProvider:
        """Create provider from settings fallback.

        Uses ollama_base_url or ollama_base_url_docker based on environment.

        Returns:
            LLMProvider instance from settings

        Raises:
            ProviderNotFoundError: If settings don't have valid provider config
        """
        if settings.llm.running_in_docker:
            base_url = settings.llm.ollama_base_url_docker
        else:
            base_url = settings.llm.ollama_base_url

        if not base_url:
            raise ProviderNotFoundError("No providers in database and settings don't have ollama_base_url configured")

        provider = LLMProvider(
            name="Settings Fallback (Ollama)",
            type=ProviderType.ollama,
            base_url=base_url,
            is_active=True,
        )

        logger.info(f"Created settings fallback provider: {provider.name} at {base_url}")
        return provider
