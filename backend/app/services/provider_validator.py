"""Asynchronous LLM provider validation service.

Validates connectivity and model availability for configured LLM providers
without blocking API responses.
"""

import asyncio
from datetime import datetime

import httpx
from sqlmodel import select

from app.database import AsyncSessionLocal
from app.models import LLMProvider, ProviderType, ValidationStatus
from app.services.websocket_manager import websocket_manager


class ProviderValidator:
    """Service for asynchronous provider connectivity validation.

    Validates provider configurations in background to avoid blocking
    API responses during provider creation/update.
    """

    def __init__(self, timeout: int = 10):
        """Initialize validator.

        Args:
            timeout: HTTP request timeout in seconds (default: 10)
        """
        self.timeout = timeout

    async def validate_provider_async(
        self,
        provider_id: str,
    ) -> None:
        """Validate provider connectivity asynchronously.

        Args:
            provider_id: UUID of provider to validate

        Updates provider validation_status, validation_error, and validated_at
        in database based on validation result.
        """
        async with AsyncSessionLocal() as session:
            try:
                result = await session.execute(select(LLMProvider).where(LLMProvider.id == provider_id))
                provider = result.scalar_one_or_none()

                if not provider:
                    return

                provider.validation_status = ValidationStatus.validating
                await session.commit()

                try:
                    if provider.type == ProviderType.ollama:
                        await self._validate_ollama(provider)
                    elif provider.type == ProviderType.openai:
                        await self._validate_openai(provider)
                    elif provider.type == ProviderType.gemini:
                        await self._validate_gemini(provider)
                    else:
                        raise ValueError(f"Unknown provider type: {provider.type}")

                    provider.validation_status = ValidationStatus.connected
                    provider.validation_error = None

                except Exception as e:
                    provider.validation_status = ValidationStatus.error
                    provider.validation_error = str(e)

                provider.validated_at = datetime.utcnow()
                await session.commit()

                try:
                    await websocket_manager.broadcast(
                        "providers",
                        {
                            "event": "validation_update",
                            "provider_id": str(provider.id),
                            "validation_status": provider.validation_status.value,
                            "validation_error": provider.validation_error,
                            "validated_at": provider.validated_at.isoformat() if provider.validated_at else None,
                        },
                    )
                except Exception:
                    pass

            except Exception:
                await session.rollback()
                raise

    async def _validate_ollama(self, provider: LLMProvider) -> None:
        """Validate Ollama provider connectivity.

        Args:
            provider: Ollama provider configuration

        Raises:
            ValueError: If base_url is not configured
            httpx.HTTPError: If connection fails
        """
        if not provider.base_url:
            raise ValueError("Ollama provider requires base_url")

        base_url = provider.base_url.rstrip("/")

        if base_url.endswith("/v1"):
            url = f"{base_url}/models"
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url)
            response.raise_for_status()

            data = response.json()
            if "data" not in data:
                raise ValueError("Invalid response from Ollama OpenAI API")
        else:
            url = f"{base_url}/api/tags"
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url)
            response.raise_for_status()

            data = response.json()
            if "models" not in data:
                raise ValueError("Invalid response from Ollama API")

    async def _validate_openai(self, provider: LLMProvider) -> None:
        """Validate OpenAI provider connectivity.

        Args:
            provider: OpenAI provider configuration

        Raises:
            ValueError: If API key is not configured
            httpx.HTTPError: If authentication fails
        """
        if not provider.api_key_encrypted:
            raise ValueError("OpenAI provider requires api_key")

        from app.services.credential_encryption import CredentialEncryption

        encryption = CredentialEncryption()
        api_key = encryption.decrypt(provider.api_key_encrypted)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                "https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {api_key}"},
            )
            response.raise_for_status()

            data = response.json()
            if "data" not in data:
                raise ValueError("Invalid response from OpenAI API")

    async def _validate_gemini(self, provider: LLMProvider) -> None:
        """Validate Google Gemini provider connectivity.

        Args:
            provider: Gemini provider configuration

        Raises:
            ValueError: If API key is not configured or response invalid
            httpx.HTTPError: If authentication fails
        """
        if not provider.api_key_encrypted:
            raise ValueError("Gemini provider requires api_key")

        from app.services.credential_encryption import CredentialEncryption

        encryption = CredentialEncryption()
        api_key = encryption.decrypt(provider.api_key_encrypted)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                "https://generativelanguage.googleapis.com/v1beta/models",
                params={"key": api_key},
            )
            response.raise_for_status()

            data = response.json()
            if "models" not in data:
                raise ValueError("Invalid response from Gemini API")

    async def close(self) -> None:
        """Close resources (no-op: clients are context-managed)."""
        return

    def schedule_validation(self, provider_id: str) -> asyncio.Task:
        """Schedule provider validation as background task.

        Args:
            provider_id: UUID of provider to validate

        Returns:
            Asyncio task handle for the validation

        Example:
            validator = ProviderValidator()
            task = validator.schedule_validation(provider.id)
            # Task runs in background, no await needed
        """
        return asyncio.create_task(self.validate_provider_async(provider_id))
