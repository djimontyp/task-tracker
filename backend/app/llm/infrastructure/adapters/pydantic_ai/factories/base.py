"""Base factory for creating Pydantic AI models from provider configurations."""

from abc import ABC, abstractmethod
from typing import Any

from app.llm.domain.exceptions import InvalidConfigurationError, ModelCreationError
from app.llm.domain.models import ModelInfo, ProviderConfig
from app.llm.domain.ports import ModelFactory


class BasePydanticAIFactory(ABC, ModelFactory):
    """Base factory for creating Pydantic AI models from providers.

    This abstract class provides common validation logic and defines
    the interface that concrete provider factories must implement.
    """

    @abstractmethod
    async def create_model(
        self,
        provider_config: ProviderConfig,
        model_name: str,
    ) -> Any:
        """Create framework-specific model instance.

        Args:
            provider_config: Provider configuration (URLs, keys, etc.)
            model_name: Model identifier/name

        Returns:
            Pydantic AI model instance

        Raises:
            ModelCreationError: If model creation fails
            InvalidConfigurationError: If configuration is invalid
        """
        pass

    async def validate_provider(
        self,
        provider_config: ProviderConfig,
    ) -> tuple[bool, str | None]:
        """Validate provider configuration.

        Base implementation checks required fields. Subclasses can override
        to add provider-specific validation (e.g., connectivity checks).

        Args:
            provider_config: Provider configuration to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            self._validate_provider_config(provider_config)
            return (True, None)
        except (ModelCreationError, InvalidConfigurationError) as e:
            return (False, str(e))

    def get_model_info(
        self,
        model: Any,
    ) -> ModelInfo:
        """Get metadata about a model instance.

        Default implementation provides basic info. Subclasses can enhance
        with provider-specific details.

        Args:
            model: Framework-specific model instance

        Returns:
            Model information and capabilities
        """
        model_name = getattr(model, "model_name", "unknown")
        provider_type = self.supports_provider("")

        return ModelInfo(
            name=model_name,
            provider_type=provider_type if isinstance(provider_type, str) else "unknown",
            supports_streaming=True,
            supports_tools=True,
        )

    @abstractmethod
    def supports_provider(
        self,
        provider_type: str,
    ) -> bool:
        """Check if factory supports a provider type.

        Args:
            provider_type: Provider type string (e.g., 'ollama', 'openai')

        Returns:
            True if provider type is supported
        """
        pass

    def _validate_provider_config(self, provider_config: ProviderConfig) -> None:
        """Validate provider has required configuration.

        Base validation checks that provider_config is not None.
        Subclasses should override to add specific validation.

        Args:
            provider_config: Provider configuration to validate

        Raises:
            InvalidConfigurationError: If configuration is invalid
        """
        if not provider_config:
            raise InvalidConfigurationError("Provider configuration is required")

        if not provider_config.provider_type:
            raise InvalidConfigurationError("Provider type is required")
