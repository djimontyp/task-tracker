"""Integration tests for agent creation with database and mocked LLM."""

from unittest.mock import MagicMock, patch

import pytest
from app.llm.application.llm_service import LLMService
from app.llm.domain.models import AgentConfig
from app.models import LLMProvider
from sqlalchemy.ext.asyncio import AsyncSession


class TestAgentCreationIntegration:
    """Integration tests for end-to-end agent creation."""

    @pytest.mark.asyncio
    async def test_create_agent_with_db_provider(
        self,
        db_session: AsyncSession,
        db_ollama_provider: LLMProvider,
        llm_service: LLMService,
        agent_config: AgentConfig,
    ):
        with patch("pydantic_ai.Agent") as mock_agent_class:
            mock_agent_instance = MagicMock()
            mock_agent_class.return_value = mock_agent_instance

            agent = await llm_service.create_agent(
                db_session,
                agent_config,
                provider_name=db_ollama_provider.name,
            )

            assert agent is not None
            assert hasattr(agent, "run")
            assert hasattr(agent, "stream")

    @pytest.mark.asyncio
    async def test_create_agent_by_provider_id(
        self,
        db_session: AsyncSession,
        db_ollama_provider: LLMProvider,
        llm_service: LLMService,
        agent_config: AgentConfig,
    ):
        with patch("pydantic_ai.Agent") as mock_agent_class:
            mock_agent_instance = MagicMock()
            mock_agent_class.return_value = mock_agent_instance

            agent = await llm_service.create_agent(
                db_session,
                agent_config,
                provider_id=db_ollama_provider.id,
            )

            assert agent is not None

    @pytest.mark.asyncio
    async def test_create_multiple_agents_same_session(
        self,
        db_session: AsyncSession,
        db_ollama_provider: LLMProvider,
        llm_service: LLMService,
    ):
        with patch("pydantic_ai.Agent") as mock_agent_class:
            mock_agent_instance = MagicMock()
            mock_agent_class.return_value = mock_agent_instance

            config1 = AgentConfig(name="agent1", model_name="llama3.2:latest")
            config2 = AgentConfig(name="agent2", model_name="qwen2.5-coder:7b")

            agent1 = await llm_service.create_agent(
                db_session,
                config1,
                provider_name=db_ollama_provider.name,
            )
            agent2 = await llm_service.create_agent(
                db_session,
                config2,
                provider_name=db_ollama_provider.name,
            )

            assert agent1 is not None
            assert agent2 is not None

    @pytest.mark.asyncio
    async def test_create_agent_with_settings_fallback(
        self,
        db_session: AsyncSession,
        llm_service: LLMService,
        agent_config: AgentConfig,
    ):
        with patch("app.llm.application.provider_resolver.settings") as mock_settings:
            mock_settings.llm.running_in_docker = False
            mock_settings.llm.ollama_base_url = "http://localhost:11434"

            with patch("pydantic_ai.Agent") as mock_agent_class:
                mock_agent_instance = MagicMock()
                mock_agent_class.return_value = mock_agent_instance

                agent = await llm_service.create_agent(
                    db_session,
                    agent_config,
                )

                assert agent is not None

    @pytest.mark.asyncio
    async def test_create_agent_with_different_configs(
        self,
        db_session: AsyncSession,
        db_ollama_provider: LLMProvider,
        llm_service: LLMService,
    ):
        with patch("pydantic_ai.Agent") as mock_agent_class:
            mock_agent_instance = MagicMock()
            mock_agent_class.return_value = mock_agent_instance

            configs = [
                AgentConfig(
                    name="minimal",
                    model_name="llama3.2:latest",
                ),
                AgentConfig(
                    name="with_temp",
                    model_name="llama3.2:latest",
                    temperature=0.5,
                ),
                AgentConfig(
                    name="with_max_tokens",
                    model_name="llama3.2:latest",
                    max_tokens=1000,
                ),
                AgentConfig(
                    name="full_config",
                    model_name="llama3.2:latest",
                    system_prompt="Test prompt",
                    temperature=0.7,
                    max_tokens=2000,
                ),
            ]

            for config in configs:
                agent = await llm_service.create_agent(
                    db_session,
                    config,
                    provider_name=db_ollama_provider.name,
                )
                assert agent is not None


class TestAgentStreamingIntegration:
    """Integration tests for streaming agent execution."""
