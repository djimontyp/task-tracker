from config import settings
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.ollama import OllamaProvider

providers = {
    "ollama": OllamaProvider(base_url=settings.ollama_base_url),
}

ollama_model = OpenAIChatModel(  # noqa
    model_name=settings.ollama_model,
    provider=providers[settings.llm_provider],
)
