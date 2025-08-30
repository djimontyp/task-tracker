from abc import ABC, abstractmethod
from typing import Dict, Any


class AbstractOutputProcessor(ABC):
    """Абстрактний базовий клас для обробників виводу"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.name = config.get("name", "Unknown")

    @abstractmethod
    async def process(self, issue: Dict[str, Any]) -> bool:
        """Обробити проблему та повернути результат успішності"""
        pass
