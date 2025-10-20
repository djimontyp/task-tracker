"""Unit tests for FrameworkRegistry."""

import pytest

from app.llm.domain.exceptions import FrameworkNotSupportedError
from app.llm.infrastructure.adapters.pydantic_ai.adapter import PydanticAIFramework
from app.llm.application.framework_registry import FrameworkRegistry


class MockFramework:
    """Mock framework for testing."""

    def supports_streaming(self) -> bool:
        return True

    def supports_tools(self) -> bool:
        return False

    def get_framework_name(self) -> str:
        return "mock"

    async def create_agent(self, config, provider_config):
        pass

    def get_model_factory(self):
        pass


class TestFrameworkRegistry:
    """Tests for Framework Registry."""

    def setup_method(self):
        FrameworkRegistry._frameworks = {}
        FrameworkRegistry._default = None

    def teardown_method(self):
        FrameworkRegistry._frameworks = {}
        FrameworkRegistry._default = None

    def test_register_framework(self):
        framework = MockFramework()
        FrameworkRegistry.register("mock", framework)

        assert "mock" in FrameworkRegistry._frameworks
        assert FrameworkRegistry._frameworks["mock"] == framework

    def test_register_sets_first_as_default(self):
        framework1 = MockFramework()
        framework2 = MockFramework()

        FrameworkRegistry.register("framework1", framework1)
        FrameworkRegistry.register("framework2", framework2)

        assert FrameworkRegistry._default == "framework1"

    def test_get_framework_by_name(self):
        framework = MockFramework()
        FrameworkRegistry.register("mock", framework)

        retrieved = FrameworkRegistry.get("mock")

        assert retrieved == framework

    def test_get_default_framework(self):
        framework = MockFramework()
        FrameworkRegistry.register("mock", framework)

        retrieved = FrameworkRegistry.get()

        assert retrieved == framework

    def test_get_framework_not_found(self):
        with pytest.raises(FrameworkNotSupportedError) as exc_info:
            FrameworkRegistry.get("nonexistent")

        assert "not found" in str(exc_info.value)
        assert "nonexistent" in str(exc_info.value)

    def test_get_no_frameworks_registered(self):
        with pytest.raises(FrameworkNotSupportedError) as exc_info:
            FrameworkRegistry.get()

        assert "No frameworks registered" in str(exc_info.value)

    def test_set_default_framework(self):
        framework1 = MockFramework()
        framework2 = MockFramework()

        FrameworkRegistry.register("framework1", framework1)
        FrameworkRegistry.register("framework2", framework2)

        FrameworkRegistry.set_default("framework2")

        assert FrameworkRegistry._default == "framework2"
        assert FrameworkRegistry.get() == framework2

    def test_set_default_nonexistent_framework(self):
        with pytest.raises(FrameworkNotSupportedError) as exc_info:
            FrameworkRegistry.set_default("nonexistent")

        assert "not registered" in str(exc_info.value)

    def test_list_frameworks_empty(self):
        frameworks = FrameworkRegistry.list_frameworks()
        assert frameworks == []

    def test_list_frameworks(self):
        framework1 = MockFramework()
        framework2 = MockFramework()

        FrameworkRegistry.register("framework1", framework1)
        FrameworkRegistry.register("framework2", framework2)

        frameworks = FrameworkRegistry.list_frameworks()

        assert len(frameworks) == 2
        assert "framework1" in frameworks
        assert "framework2" in frameworks

    def test_register_multiple_frameworks(self):
        framework1 = MockFramework()
        framework2 = MockFramework()
        framework3 = MockFramework()

        FrameworkRegistry.register("pydantic_ai", framework1)
        FrameworkRegistry.register("langchain", framework2)
        FrameworkRegistry.register("llamaindex", framework3)

        assert len(FrameworkRegistry._frameworks) == 3
        assert FrameworkRegistry.get("pydantic_ai") == framework1
        assert FrameworkRegistry.get("langchain") == framework2
        assert FrameworkRegistry.get("llamaindex") == framework3

    def test_register_overwrites_existing(self):
        framework1 = MockFramework()
        framework2 = MockFramework()

        FrameworkRegistry.register("mock", framework1)
        FrameworkRegistry.register("mock", framework2)

        assert FrameworkRegistry.get("mock") == framework2

    def test_integration_with_real_framework(self):
        framework = PydanticAIFramework()
        FrameworkRegistry.register("pydantic_ai", framework)

        retrieved = FrameworkRegistry.get("pydantic_ai")

        assert retrieved.get_framework_name() == "pydantic-ai"
        assert retrieved.supports_streaming() is True
