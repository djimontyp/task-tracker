from abc import ABC, abstractmethod
from typing import List, Dict, Any


class AbstractSourceAdapter(ABC):
    """Абстрактний базовий клас для адаптерів джерел"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.name = config.get("name", "Unknown")

    @abstractmethod
    async def fetch_messages(self) -> List[Dict[str, Any]]:
        """Отримати повідомлення з джерела"""
        pass

    @abstractmethod
    async def normalize_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Нормалізувати повідомлення до стандартного формату"""
        pass

    @abstractmethod
    async def mark_as_processed(self, message_id: str) -> None:
        """Позначити повідомлення як оброблене"""
        pass
