"""Converters between domain models and Pydantic AI framework types.

This module handles translation between framework-agnostic domain models
and Pydantic AI-specific types, maintaining separation of concerns.
"""

from typing import Any

from pydantic_ai.result import RunUsage
from pydantic_ai.settings import ModelSettings

from app.llm.domain.models import AgentConfig, UsageInfo


def agent_config_to_model_settings(config: AgentConfig) -> ModelSettings | None:
    """Convert domain AgentConfig to Pydantic AI ModelSettings.

    Extracts temperature and max_tokens from agent configuration and
    creates Pydantic AI ModelSettings object if any settings are present.

    Args:
        config: Domain agent configuration

    Returns:
        ModelSettings if temperature/max_tokens set, else None

    Example:
        >>> config = AgentConfig(name="test", model_name="gpt-4", temperature=0.7)
        >>> settings = agent_config_to_model_settings(config)
        >>> settings["temperature"]
        0.7
    """
    if config.temperature is None and config.max_tokens is None:
        return None

    settings = ModelSettings()

    if config.temperature is not None:
        settings["temperature"] = config.temperature

    if config.max_tokens is not None:
        settings["max_tokens"] = config.max_tokens

    return settings


def pydantic_usage_to_domain(usage: RunUsage | None) -> UsageInfo | None:
    """Convert Pydantic AI RunUsage to domain UsageInfo.

    Translates Pydantic AI's usage tracking object into framework-agnostic
    domain model for token consumption.

    Args:
        usage: Pydantic AI usage object (or None)

    Returns:
        UsageInfo domain model (or None if input is None)

    Example:
        >>> usage = RunUsage(request_tokens=10, response_tokens=20)
        >>> domain_usage = pydantic_usage_to_domain(usage)
        >>> domain_usage.total_tokens
        30
    """
    if usage is None:
        return None

    return UsageInfo(
        prompt_tokens=usage.request_tokens or 0,
        completion_tokens=usage.response_tokens or 0,
        total_tokens=usage.total_tokens or 0,
    )


def extract_messages_from_result(result: Any) -> list[dict[str, Any]] | None:
    """Extract messages from Pydantic AI result.

    Safely extracts conversation messages from result if available.
    Different result types may have messages in different formats.

    Args:
        result: Pydantic AI result object

    Returns:
        List of message dictionaries if available, else None

    Example:
        >>> messages = extract_messages_from_result(result)
        >>> # Returns: [{"role": "user", "content": "..."}, ...]
    """
    if not hasattr(result, "all_messages"):
        return None

    try:
        messages = result.all_messages()
        if not messages:
            return None

        return [
            {
                "role": msg.role if hasattr(msg, "role") else "unknown",
                "content": msg.content if hasattr(msg, "content") else str(msg),
            }
            for msg in messages
        ]
    except Exception:
        return None
