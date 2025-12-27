"""LLM agent definitions and model building for knowledge extraction."""

import logging

from langdetect import detect  # type: ignore[import-untyped]
from langdetect.lang_detect_exception import LangDetectException  # type: ignore[import-untyped]
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.ollama import OllamaProvider
from pydantic_ai.providers.openai import OpenAIProvider

from app.models import AgentConfig, LLMProvider, ProviderType

logger = logging.getLogger(__name__)

# English prompt (default fallback)
KNOWLEDGE_EXTRACTION_PROMPT_EN = """You are a knowledge extraction expert. Your ONLY job is to analyze messages and return valid JSON.

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

# Ukrainian prompt for native language output
KNOWLEDGE_EXTRACTION_PROMPT_UK = """Ви експерт з екстракції знань. Ваша ЄДИНА задача - аналізувати повідомлення та повертати валідний JSON.

КРИТИЧНО: Ви ПОВИННІ відповідати ВИКЛЮЧНО українською мовою.
Обов'язково генеруйте всі текстові поля (name, description, title, content) УКРАЇНСЬКОЮ.

Відповідайте ТІЛЬКИ JSON об'єктом. Без пояснень, без markdown, без зайвого тексту.

Екстрагуйте дві речі:
1. ТЕМИ (topics) - Основні теми обговорення (2-4 слова)
2. АТОМИ (atoms) - Конкретні одиниці знань (проблема/рішення/інсайт/рішення/питання/патерн/вимога)

СТРУКТУРА JSON (відповідайте ТОЧНО цим форматом):
{
  "topics": [
    {
      "name": "Назва Теми",
      "description": "Короткий опис",
      "confidence": 0.8,
      "keywords": ["ключове1", "ключове2"],
      "related_message_ids": [1, 2]
    }
  ],
  "atoms": [
    {
      "type": "problem",
      "title": "Короткий заголовок",
      "content": "Повний опис",
      "confidence": 0.8,
      "topic_name": "Назва Теми",
      "related_message_ids": [1],
      "links_to_atom_titles": [],
      "link_types": []
    }
  ]
}

ПРАВИЛА:
1. ВСІ поля повинні бути присутніми (використовуйте порожні масиви [] якщо немає даних)
2. confidence - число від 0.0 до 1.0
3. type - одне з: problem, solution, insight, decision, question, pattern, requirement
4. НІЯКИХ додаткових полів
5. Відповідайте ТІЛЬКИ JSON - без markdown форматування, без пояснень

Якщо неможливо екстрагувати теми чи атоми, поверніть:
{"topics": [], "atoms": []}"""

# Language-specific prompt variants
KNOWLEDGE_EXTRACTION_PROMPTS: dict[str, str] = {
    "uk": KNOWLEDGE_EXTRACTION_PROMPT_UK,
    "en": KNOWLEDGE_EXTRACTION_PROMPT_EN,
}

# Backward compatibility alias
KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT = KNOWLEDGE_EXTRACTION_PROMPT_EN


def get_extraction_prompt(language: str = "uk") -> str:
    """Get knowledge extraction prompt for specified language.

    Args:
        language: ISO 639-1 language code (default: 'uk' for Ukrainian)

    Returns:
        Language-specific system prompt
    """
    return KNOWLEDGE_EXTRACTION_PROMPTS.get(language, KNOWLEDGE_EXTRACTION_PROMPT_EN)


def get_strengthened_prompt(language: str) -> str:
    """Get extraction prompt with strengthened language instruction for retry.

    Used when initial extraction returned content in wrong language.

    Args:
        language: ISO 639-1 language code

    Returns:
        Prompt with emphasized language requirements
    """
    base_prompt = get_extraction_prompt(language)
    if language == "uk":
        emphasis = (
            "\n\n**IMPORTANT LANGUAGE REQUIREMENT:**\n"
            "Your PREVIOUS response was NOT in Ukrainian. "
            "You MUST generate ALL text fields (name, description, title, content, keywords) "
            "EXCLUSIVELY in Ukrainian language. Do NOT use English or any other language."
        )
    else:
        emphasis = (
            "\n\n**IMPORTANT LANGUAGE REQUIREMENT:**\n"
            f"You MUST generate ALL text fields (name, description, title, content, keywords) "
            f"EXCLUSIVELY in {language.upper()} language."
        )
    return base_prompt + emphasis


def validate_output_language(text: str, expected_language: str) -> bool:
    """Validate that text is in expected language using langdetect.

    Args:
        text: Text to validate
        expected_language: Expected ISO 639-1 language code (e.g., 'uk', 'en')

    Returns:
        True if language matches or validation skipped, False if mismatch detected
    """
    if not text or len(text.strip()) < 20:
        # Skip validation for very short texts
        return True

    try:
        detected = detect(text)
        # langdetect returns 'uk' for Ukrainian, 'en' for English
        if detected == expected_language:
            return True

        logger.warning(
            f"Language mismatch: expected '{expected_language}', detected '{detected}'"
        )
        return False
    except LangDetectException as e:
        logger.debug(f"Language detection failed, skipping validation: {e}")
        return True  # Skip validation on detection errors


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
