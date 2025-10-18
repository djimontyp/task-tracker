"""Service for interacting with Ollama API.

Provides functionality to query available models from Ollama instances.
"""

import logging
from typing import Any

import httpx

from app.models.llm_provider import OllamaModel, OllamaModelsResponse

logger = logging.getLogger(__name__)


class OllamaService:
    """Service for querying Ollama API endpoints."""

    def __init__(self, timeout: int = 10):
        """Initialize Ollama service.

        Args:
            timeout: HTTP request timeout in seconds (default: 10)
        """
        self.timeout = timeout

    async def list_models(self, host: str) -> OllamaModelsResponse:
        """Fetch list of available models from Ollama instance.

        Args:
            host: Ollama host URL (e.g., 'http://localhost:11434')

        Returns:
            OllamaModelsResponse with list of available models

        Raises:
            ValueError: If host URL is invalid or empty
            httpx.HTTPError: If connection to Ollama fails
            httpx.TimeoutException: If request times out
        """
        if not host or not host.strip():
            raise ValueError("Ollama host URL is required")

        base_url = host.rstrip("/")

        if base_url.endswith("/v1"):
            return await self._list_models_openai_api(base_url)
        else:
            return await self._list_models_native_api(base_url)

    async def _list_models_native_api(self, base_url: str) -> OllamaModelsResponse:
        """Fetch models using native Ollama API.

        Args:
            base_url: Base URL without trailing slash

        Returns:
            OllamaModelsResponse with parsed model data

        Raises:
            httpx.HTTPError: If request fails
            ValueError: If response format is invalid
        """
        url = f"{base_url}/api/tags"

        logger.debug(f"Fetching Ollama models from: {url}")

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(url)
            response.raise_for_status()

        data: dict[str, Any] = response.json()

        if "models" not in data:
            raise ValueError("Invalid response from Ollama API: missing 'models' field")

        models = []
        for model_data in data["models"]:
            try:
                models.append(
                    OllamaModel(
                        name=model_data["name"],
                        size=model_data.get("size", 0),
                        modified_at=model_data.get("modified_at", ""),
                    )
                )
            except KeyError as e:
                logger.warning(f"Skipping invalid model entry: {e}")
                continue

        logger.info(f"Retrieved {len(models)} models from Ollama at {base_url}")
        return OllamaModelsResponse(models=models)

    async def _list_models_openai_api(self, base_url: str) -> OllamaModelsResponse:
        """Fetch models using OpenAI-compatible API.

        Args:
            base_url: Base URL with /v1 suffix

        Returns:
            OllamaModelsResponse with parsed model data

        Raises:
            httpx.HTTPError: If request fails
            ValueError: If response format is invalid
        """
        url = f"{base_url}/models"

        logger.debug(f"Fetching Ollama models from OpenAI-compatible endpoint: {url}")

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(url)
            response.raise_for_status()

        data: dict[str, Any] = response.json()

        if "data" not in data:
            raise ValueError("Invalid response from Ollama OpenAI API: missing 'data' field")

        models = []
        for model_data in data["data"]:
            try:
                models.append(
                    OllamaModel(
                        name=model_data["id"],
                        size=0,
                        modified_at="",
                    )
                )
            except KeyError as e:
                logger.warning(f"Skipping invalid model entry: {e}")
                continue

        logger.info(f"Retrieved {len(models)} models from Ollama (OpenAI API) at {base_url}")
        return OllamaModelsResponse(models=models)
