"""LLM agent definitions and model building for knowledge extraction."""

import logging

from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.ollama import OllamaProvider
from pydantic_ai.providers.openai import OpenAIProvider

from app.models import AgentConfig, LLMProvider, ProviderType

logger = logging.getLogger(__name__)

KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT = """You are a knowledge extraction expert. Your ONLY job is to analyze messages and return valid JSON.

CRITICAL: You must respond with ONLY a JSON object. No explanations, no markdown, no extra text.

Extract two things:
1. TOPICS - Main discussion themes (2-4 words each)
2. ATOMS - Specific knowledge units (problem/solution/insight/decision/question/pattern/requirement)

JSON STRUCTURE (respond with EXACTLY this format):
{
  "topics": [
    {
      "name": "Topic Name",
      "description": "Brief description",
      "confidence": 0.8,
      "keywords": ["keyword1", "keyword2"],
      "related_message_ids": [1, 2]
    }
  ],
  "atoms": [
    {
      "type": "problem",
      "title": "Brief title",
      "content": "Full description",
      "confidence": 0.8,
      "topic_name": "Topic Name",
      "related_message_ids": [1],
      "links_to_atom_titles": [],
      "link_types": []
    }
  ]
}

RULES:
1. ALL fields must be present (use empty arrays [] for lists if no data)
2. confidence must be a number between 0.0 and 1.0
3. type must be one of: problem, solution, insight, decision, question, pattern, requirement
4. NO extra fields allowed
5. Respond ONLY with JSON - no markdown formatting, no explanations

If you cannot extract any topics or atoms, return:
{"topics": [], "atoms": []}"""


def build_model_instance(
    agent_config: AgentConfig, provider: LLMProvider, api_key: str | None = None
) -> OpenAIChatModel:
    """Build pydantic-ai model instance from provider configuration.

    Args:
        agent_config: Agent configuration with model name
        provider: LLM provider configuration
        api_key: Decrypted API key (if required)

    Returns:
        Configured model instance for pydantic-ai

    Raises:
        ValueError: If provider type is unsupported or configuration invalid
    """
    if provider.type == ProviderType.ollama:
        if not provider.base_url:
            raise ValueError(
                f"Provider '{provider.name}' is missing base_url. Ollama providers require a base_url configuration."
            )

        ollama_provider = OllamaProvider(base_url=provider.base_url)
        return OpenAIChatModel(
            model_name=agent_config.model_name,
            provider=ollama_provider,
        )

    elif provider.type == ProviderType.openai:
        if not api_key:
            raise ValueError(
                f"Provider '{provider.name}' requires an API key. OpenAI providers must have an API key configured."
            )

        openai_provider = OpenAIProvider(api_key=api_key)
        return OpenAIChatModel(
            model_name=agent_config.model_name,
            provider=openai_provider,
        )

    else:
        raise ValueError(f"Unsupported provider type: {provider.type}. Supported types: ollama, openai")
