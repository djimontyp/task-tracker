from typing import List, Dict, Any
import json
from adapters.base import AbstractSourceAdapter
from llm.base import AbstractLLMProvider
from processors.base import AbstractOutputProcessor


class MessageProcessor:
    """Основний обробник повідомлень"""

    def __init__(
        self,
        source_adapter: AbstractSourceAdapter,
        llm_provider: AbstractLLMProvider,
        output_processor: AbstractOutputProcessor,
    ):
        self.source_adapter = source_adapter
        self.llm_provider = llm_provider
        self.output_processor = output_processor

    async def process_messages(self) -> List[Dict[str, Any]]:
        """Обробити повідомлення з джерела"""
        # Отримати повідомлення з джерела
        raw_messages = await self.source_adapter.fetch_messages()

        processed_issues = []

        for raw_message in raw_messages:
            # Нормалізувати повідомлення
            normalized_message = await self.source_adapter.normalize_message(
                raw_message
            )

            # Класифікувати повідомлення за допомогою LLM
            classification_result = await self.llm_provider.classify_issue(
                normalized_message["content"]
            )
            classification = self._parse_classification(classification_result)

            # Створити об'єкт проблеми
            issue = {
                "content": normalized_message["content"],
                "author": normalized_message["author"],
                "classification": classification["classification"],
                "category": classification["category"],
                "priority": classification["priority"],
                "confidence": classification["confidence"],
            }

            # Обробити проблему вихідним процесором
            success = await self.output_processor.process(issue)

            if success:
                # Позначити повідомлення як оброблене
                await self.source_adapter.mark_as_processed(raw_message["id"])
                processed_issues.append(issue)

        return processed_issues

    def _parse_classification(self, result: Any) -> Dict[str, Any]:
        """Уніфікувати результат класифікації від провайдера LLM.

        Підтримує:
        - словник із очікуваними ключами
        - об'єкт із атрибутами `.output` або `.output_text` (AgentRunResult від pydantic-ai)
        - рядок із JSON або просто текст
        """
        default = {
            "classification": "task",
            "category": "question",
            "priority": "low",
            "confidence": 0.0,
        }

        # Якщо приходить словник (зворотна сумісність із тестами)
        if isinstance(result, dict):
            return {
                "classification": result.get(
                    "classification", default["classification"]
                ),
                "category": result.get("category", default["category"]),
                "priority": result.get("priority", default["priority"]),
                "confidence": result.get("confidence", default["confidence"]),
            }

        # AgentRunResult: спробувати дістати текст виводу
        text = None
        output = getattr(result, "output", None)
        if isinstance(output, str):
            text = output
        if text is None:
            output_text = getattr(result, "output_text", None)
            if isinstance(output_text, str):
                text = output_text

        # Спробувати розпарсити JSON, якщо це текст
        if isinstance(text, str):
            try:
                data = json.loads(text)
                if isinstance(data, dict):
                    return {
                        "classification": data.get(
                            "classification", default["classification"]
                        ),
                        "category": data.get("category", default["category"]),
                        "priority": data.get("priority", default["priority"]),
                        "confidence": data.get("confidence", default["confidence"]),
                    }
            except Exception:
                pass

        # Фолбек: повертаємо дефолтні значення
        return default
