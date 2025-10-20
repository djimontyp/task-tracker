"""Unit tests for LLM domain models."""

import pytest
from pydantic import ValidationError

from app.llm.domain.models import (
    AgentConfig,
    AgentResult,
    ModelInfo,
    ProviderConfig,
    StreamEvent,
    ToolDefinition,
    UsageInfo,
)


class TestAgentConfig:
    """Tests for AgentConfig domain model."""

    def test_agent_config_creation_minimal(self):
        config = AgentConfig(
            name="test_agent",
            model_name="llama3.2:latest",
        )
        assert config.name == "test_agent"
        assert config.model_name == "llama3.2:latest"
        assert config.system_prompt is None
        assert config.output_type is None
        assert config.deps_type is None
        assert config.temperature is None
        assert config.max_tokens is None
        assert config.tools is None

    def test_agent_config_creation_full(self):
        tools = [
            ToolDefinition(
                name="search",
                description="Search the web",
                parameters={"query": {"type": "string"}},
                required=["query"],
            )
        ]

        config = AgentConfig(
            name="advanced_agent",
            model_name="gpt-4",
            system_prompt="You are a helpful assistant",
            output_type=str,
            deps_type=dict,
            temperature=0.7,
            max_tokens=1000,
            tools=tools,
        )

        assert config.name == "advanced_agent"
        assert config.model_name == "gpt-4"
        assert config.system_prompt == "You are a helpful assistant"
        assert config.output_type == str
        assert config.deps_type == dict
        assert config.temperature == 0.7
        assert config.max_tokens == 1000
        assert len(config.tools) == 1
        assert config.tools[0].name == "search"

    def test_agent_config_temperature_validation(self):
        with pytest.raises(ValidationError) as exc_info:
            AgentConfig(
                name="test",
                model_name="llama3",
                temperature=2.5,
            )
        assert "less_than_equal" in str(exc_info.value)

        with pytest.raises(ValidationError) as exc_info:
            AgentConfig(
                name="test",
                model_name="llama3",
                temperature=-0.1,
            )
        assert "greater_than_equal" in str(exc_info.value)

    def test_agent_config_max_tokens_validation(self):
        with pytest.raises(ValidationError) as exc_info:
            AgentConfig(
                name="test",
                model_name="llama3",
                max_tokens=0,
            )
        assert "greater_than" in str(exc_info.value)

        with pytest.raises(ValidationError) as exc_info:
            AgentConfig(
                name="test",
                model_name="llama3",
                max_tokens=-100,
            )
        assert "greater_than" in str(exc_info.value)


class TestUsageInfo:
    """Tests for UsageInfo domain model."""

    def test_usage_info_creation(self):
        usage = UsageInfo(
            prompt_tokens=100,
            completion_tokens=50,
            total_tokens=150,
        )
        assert usage.prompt_tokens == 100
        assert usage.completion_tokens == 50
        assert usage.total_tokens == 150

    def test_usage_info_validation_negative_tokens(self):
        with pytest.raises(ValidationError):
            UsageInfo(
                prompt_tokens=-10,
                completion_tokens=50,
                total_tokens=40,
            )

        with pytest.raises(ValidationError):
            UsageInfo(
                prompt_tokens=100,
                completion_tokens=-50,
                total_tokens=50,
            )

        with pytest.raises(ValidationError):
            UsageInfo(
                prompt_tokens=100,
                completion_tokens=50,
                total_tokens=-150,
            )

    def test_usage_info_zero_tokens(self):
        usage = UsageInfo(
            prompt_tokens=0,
            completion_tokens=0,
            total_tokens=0,
        )
        assert usage.prompt_tokens == 0
        assert usage.completion_tokens == 0
        assert usage.total_tokens == 0


class TestAgentResult:
    """Tests for AgentResult generic domain model."""

    def test_agent_result_with_string_output(self):
        result = AgentResult[str](
            output="This is the response",
            usage=UsageInfo(prompt_tokens=10, completion_tokens=20, total_tokens=30),
        )
        assert result.output == "This is the response"
        assert result.usage.total_tokens == 30
        assert result.messages is None
        assert result.metadata is None

    def test_agent_result_with_dict_output(self):
        result = AgentResult[dict](
            output={"category": "work", "priority": "high"},
            usage=UsageInfo(prompt_tokens=15, completion_tokens=25, total_tokens=40),
            messages=[{"role": "user", "content": "test"}],
            metadata={"model": "gpt-4"},
        )
        assert result.output["category"] == "work"
        assert result.usage.total_tokens == 40
        assert len(result.messages) == 1
        assert result.metadata["model"] == "gpt-4"

    def test_agent_result_without_usage(self):
        result = AgentResult[str](output="Response without usage info")
        assert result.output == "Response without usage info"
        assert result.usage is None


class TestStreamEvent:
    """Tests for StreamEvent domain model."""

    def test_stream_event_text(self):
        event = StreamEvent(
            type="text",
            content="Partial response",
            delta="Partial response",
        )
        assert event.type == "text"
        assert event.content == "Partial response"
        assert event.delta == "Partial response"

    def test_stream_event_complete(self):
        event = StreamEvent(
            type="complete",
            content={"final": "result"},
        )
        assert event.type == "complete"
        assert event.content["final"] == "result"
        assert event.delta is None

    def test_stream_event_with_metadata(self):
        event = StreamEvent(
            type="tool_call",
            content={"tool": "search", "query": "test"},
            metadata={"timestamp": 123456},
        )
        assert event.type == "tool_call"
        assert event.metadata["timestamp"] == 123456


class TestToolDefinition:
    """Tests for ToolDefinition domain model."""

    def test_tool_definition_minimal(self):
        tool = ToolDefinition(
            name="calculator",
            description="Perform calculations",
        )
        assert tool.name == "calculator"
        assert tool.description == "Perform calculations"
        assert tool.parameters == {}
        assert tool.required is None

    def test_tool_definition_full(self):
        tool = ToolDefinition(
            name="search",
            description="Search the web",
            parameters={
                "query": {"type": "string", "description": "Search query"},
                "limit": {"type": "integer", "description": "Max results"},
            },
            required=["query"],
        )
        assert tool.name == "search"
        assert tool.description == "Search the web"
        assert "query" in tool.parameters
        assert "limit" in tool.parameters
        assert tool.required == ["query"]


class TestModelInfo:
    """Tests for ModelInfo domain model."""

    def test_model_info_creation(self):
        info = ModelInfo(
            name="llama3.2:latest",
            provider_type="ollama",
            supports_streaming=True,
            supports_tools=False,
            context_window=8192,
            metadata={"version": "3.2"},
        )
        assert info.name == "llama3.2:latest"
        assert info.provider_type == "ollama"
        assert info.supports_streaming is True
        assert info.supports_tools is False
        assert info.context_window == 8192
        assert info.metadata["version"] == "3.2"

    def test_model_info_minimal(self):
        info = ModelInfo(
            name="gpt-4",
            provider_type="openai",
        )
        assert info.name == "gpt-4"
        assert info.provider_type == "openai"
        assert info.supports_streaming is False
        assert info.supports_tools is False
        assert info.context_window is None
        assert info.metadata is None


class TestProviderConfig:
    """Tests for ProviderConfig domain model."""

    def test_provider_config_ollama(self):
        config = ProviderConfig(
            provider_type="ollama",
            base_url="http://localhost:11434",
        )
        assert config.provider_type == "ollama"
        assert config.base_url == "http://localhost:11434"
        assert config.api_key is None

    def test_provider_config_openai(self):
        config = ProviderConfig(
            provider_type="openai",
            api_key="sk-test-key",
            timeout=30,
            max_retries=3,
        )
        assert config.provider_type == "openai"
        assert config.api_key == "sk-test-key"
        assert config.timeout == 30
        assert config.max_retries == 3

    def test_provider_config_validation(self):
        with pytest.raises(ValidationError):
            ProviderConfig(
                provider_type="openai",
                timeout=0,
            )

        with pytest.raises(ValidationError):
            ProviderConfig(
                provider_type="openai",
                max_retries=-1,
            )
