from abc import ABC, abstractmethod
from typing import Dict, Any, List


class AbstractLLMProvider(ABC):
    """Абстрактний базовий клас для провайдерів LLM"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.name = config.get("name", "Unknown")

    @abstractmethod
    async def classify_issue(self, message: str) -> Dict[str, Any]:
        """Класифікувати повідомлення та повернути результат класифікації"""
        pass

    @abstractmethod
    async def extract_entities(self, message: str) -> List[str]:
        """Видобути сутності з повідомлення"""
        pass
