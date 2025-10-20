"""Legacy LLM module - DEPRECATED, use app.llm instead.

This module is kept for backward compatibility with existing agents.
New code should use app.llm.application.LLMService.

Migration guide:
    OLD: from core.llm import ollama_model
    NEW: from app.llm.startup import create_llm_service
         service = create_llm_service()
         agent = await service.create_agent(session, config)
"""

import logging
import warnings

from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.ollama import OllamaProvider

from core.config import settings

logger = logging.getLogger(__name__)

warnings.warn(
    "core.llm module is deprecated. Use app.llm.application.LLMService instead. "
    "See app/llm/startup.py for migration guide.",
    DeprecationWarning,
    stacklevel=2,
)


def get_legacy_model() -> OpenAIChatModel:
    """Get legacy Ollama model for backward compatibility.

    DEPRECATED: This function exists only for backward compatibility.
    New code should use LLMService from app.llm.application.

    Returns:
        OpenAIChatModel configured from settings

    Raises:
        ValueError: If provider configuration is invalid
    """
    logger.warning(
        "Using legacy get_legacy_model() - DEPRECATED. "
        "Migrate to app.llm.application.LLMService"
    )

    ollama_url = (
        settings.llm.ollama_base_url_docker
        if settings.llm.running_in_docker
        else settings.llm.ollama_base_url
    )

    ollama_provider = OllamaProvider(base_url=ollama_url)

    return OpenAIChatModel(
        model_name=settings.llm.ollama_model,
        provider=ollama_provider,
    )


_legacy_model: OpenAIChatModel | None = None


def _get_ollama_model() -> OpenAIChatModel:
    """Lazy-initialized legacy model."""
    global _legacy_model
    if _legacy_model is None:
        _legacy_model = get_legacy_model()
    return _legacy_model


ollama_model = _get_ollama_model()
