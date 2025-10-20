"""Unit tests for LLM domain exceptions."""

import pytest

from app.llm.domain.exceptions import (
    AgentExecutionError,
    FrameworkNotSupportedError,
    InvalidConfigurationError,
    LLMDomainError,
    ModelCreationError,
    ProviderNotFoundError,
    StreamingNotSupportedError,
)


class TestExceptionHierarchy:
    """Tests for exception inheritance and hierarchy."""

    def test_base_exception_instantiation(self):
        error = LLMDomainError("Base error message")
        assert str(error) == "Base error message"
        assert isinstance(error, Exception)

    def test_provider_not_found_error(self):
        error = ProviderNotFoundError("Provider 'test' not found")
        assert str(error) == "Provider 'test' not found"
        assert isinstance(error, LLMDomainError)
        assert isinstance(error, Exception)

    def test_framework_not_supported_error(self):
        error = FrameworkNotSupportedError("Framework 'langchain' not supported")
        assert str(error) == "Framework 'langchain' not supported"
        assert isinstance(error, LLMDomainError)

    def test_model_creation_error(self):
        error = ModelCreationError("Failed to create model")
        assert str(error) == "Failed to create model"
        assert isinstance(error, LLMDomainError)

    def test_agent_execution_error(self):
        error = AgentExecutionError("Agent execution failed")
        assert str(error) == "Agent execution failed"
        assert isinstance(error, LLMDomainError)

    def test_invalid_configuration_error(self):
        error = InvalidConfigurationError("Invalid config parameter")
        assert str(error) == "Invalid config parameter"
        assert isinstance(error, LLMDomainError)

    def test_streaming_not_supported_error(self):
        error = StreamingNotSupportedError("Streaming not available")
        assert str(error) == "Streaming not available"
        assert isinstance(error, LLMDomainError)


class TestExceptionCatching:
    """Tests for exception catching and handling."""

    def test_catch_specific_exception(self):
        with pytest.raises(ProviderNotFoundError) as exc_info:
            raise ProviderNotFoundError("Specific provider error")
        assert "Specific provider error" in str(exc_info.value)

    def test_catch_base_exception(self):
        with pytest.raises(LLMDomainError):
            raise ModelCreationError("Model error caught as base")

    def test_exception_with_context(self):
        original_error = ValueError("Original error")
        try:
            raise original_error
        except ValueError as e:
            with pytest.raises(AgentExecutionError) as exc_info:
                raise AgentExecutionError(f"Wrapped error: {e}") from e

        assert "Wrapped error" in str(exc_info.value)
        assert exc_info.value.__cause__ == original_error


class TestExceptionMessages:
    """Tests for exception message preservation."""

    def test_preserve_detailed_message(self):
        detailed_msg = (
            "Provider 'Ollama Local' not found in database. "
            "Available providers: ['OpenAI', 'Anthropic']. "
            "Please check provider name or ID."
        )
        error = ProviderNotFoundError(detailed_msg)
        assert str(error) == detailed_msg
        assert "Ollama Local" in str(error)
        assert "OpenAI" in str(error)

    def test_preserve_multiline_message(self):
        multiline_msg = """Model creation failed:
        - Provider: ollama
        - Model: llama3.2:latest
        - Error: Connection refused
        """
        error = ModelCreationError(multiline_msg)
        assert "Model creation failed" in str(error)
        assert "Connection refused" in str(error)

    def test_empty_message(self):
        error = LLMDomainError("")
        assert str(error) == ""

    def test_message_with_special_characters(self):
        msg = "Error with special chars: @#$%^&*()"
        error = InvalidConfigurationError(msg)
        assert "@#$%^&*()" in str(error)
