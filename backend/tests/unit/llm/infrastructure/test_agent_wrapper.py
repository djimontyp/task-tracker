"""Unit tests for PydanticAIAgentWrapper."""

from unittest.mock import AsyncMock, MagicMock

import pytest
from app.llm.domain.exceptions import AgentExecutionError
from app.llm.domain.models import AgentConfig
from app.llm.infrastructure.adapters.pydantic_ai.agent_wrapper import PydanticAIAgentWrapper


class TestPydanticAIAgentWrapper:
    """Tests for Pydantic AI agent wrapper."""

    def test_wrapper_initialization(self):
        mock_agent = MagicMock()
        config = AgentConfig(name="test", model_name="test-model")

        wrapper = PydanticAIAgentWrapper(mock_agent, config)

        assert wrapper._agent == mock_agent
        assert wrapper._config == config

    def test_supports_streaming(self):
        mock_agent = MagicMock()
        config = AgentConfig(name="test", model_name="test-model")
        wrapper = PydanticAIAgentWrapper(mock_agent, config)

        assert wrapper.supports_streaming() is True

    def test_get_config(self):
        mock_agent = MagicMock()
        config = AgentConfig(
            name="test_agent",
            model_name="llama3.2:latest",
            temperature=0.7,
        )
        wrapper = PydanticAIAgentWrapper(mock_agent, config)

        retrieved_config = wrapper.get_config()

        assert retrieved_config.name == "test_agent"
        assert retrieved_config.model_name == "llama3.2:latest"
        assert retrieved_config.temperature == 0.7

    @pytest.mark.asyncio
    async def test_run_success(self):
        mock_agent = AsyncMock()

        class MockUsage:
            request_tokens = 10
            response_tokens = 20
            total_tokens = 30

        class MockResult:
            output = "Test response"

            def usage(self):
                return MockUsage()

            def all_messages(self):
                return []

        mock_agent.run = AsyncMock(return_value=MockResult())

        config = AgentConfig(name="test", model_name="test-model")
        wrapper = PydanticAIAgentWrapper(mock_agent, config)

        result = await wrapper.run("Test prompt")

        assert result.output == "Test response"
        assert result.usage is not None
        assert result.usage.prompt_tokens == 10
        assert result.usage.completion_tokens == 20
        assert result.usage.total_tokens == 30
        mock_agent.run.assert_called_once_with("Test prompt", deps=None)

    @pytest.mark.asyncio
    async def test_run_with_dependencies(self):
        mock_agent = AsyncMock()

        class MockUsage:
            request_tokens = 5
            response_tokens = 15
            total_tokens = 20

        class MockResult:
            output = "Response with deps"

            def usage(self):
                return MockUsage()

            def all_messages(self):
                return []

        mock_agent.run = AsyncMock(return_value=MockResult())

        config = AgentConfig(name="test", model_name="test-model")
        wrapper = PydanticAIAgentWrapper(mock_agent, config)

        dependencies = {"session": "mock_session"}
        result = await wrapper.run("Test prompt", dependencies=dependencies)

        assert result.output == "Response with deps"
        mock_agent.run.assert_called_once_with("Test prompt", deps=dependencies)

    @pytest.mark.asyncio
    async def test_run_with_messages(self):
        mock_agent = AsyncMock()

        class MockMessage:
            def __init__(self, role, content):
                self.role = role
                self.content = content

        class MockUsage:
            request_tokens = 10
            response_tokens = 20
            total_tokens = 30

        class MockResult:
            output = "Response"

            def usage(self):
                return MockUsage()

            def all_messages(self):
                return [
                    MockMessage("user", "Hello"),
                    MockMessage("assistant", "Hi!"),
                ]

        mock_agent.run = AsyncMock(return_value=MockResult())

        config = AgentConfig(name="test", model_name="test-model")
        wrapper = PydanticAIAgentWrapper(mock_agent, config)

        result = await wrapper.run("Test")

        assert result.messages is not None
        assert len(result.messages) == 2
        assert result.messages[0]["role"] == "user"
        assert result.messages[1]["content"] == "Hi!"

    @pytest.mark.asyncio
    async def test_run_execution_error(self):
        mock_agent = AsyncMock()
        mock_agent.run = AsyncMock(side_effect=RuntimeError("API call failed"))

        config = AgentConfig(name="test", model_name="test-model")
        wrapper = PydanticAIAgentWrapper(mock_agent, config)

        with pytest.raises(AgentExecutionError) as exc_info:
            await wrapper.run("Test prompt")

        assert "Agent execution failed" in str(exc_info.value)
        assert "test" in str(exc_info.value)
        assert exc_info.value.__cause__ is not None

    @pytest.mark.asyncio
    async def test_run_without_usage(self):
        mock_agent = AsyncMock()

        class MockResult:
            output = "Response"

            def usage(self):
                return None

            def all_messages(self):
                return []

        mock_agent.run = AsyncMock(return_value=MockResult())

        config = AgentConfig(name="test", model_name="test-model")
        wrapper = PydanticAIAgentWrapper(mock_agent, config)

        result = await wrapper.run("Test")

        assert result.output == "Response"
        assert result.usage is None

    @pytest.mark.asyncio
    async def test_stream_success(self):
        mock_agent = MagicMock()

        class MockStreamedResult:
            async def stream_text(self):
                yield "Hello"
                yield " World"

            async def get_output(self):
                return "Hello World"

            async def __aenter__(self):
                return self

            async def __aexit__(self, exc_type, exc_val, exc_tb):
                pass

        mock_agent.run_stream = MagicMock(return_value=MockStreamedResult())

        config = AgentConfig(name="test", model_name="test-model")
        wrapper = PydanticAIAgentWrapper(mock_agent, config)

        events = []
        async for event in wrapper.stream("Test prompt"):
            events.append(event)

        assert len(events) == 3
        assert events[0].type == "text"
        assert events[0].content == "Hello"
        assert events[0].delta == "Hello"
        assert events[1].type == "text"
        assert events[1].content == " World"
        assert events[2].type == "complete"
        assert events[2].content == "Hello World"

    @pytest.mark.asyncio
    async def test_stream_with_dependencies(self):
        mock_agent = MagicMock()

        class MockStreamedResult:
            async def stream_text(self):
                yield "Test"

            async def get_output(self):
                return "Test"

            async def __aenter__(self):
                return self

            async def __aexit__(self, exc_type, exc_val, exc_tb):
                pass

        mock_agent.run_stream = MagicMock(return_value=MockStreamedResult())

        config = AgentConfig(name="test", model_name="test-model")
        wrapper = PydanticAIAgentWrapper(mock_agent, config)

        dependencies = {"key": "value"}
        events = []
        async for event in wrapper.stream("Test", dependencies=dependencies):
            events.append(event)

        assert len(events) == 2
        mock_agent.run_stream.assert_called_once_with("Test", deps=dependencies)

    @pytest.mark.asyncio
    async def test_stream_execution_error(self):
        mock_agent = MagicMock()

        class MockStreamedResult:
            async def stream_text(self):
                raise RuntimeError("Streaming failed")

            async def __aenter__(self):
                return self

            async def __aexit__(self, exc_type, exc_val, exc_tb):
                pass

        mock_agent.run_stream = MagicMock(return_value=MockStreamedResult())

        config = AgentConfig(name="test", model_name="test-model")
        wrapper = PydanticAIAgentWrapper(mock_agent, config)

        with pytest.raises(AgentExecutionError) as exc_info:
            async for event in wrapper.stream("Test"):
                pass

        assert "Agent streaming failed" in str(exc_info.value)
        assert "test" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_generic_type_preservation(self):
        mock_agent = AsyncMock()

        class CustomOutput:
            value: str = "custom"

        class MockUsage:
            request_tokens = 10
            response_tokens = 20
            total_tokens = 30

        class MockResult:
            output = CustomOutput()

            def usage(self):
                return MockUsage()

            def all_messages(self):
                return []

        mock_agent.run = AsyncMock(return_value=MockResult())

        config = AgentConfig(name="test", model_name="test-model", output_type=CustomOutput)
        wrapper = PydanticAIAgentWrapper[CustomOutput](mock_agent, config)

        result = await wrapper.run("Test")

        assert isinstance(result.output, CustomOutput)
        assert result.output.value == "custom"
