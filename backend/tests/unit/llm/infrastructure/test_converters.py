"""Unit tests for Pydantic AI converters."""

from unittest.mock import MagicMock

import pytest

from app.llm.domain.models import AgentConfig
from app.llm.infrastructure.adapters.pydantic_ai.converters import (
    agent_config_to_model_settings,
    extract_messages_from_result,
    pydantic_usage_to_domain,
)


class TestAgentConfigToModelSettings:
    """Tests for agent_config_to_model_settings converter."""

    def test_convert_with_temperature_only(self):
        config = AgentConfig(
            name="test",
            model_name="gpt-4",
            temperature=0.7,
        )

        settings = agent_config_to_model_settings(config)

        assert settings is not None
        assert settings["temperature"] == 0.7
        assert "max_tokens" not in settings

    def test_convert_with_max_tokens_only(self):
        config = AgentConfig(
            name="test",
            model_name="gpt-4",
            max_tokens=1000,
        )

        settings = agent_config_to_model_settings(config)

        assert settings is not None
        assert settings["max_tokens"] == 1000
        assert "temperature" not in settings

    def test_convert_with_both_settings(self):
        config = AgentConfig(
            name="test",
            model_name="gpt-4",
            temperature=0.5,
            max_tokens=2000,
        )

        settings = agent_config_to_model_settings(config)

        assert settings is not None
        assert settings["temperature"] == 0.5
        assert settings["max_tokens"] == 2000

    def test_convert_with_no_settings(self):
        config = AgentConfig(
            name="test",
            model_name="gpt-4",
        )

        settings = agent_config_to_model_settings(config)

        assert settings is None

    def test_convert_with_temperature_zero(self):
        config = AgentConfig(
            name="test",
            model_name="gpt-4",
            temperature=0.0,
        )

        settings = agent_config_to_model_settings(config)

        assert settings is not None
        assert settings["temperature"] == 0.0


class TestPydanticUsageToDomain:
    """Tests for pydantic_usage_to_domain converter."""

    def test_convert_usage_with_all_fields(self):
        class MockUsage:
            request_tokens = 100
            response_tokens = 50
            total_tokens = 150

        mock_usage = MockUsage()
        domain_usage = pydantic_usage_to_domain(mock_usage)

        assert domain_usage is not None
        assert domain_usage.prompt_tokens == 100
        assert domain_usage.completion_tokens == 50
        assert domain_usage.total_tokens == 150

    def test_convert_usage_with_none_tokens(self):
        class MockUsage:
            request_tokens = None
            response_tokens = None
            total_tokens = None

        mock_usage = MockUsage()
        domain_usage = pydantic_usage_to_domain(mock_usage)

        assert domain_usage is not None
        assert domain_usage.prompt_tokens == 0
        assert domain_usage.completion_tokens == 0
        assert domain_usage.total_tokens == 0

    def test_convert_none_usage(self):
        domain_usage = pydantic_usage_to_domain(None)
        assert domain_usage is None

    def test_convert_usage_with_partial_none(self):
        class MockUsage:
            request_tokens = 100
            response_tokens = None
            total_tokens = 100

        mock_usage = MockUsage()
        domain_usage = pydantic_usage_to_domain(mock_usage)

        assert domain_usage is not None
        assert domain_usage.prompt_tokens == 100
        assert domain_usage.completion_tokens == 0
        assert domain_usage.total_tokens == 100


class TestExtractMessagesFromResult:
    """Tests for extract_messages_from_result converter."""

    def test_extract_messages_success(self):
        class MockMessage:
            def __init__(self, role: str, content: str):
                self.role = role
                self.content = content

        class MockResult:
            def all_messages(self):
                return [
                    MockMessage("user", "Hello"),
                    MockMessage("assistant", "Hi there!"),
                ]

        result = MockResult()
        messages = extract_messages_from_result(result)

        assert messages is not None
        assert len(messages) == 2
        assert messages[0]["role"] == "user"
        assert messages[0]["content"] == "Hello"
        assert messages[1]["role"] == "assistant"
        assert messages[1]["content"] == "Hi there!"

    def test_extract_messages_no_method(self):
        class MockResult:
            pass

        result = MockResult()
        messages = extract_messages_from_result(result)

        assert messages is None

    def test_extract_messages_empty_list(self):
        class MockResult:
            def all_messages(self):
                return []

        result = MockResult()
        messages = extract_messages_from_result(result)

        assert messages is None

    def test_extract_messages_exception_handling(self):
        class MockResult:
            def all_messages(self):
                raise RuntimeError("Failed to get messages")

        result = MockResult()
        messages = extract_messages_from_result(result)

        assert messages is None

    def test_extract_messages_missing_attributes(self):
        class MockMessage:
            pass

        class MockResult:
            def all_messages(self):
                return [MockMessage()]

        result = MockResult()
        messages = extract_messages_from_result(result)

        assert messages is not None
        assert len(messages) == 1
        assert messages[0]["role"] == "unknown"
        assert "content" in messages[0]

    def test_extract_messages_with_partial_attributes(self):
        class MockMessage:
            def __init__(self, role: str):
                self.role = role

        class MockResult:
            def all_messages(self):
                return [MockMessage("user")]

        result = MockResult()
        messages = extract_messages_from_result(result)

        assert messages is not None
        assert len(messages) == 1
        assert messages[0]["role"] == "user"
        assert "content" in messages[0]
