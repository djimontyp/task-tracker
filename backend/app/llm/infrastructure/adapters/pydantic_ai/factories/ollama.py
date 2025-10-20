"""Ollama model factory for Pydantic AI adapter."""

from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.ollama import OllamaProvider

from app.llm.domain.exceptions import InvalidConfigurationError, ModelCreationError
from app.llm.domain.models import ProviderConfig
from app.llm.infrastructure.adapters.pydantic_ai.factories.base import BasePydanticAIFactory


class OllamaModelFactory(BasePydanticAIFactory):
    """Factory for creating Ollama models via Pydantic AI.

    Creates OpenAIChatModel instances configured to use Ollama provider.
    Ollama uses OpenAI-compatible API, so we use OpenAIChatModel with
    OllamaProvider for compatibility.
    """

    async def create_model(
        self,
        provider_config: ProviderConfig,
        model_name: str,
    ) -> OpenAIChatModel:
        """Create Ollama model instance.

        Args:
            provider_config: Provider configuration with base_url
            model_name: Model name (e.g., 'llama3.2:latest', 'qwen2.5-coder:7b')

        Returns:
            OpenAIChatModel configured for Ollama

        Raises:
            ModelCreationError: If provider type wrong or base_url missing
            InvalidConfigurationError: If configuration is invalid
        """
        self._validate_provider_config(provider_config)

        if provider_config.provider_type != "ollama":
            raise ModelCreationError(
                f"Provider type mismatch: expected 'ollama', got '{provider_config.provider_type}'"
            )

        if not provider_config.base_url:
            raise InvalidConfigurationError(
                "Ollama provider missing base_url configuration. "
                "Please provide base_url (e.g., 'http://localhost:11434')"
            )

        try:
            ollama_provider = OllamaProvider(base_url=provider_config.base_url)
            return OpenAIChatModel(
                model_name=model_name,
                provider=ollama_provider,
            )
        except Exception as e:
            raise ModelCreationError(
                f"Failed to create Ollama model '{model_name}': {str(e)}"
            ) from e

    def supports_provider(self, provider_type: str) -> bool:
        """Check if factory supports a provider type.

        Args:
            provider_type: Provider type string

        Returns:
            True if provider_type is 'ollama'
        """
        return provider_type == "ollama"
