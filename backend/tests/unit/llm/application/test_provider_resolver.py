"""Unit tests for ProviderResolver."""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.llm.application.provider_resolver import ProviderResolver
from app.llm.domain.exceptions import ProviderNotFoundError
from app.models import LLMProvider, ProviderType
from app.services.provider_crud import ProviderCRUD


class TestProviderResolver:
    """Tests for Provider Resolver."""

    def setup_method(self):
        self.mock_crud = MagicMock(spec=ProviderCRUD)
        self.resolver = ProviderResolver(self.mock_crud)

    @pytest.mark.asyncio
    async def test_resolve_by_id_success(self):
        provider_id = uuid4()
        mock_provider = LLMProvider(
            id=provider_id,
            name="Test Provider",
            type=ProviderType.ollama,
            base_url="http://localhost:11434",
            is_active=True,
        )

        mock_session = AsyncMock()
        mock_session.get = AsyncMock(return_value=mock_provider)

        self.mock_crud.get = AsyncMock(return_value=MagicMock(id=provider_id))

        result = await self.resolver.resolve(mock_session, provider_id=provider_id)

        assert result.id == provider_id
        assert result.name == "Test Provider"
        self.mock_crud.get.assert_called_once_with(provider_id)

    @pytest.mark.asyncio
    async def test_resolve_by_name_success(self):
        provider_id = uuid4()
        mock_provider = LLMProvider(
            id=provider_id,
            name="Ollama Local",
            type=ProviderType.ollama,
            base_url="http://localhost:11434",
            is_active=True,
        )

        mock_session = AsyncMock()
        mock_session.get = AsyncMock(return_value=mock_provider)

        self.mock_crud.get_by_name = AsyncMock(return_value=MagicMock(id=provider_id))

        result = await self.resolver.resolve(mock_session, provider_name="Ollama Local")

        assert result.name == "Ollama Local"
        self.mock_crud.get_by_name.assert_called_once_with("Ollama Local")

    @pytest.mark.asyncio
    async def test_resolve_fallback_to_settings(self):
        mock_session = AsyncMock()

        self.mock_crud.get = AsyncMock(return_value=None)
        self.mock_crud.get_by_name = AsyncMock(return_value=None)

        with patch("app.llm.application.provider_resolver.settings") as mock_settings:
            mock_settings.llm.running_in_docker = False
            mock_settings.llm.ollama_base_url = "http://localhost:11434"

            result = await self.resolver.resolve(mock_session)

            assert result.name == "Settings Fallback (Ollama)"
            assert result.type == ProviderType.ollama
            assert result.base_url == "http://localhost:11434"
            assert result.is_active is True

    @pytest.mark.asyncio
    async def test_resolve_fallback_docker_url(self):
        mock_session = AsyncMock()

        self.mock_crud.get_by_name = AsyncMock(return_value=None)

        with patch("app.llm.application.provider_resolver.settings") as mock_settings:
            mock_settings.llm.running_in_docker = True
            mock_settings.llm.ollama_base_url_docker = "http://ollama:11434"

            result = await self.resolver.resolve(mock_session, provider_name="nonexistent")

            assert result.base_url == "http://ollama:11434"

    @pytest.mark.asyncio
    async def test_resolve_no_provider_no_settings(self):
        mock_session = AsyncMock()

        self.mock_crud.get_by_name = AsyncMock(return_value=None)

        with patch("app.llm.application.provider_resolver.settings") as mock_settings:
            mock_settings.llm.running_in_docker = False
            mock_settings.llm.ollama_base_url = None

            with pytest.raises(ProviderNotFoundError) as exc_info:
                await self.resolver.resolve(mock_session, provider_name="nonexistent")

            assert "No providers in database" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_resolve_active_success(self):
        provider_id = uuid4()
        mock_provider = LLMProvider(
            id=provider_id,
            name="Active Provider",
            type=ProviderType.ollama,
            base_url="http://localhost:11434",
            is_active=True,
        )

        mock_session = AsyncMock()
        mock_session.get = AsyncMock(return_value=mock_provider)

        provider_data = MagicMock(id=provider_id, type=ProviderType.ollama, is_active=True)
        self.mock_crud.list = AsyncMock(return_value=[provider_data])

        result = await self.resolver.resolve_active(mock_session)

        assert result.id == provider_id
        assert result.is_active is True
        self.mock_crud.list.assert_called_once_with(active_only=True)

    @pytest.mark.asyncio
    async def test_resolve_active_filter_by_type(self):
        provider_id = uuid4()
        mock_provider = LLMProvider(
            id=provider_id,
            name="OpenAI Provider",
            type=ProviderType.openai,
            api_key_encrypted=b"encrypted",
            is_active=True,
        )

        mock_session = AsyncMock()
        mock_session.get = AsyncMock(return_value=mock_provider)

        provider_data = MagicMock(id=provider_id, type=ProviderType.openai)
        self.mock_crud.list = AsyncMock(return_value=[provider_data])

        result = await self.resolver.resolve_active(mock_session, provider_type=ProviderType.openai)

        assert result.type == ProviderType.openai

    @pytest.mark.asyncio
    async def test_resolve_active_no_active_providers(self):
        mock_session = AsyncMock()
        self.mock_crud.list = AsyncMock(return_value=[])

        with patch("app.llm.application.provider_resolver.settings") as mock_settings:
            mock_settings.llm.running_in_docker = False
            mock_settings.llm.ollama_base_url = "http://localhost:11434"

            result = await self.resolver.resolve_active(mock_session)

            assert result.name == "Settings Fallback (Ollama)"

    @pytest.mark.asyncio
    async def test_resolve_active_type_filter_no_match(self):
        mock_session = AsyncMock()

        ollama_data = MagicMock(id=uuid4(), type=ProviderType.ollama)
        self.mock_crud.list = AsyncMock(return_value=[ollama_data])

        with patch("app.llm.application.provider_resolver.settings") as mock_settings:
            mock_settings.llm.running_in_docker = False
            mock_settings.llm.ollama_base_url = "http://localhost:11434"

            result = await self.resolver.resolve_active(mock_session, provider_type=ProviderType.openai)

            assert result.name == "Settings Fallback (Ollama)"

    @pytest.mark.asyncio
    async def test_resolve_priority_id_over_name(self):
        provider_id = uuid4()
        mock_provider_by_id = LLMProvider(
            id=provider_id,
            name="Provider By ID",
            type=ProviderType.ollama,
            base_url="http://localhost:11434",
            is_active=True,
        )

        mock_session = AsyncMock()
        mock_session.get = AsyncMock(return_value=mock_provider_by_id)

        self.mock_crud.get = AsyncMock(return_value=MagicMock(id=provider_id))

        result = await self.resolver.resolve(
            mock_session,
            provider_name="Different Name",
            provider_id=provider_id,
        )

        assert result.id == provider_id
        assert result.name == "Provider By ID"
        self.mock_crud.get.assert_called_once_with(provider_id)
        self.mock_crud.get_by_name.assert_not_called()

    def test_create_settings_fallback_provider_local(self):
        with patch("app.llm.application.provider_resolver.settings") as mock_settings:
            mock_settings.llm.running_in_docker = False
            mock_settings.llm.ollama_base_url = "http://localhost:11434"

            provider = self.resolver._create_settings_fallback_provider()

            assert provider.name == "Settings Fallback (Ollama)"
            assert provider.type == ProviderType.ollama
            assert provider.base_url == "http://localhost:11434"
            assert provider.is_active is True

    def test_create_settings_fallback_provider_docker(self):
        with patch("app.llm.application.provider_resolver.settings") as mock_settings:
            mock_settings.llm.running_in_docker = True
            mock_settings.llm.ollama_base_url_docker = "http://ollama:11434"

            provider = self.resolver._create_settings_fallback_provider()

            assert provider.base_url == "http://ollama:11434"

    def test_create_settings_fallback_provider_no_url(self):
        with patch("app.llm.application.provider_resolver.settings") as mock_settings:
            mock_settings.llm.running_in_docker = False
            mock_settings.llm.ollama_base_url = None

            with pytest.raises(ProviderNotFoundError) as exc_info:
                self.resolver._create_settings_fallback_provider()

            assert "ollama_base_url" in str(exc_info.value)
