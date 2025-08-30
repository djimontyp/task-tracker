from typing import List, Dict, Any
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
            classification = await self.llm_provider.classify_issue(
                normalized_message["content"]
            )

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
