"""Gemini model factory for Pydantic AI adapter."""

from pydantic_ai.models.google import GoogleModel
from pydantic_ai.providers.google import GoogleProvider

from app.llm.domain.exceptions import InvalidConfigurationError, ModelCreationError
from app.llm.domain.models import ProviderConfig
from app.llm.infrastructure.adapters.pydantic_ai.factories.base import BasePydanticAIFactory


class GeminiModelFactory(BasePydanticAIFactory):
    """Factory for creating Gemini models via Pydantic AI.

    Creates GoogleModel instances configured to use Google AI provider.
    Requires Google API key for authentication.
    """

    async def create_model(
        self,
        provider_config: ProviderConfig,
        model_name: str,
    ) -> GoogleModel:
        """Create Gemini model instance.

        Args:
            provider_config: Provider configuration with api_key
            model_name: Model name (e.g., 'gemini-2.0-flash', 'gemini-1.5-pro')

        Returns:
            GoogleModel configured for Gemini

        Raises:
            ModelCreationError: If API key missing or model creation fails
            InvalidConfigurationError: If configuration is invalid
        """
        self._validate_provider_config(provider_config)

        if provider_config.provider_type != "gemini":
            raise ModelCreationError(
                f"Provider type mismatch: expected 'gemini', got '{provider_config.provider_type}'"
            )

        if not provider_config.api_key:
            raise InvalidConfigurationError(
                "Gemini provider missing API key. Please provide api_key for authentication."
            )

        try:
            google_provider = GoogleProvider(api_key=provider_config.api_key)
            return GoogleModel(
                model_name=model_name,
                provider=google_provider,
            )
        except Exception as e:
            raise ModelCreationError(f"Failed to create Gemini model '{model_name}': {str(e)}") from e

    def supports_provider(self, provider_type: str) -> bool:
        """Check if factory supports a provider type.

        Args:
            provider_type: Provider type string

        Returns:
            True if provider_type is 'gemini'
        """
        return provider_type == "gemini"
