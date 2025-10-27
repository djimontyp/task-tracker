"""Integration tests for provider resolution with database."""

from unittest.mock import patch

import pytest
from app.llm.application.provider_resolver import ProviderResolver
from app.llm.domain.exceptions import ProviderNotFoundError
from app.models import LLMProvider, ProviderType
from app.services.provider_crud import ProviderCRUD
from sqlalchemy.ext.asyncio import AsyncSession


class TestProviderResolutionIntegration:
    """Integration tests for provider resolution."""

    @pytest.mark.asyncio
    async def test_resolve_provider_from_database(
        self,
        db_session: AsyncSession,
        db_ollama_provider: LLMProvider,
        provider_resolver: ProviderResolver,
    ):
        result = await provider_resolver.resolve(
            db_session,
            provider_name=db_ollama_provider.name,
        )

        assert result.id == db_ollama_provider.id
        assert result.name == db_ollama_provider.name
        assert result.type == ProviderType.ollama

    @pytest.mark.asyncio
    async def test_resolve_provider_by_id(
        self,
        db_session: AsyncSession,
        db_ollama_provider: LLMProvider,
        provider_resolver: ProviderResolver,
    ):
        result = await provider_resolver.resolve(
            db_session,
            provider_id=db_ollama_provider.id,
        )

        assert result.id == db_ollama_provider.id
        assert result.name == db_ollama_provider.name

    @pytest.mark.asyncio
    async def test_resolve_fallback_to_settings_when_not_in_db(
        self,
        db_session: AsyncSession,
        provider_resolver: ProviderResolver,
    ):
        with patch("app.llm.application.provider_resolver.settings") as mock_settings:
            mock_settings.llm.running_in_docker = False
            mock_settings.llm.ollama_base_url = "http://localhost:11434"

            result = await provider_resolver.resolve(
                db_session,
                provider_name="NonExistent Provider",
            )

            assert result.name == "Settings Fallback (Ollama)"
            assert result.base_url == "http://localhost:11434"

    @pytest.mark.asyncio
    async def test_resolve_active_providers(
        self,
        db_session: AsyncSession,
        db_ollama_provider: LLMProvider,
        db_openai_provider: LLMProvider,
        provider_resolver: ProviderResolver,
    ):
        result = await provider_resolver.resolve_active(db_session)

        assert result.is_active is True
        assert result.id in [db_ollama_provider.id, db_openai_provider.id]

    @pytest.mark.asyncio
    async def test_resolve_active_by_type(
        self,
        db_session: AsyncSession,
        db_ollama_provider: LLMProvider,
        db_openai_provider: LLMProvider,
        provider_resolver: ProviderResolver,
    ):
        result = await provider_resolver.resolve_active(
            db_session,
            provider_type=ProviderType.openai,
        )

        assert result.type == ProviderType.openai
        assert result.id == db_openai_provider.id

    @pytest.mark.asyncio
    async def test_multiple_providers_in_db(
        self,
        db_session: AsyncSession,
        provider_resolver: ProviderResolver,
    ):
        provider1 = LLMProvider(
            name="Ollama 1",
            type=ProviderType.ollama,
            base_url="http://ollama1:11434",
            is_active=True,
        )
        provider2 = LLMProvider(
            name="Ollama 2",
            type=ProviderType.ollama,
            base_url="http://ollama2:11434",
            is_active=True,
        )

        db_session.add(provider1)
        db_session.add(provider2)
        await db_session.commit()
        await db_session.refresh(provider1)
        await db_session.refresh(provider2)

        result1 = await provider_resolver.resolve(db_session, provider_name="Ollama 1")
        result2 = await provider_resolver.resolve(db_session, provider_name="Ollama 2")

        assert result1.id == provider1.id
        assert result2.id == provider2.id
        assert result1.base_url == "http://ollama1:11434"
        assert result2.base_url == "http://ollama2:11434"

    @pytest.mark.asyncio
    async def test_inactive_provider_not_returned_by_active(
        self,
        db_session: AsyncSession,
        provider_resolver: ProviderResolver,
    ):
        inactive_provider = LLMProvider(
            name="Inactive Provider",
            type=ProviderType.ollama,
            base_url="http://localhost:11434",
            is_active=False,
        )

        db_session.add(inactive_provider)
        await db_session.commit()

        with patch("app.llm.application.provider_resolver.settings") as mock_settings:
            mock_settings.llm.running_in_docker = False
            mock_settings.llm.ollama_base_url = "http://localhost:11434"

            result = await provider_resolver.resolve_active(db_session)

            assert result.name == "Settings Fallback (Ollama)"

    @pytest.mark.asyncio
    async def test_docker_url_selection(
        self,
        db_session: AsyncSession,
        provider_resolver: ProviderResolver,
    ):
        with patch("app.llm.application.provider_resolver.settings") as mock_settings:
            mock_settings.llm.running_in_docker = True
            mock_settings.llm.ollama_base_url_docker = "http://ollama:11434"

            result = await provider_resolver.resolve(db_session)

            assert result.base_url == "http://ollama:11434"

    @pytest.mark.asyncio
    async def test_no_settings_fallback_raises_error(
        self,
        db_session: AsyncSession,
        provider_resolver: ProviderResolver,
    ):
        with patch("app.llm.application.provider_resolver.settings") as mock_settings:
            mock_settings.llm.running_in_docker = False
            mock_settings.llm.ollama_base_url = None

            with pytest.raises(ProviderNotFoundError) as exc_info:
                await provider_resolver.resolve(db_session, provider_name="NonExistent")

            assert "No providers in database" in str(exc_info.value)


class TestProviderCRUDIntegration:
    """Integration tests for ProviderCRUD with database."""

    @pytest.mark.asyncio
    async def test_create_and_retrieve_provider(
        self,
        db_session: AsyncSession,
        provider_crud: ProviderCRUD,
    ):
        provider = LLMProvider(
            name="Integration Test Provider",
            type=ProviderType.ollama,
            base_url="http://localhost:11434",
            is_active=True,
        )

        db_session.add(provider)
        await db_session.commit()
        await db_session.refresh(provider)

        retrieved = await provider_crud.get(provider.id)

        assert retrieved is not None
        assert retrieved.name == "Integration Test Provider"
        assert retrieved.type == ProviderType.ollama

    @pytest.mark.asyncio
    async def test_list_active_providers_only(
        self,
        db_session: AsyncSession,
        provider_crud: ProviderCRUD,
    ):
        active_provider = LLMProvider(
            name="Active",
            type=ProviderType.ollama,
            base_url="http://localhost:11434",
            is_active=True,
        )
        inactive_provider = LLMProvider(
            name="Inactive",
            type=ProviderType.ollama,
            base_url="http://localhost:11434",
            is_active=False,
        )

        db_session.add(active_provider)
        db_session.add(inactive_provider)
        await db_session.commit()

        active_list = await provider_crud.list(active_only=True)

        assert len(active_list) == 1
        assert active_list[0].name == "Active"
