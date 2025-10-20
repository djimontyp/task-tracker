"""OpenAI model factory for Pydantic AI adapter."""

from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

from app.llm.domain.exceptions import InvalidConfigurationError, ModelCreationError
from app.llm.domain.models import ProviderConfig
from app.llm.infrastructure.adapters.pydantic_ai.factories.base import BasePydanticAIFactory


class OpenAIModelFactory(BasePydanticAIFactory):
    """Factory for creating OpenAI models via Pydantic AI.

    Creates OpenAIChatModel instances configured to use OpenAI provider.
    Requires API key for authentication.
    """

    async def create_model(
        self,
        provider_config: ProviderConfig,
        model_name: str,
    ) -> OpenAIChatModel:
        """Create OpenAI model instance.

        Args:
            provider_config: Provider configuration with api_key
            model_name: Model name (e.g., 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo')

        Returns:
            OpenAIChatModel configured for OpenAI

        Raises:
            ModelCreationError: If API key missing or model creation fails
            InvalidConfigurationError: If configuration is invalid
        """
        self._validate_provider_config(provider_config)

        if provider_config.provider_type != "openai":
            raise ModelCreationError(
                f"Provider type mismatch: expected 'openai', got '{provider_config.provider_type}'"
            )

        if not provider_config.api_key:
            raise InvalidConfigurationError(
                "OpenAI provider missing API key. "
                "Please provide api_key for authentication."
            )

        try:
            openai_provider = OpenAIProvider(api_key=provider_config.api_key)
            return OpenAIChatModel(
                model_name=model_name,
                provider=openai_provider,
            )
        except Exception as e:
            raise ModelCreationError(
                f"Failed to create OpenAI model '{model_name}': {str(e)}"
            ) from e

    def supports_provider(self, provider_type: str) -> bool:
        """Check if factory supports a provider type.

        Args:
            provider_type: Provider type string

        Returns:
            True if provider_type is 'openai'
        """
        return provider_type == "openai"
