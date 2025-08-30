import pytest


class TestTaskCreationProcessor:
    """Тести для обробника виводу (Task Creation Processor)"""

    def test_task_creator_initialization(self):
        """Перевірка ініціалізації обробника створення завдань"""
        from processors.task_creator import TaskCreationProcessor

        config = {"target_system": "jira"}
        processor = TaskCreationProcessor(config)

        assert processor.target_system == "jira"
        assert processor.name == "Unknown"  # Значення за замовчуванням

    @pytest.mark.asyncio
    async def test_task_creator_process(self):
        """Перевірка обробки проблеми обробником створення завдань"""
        from processors.task_creator import TaskCreationProcessor

        config = {"target_system": "jira"}
        processor = TaskCreationProcessor(config)

        issue = {
            "content": "Test issue",
            "author": "Test User",
            "classification": "task",
            "category": "feature",
            "priority": "medium",
            "confidence": 0.85,
        }

        result = await processor.process(issue)

        assert isinstance(result, bool)
        # Зараз завжди повертає True в заглушці
        assert result is True
