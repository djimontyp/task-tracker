from typing import Dict, Any, List
from llm.base import AbstractLLMProvider
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.ollama import OllamaProvider as PydanticAIOllamaProvider
from config import settings


class OllamaProvider(AbstractLLMProvider):
    """Провайдер LLM для локального використання з Ollama"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.model_name = config.get("model", settings.ollama_model)
        self.base_url = config.get("base_url", settings.ollama_base_url)

        # Ініціалізація клієнта Ollama через pydantic-ai
        self.model = OpenAIChatModel(
            model_name=self.model_name,
            provider=PydanticAIOllamaProvider(base_url=self.base_url + "/v1"),
        )

        # Агенти для різних завдань
        self.classification_agent = Agent(self.model)
        self.entity_extraction_agent = Agent(self.model)

    async def classify_issue(self, message: str) -> Dict[str, Any]:
        """Класифікувати повідомлення та повернути результат класифікації"""
        # Визначення системного запиту для класифікації
        system_prompt = """
        Ви є експертом з класифікації повідомлень. Ваше завдання - визначити, чи є повідомлення 
        описом задачі/проблеми, і якщо так, то визначити категорію та пріоритет.
        
        Поверніть JSON з наступними полями:
        - is_issue (bool): Чи є повідомлення описом задачі/проблеми
        - category (str): Категорія задачі (bug, feature, improvement, question)
        - priority (str): Пріоритет (low, medium, high, critical)
        - confidence (float): Впевненість у класифікації (0.0-1.0)
        """

        # Виконання класифікації
        result = await self.classification_agent.run(
            system_prompt + "\n\nПовідомлення для аналізу: " + message
        )

        # Повертаємо результат
        return result

    async def extract_entities(self, message: str) -> Any:
        """Видобути сутності з повідомлення"""
        # Визначення системного запиту для видобування сутностей
        system_prompt = """
        Ви є експертом з видобування сутностей з тексту. Ваше завдання - визначити 
        всі важливі сутності з повідомлення, такі як:
        - Назви проектів
        - Компоненти системи
        - Технології
        - Імена людей
        - Дати
        - Версії
        
        Поверніть список сутностей у вигляді масиву рядків.
        """

        # Виконання видобування сутностей
        result = await self.entity_extraction_agent.run(
            system_prompt + "\n\nПовідомлення для аналізу: " + message
        )

        # Повертаємо сирий результат агента (AgentRunResult) без доступу до .data
        return result
