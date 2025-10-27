"""Unit tests for Protocol compliance and structural subtyping."""

from typing import Any
from unittest.mock import MagicMock

import pytest
from app.llm.domain.models import AgentConfig, AgentResult, ModelInfo, ProviderConfig, StreamEvent, UsageInfo
from app.llm.domain.ports import LLMAgent, LLMFramework, ModelFactory


class MockModelFactory:
    """Mock implementation of ModelFactory protocol."""

    async def create_model(self, provider_config: ProviderConfig, model_name: str) -> Any:
        return MagicMock(name=model_name)

    async def validate_provider(self, provider_config: ProviderConfig) -> tuple[bool, str | None]:
        return (True, None)

    def get_model_info(self, model: Any) -> ModelInfo:
        return ModelInfo(
            name="mock-model",
            provider_type="mock",
        )

    def supports_provider(self, provider_type: str) -> bool:
        return provider_type == "mock"


class MockLLMAgent:
    """Mock implementation of LLMAgent protocol."""

    def __init__(self, config: AgentConfig):
        self._config = config

    async def run(self, prompt: str, dependencies: Any = None) -> AgentResult[str]:
        return AgentResult(
            output="Mock response",
            usage=UsageInfo(prompt_tokens=10, completion_tokens=20, total_tokens=30),
        )

    async def stream(self, prompt: str, dependencies: Any = None):
        yield StreamEvent(type="text", content="Mock", delta="Mock")
        yield StreamEvent(type="complete", content="Mock response")

    def supports_streaming(self) -> bool:
        return True

    def get_config(self) -> AgentConfig:
        return self._config


class MockLLMFramework:
    """Mock implementation of LLMFramework protocol."""

    def __init__(self):
        self.factory = MockModelFactory()

    async def create_agent(self, config: AgentConfig, provider_config: ProviderConfig) -> LLMAgent[Any]:
        return MockLLMAgent(config)  # type: ignore[return-value]

    def supports_streaming(self) -> bool:
        return True

    def supports_tools(self) -> bool:
        return False

    def get_framework_name(self) -> str:
        return "mock-framework"

    def get_model_factory(self) -> ModelFactory:
        return self.factory  # type: ignore[return-value]


class TestProtocolCompliance:
    """Tests for protocol compliance via structural subtyping."""

    @pytest.mark.asyncio
    async def test_model_factory_protocol_compliance(self):
        factory: ModelFactory = MockModelFactory()  # type: ignore[assignment]

        provider_config = ProviderConfig(provider_type="mock", base_url="http://localhost")

        model = await factory.create_model(provider_config, "test-model")
        assert model is not None

        is_valid, error = await factory.validate_provider(provider_config)
        assert is_valid is True
        assert error is None

        assert factory.supports_provider("mock") is True
        assert factory.supports_provider("other") is False

        model_info = factory.get_model_info(model)
        assert model_info.name == "mock-model"
        assert model_info.provider_type == "mock"

    @pytest.mark.asyncio
    async def test_llm_agent_protocol_compliance(self):
        config = AgentConfig(name="test", model_name="test-model")
        agent: LLMAgent[str] = MockLLMAgent(config)  # type: ignore[assignment]

        result = await agent.run("Test prompt")
        assert result.output == "Mock response"
        assert result.usage.total_tokens == 30

        assert agent.supports_streaming() is True

        retrieved_config = agent.get_config()
        assert retrieved_config.name == "test"
        assert retrieved_config.model_name == "test-model"

    @pytest.mark.asyncio
    async def test_llm_agent_streaming(self):
        config = AgentConfig(name="test", model_name="test-model")
        agent: LLMAgent[str] = MockLLMAgent(config)  # type: ignore[assignment]

        events = []
        async for event in agent.stream("Test prompt"):
            events.append(event)

        assert len(events) == 2
        assert events[0].type == "text"
        assert events[1].type == "complete"

    @pytest.mark.asyncio
    async def test_llm_framework_protocol_compliance(self):
        framework: LLMFramework = MockLLMFramework()  # type: ignore[assignment]

        assert framework.supports_streaming() is True
        assert framework.supports_tools() is False
        assert framework.get_framework_name() == "mock-framework"

        factory = framework.get_model_factory()
        assert factory is not None

        config = AgentConfig(name="test", model_name="test-model")
        provider_config = ProviderConfig(provider_type="mock")

        agent = await framework.create_agent(config, provider_config)
        assert agent is not None

        result = await agent.run("Test")
        assert result.output == "Mock response"


class TestRuntimeProtocolChecks:
    """Tests for runtime protocol checking."""

    def test_runtime_isinstance_checks_not_supported(self):
        factory = MockModelFactory()

        with pytest.raises(TypeError):
            isinstance(factory, ModelFactory)  # type: ignore[arg-type]

    def test_hasattr_checks_work(self):
        factory = MockModelFactory()

        assert hasattr(factory, "create_model")
        assert hasattr(factory, "validate_provider")
        assert hasattr(factory, "get_model_info")
        assert hasattr(factory, "supports_provider")

        assert callable(getattr(factory, "create_model"))
        assert callable(getattr(factory, "validate_provider"))

    def test_agent_protocol_attributes(self):
        config = AgentConfig(name="test", model_name="test")
        agent = MockLLMAgent(config)

        assert hasattr(agent, "run")
        assert hasattr(agent, "stream")
        assert hasattr(agent, "supports_streaming")
        assert hasattr(agent, "get_config")

        assert callable(getattr(agent, "run"))
        assert callable(getattr(agent, "stream"))

    def test_framework_protocol_attributes(self):
        framework = MockLLMFramework()

        assert hasattr(framework, "create_agent")
        assert hasattr(framework, "supports_streaming")
        assert hasattr(framework, "supports_tools")
        assert hasattr(framework, "get_framework_name")
        assert hasattr(framework, "get_model_factory")


class TestTypeAnnotations:
    """Tests for type annotations and generic types."""

    @pytest.mark.asyncio
    async def test_generic_agent_result_type_preservation(self):
        config = AgentConfig(name="test", model_name="test")
        agent = MockLLMAgent(config)

        result: AgentResult[str] = await agent.run("Test")
        assert isinstance(result.output, str)

    @pytest.mark.asyncio
    async def test_agent_with_custom_output_type(self):
        from pydantic import BaseModel

        class CustomOutput(BaseModel):
            value: str

        class CustomAgent:
            async def run(self, prompt: str, dependencies: Any = None) -> AgentResult[CustomOutput]:
                return AgentResult(
                    output=CustomOutput(value="custom"),
                    usage=UsageInfo(prompt_tokens=5, completion_tokens=10, total_tokens=15),
                )

            async def stream(self, prompt: str, dependencies: Any = None):
                yield StreamEvent(type="complete", content=CustomOutput(value="custom"))

            def supports_streaming(self) -> bool:
                return True

            def get_config(self) -> AgentConfig:
                return AgentConfig(name="custom", model_name="custom")

        agent: LLMAgent[CustomOutput] = CustomAgent()  # type: ignore[assignment]
        result = await agent.run("Test")
        assert isinstance(result.output, CustomOutput)
        assert result.output.value == "custom"
