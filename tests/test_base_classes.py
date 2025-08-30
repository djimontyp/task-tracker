import pytest

# Тести для абстрактних базових класів


class TestAbstractClasses:
    """Тести для абстрактних базових класів"""

    def test_abstract_source_adapter_cannot_be_instantiated(self):
        """Перевірка, що абстрактний клас SourceAdapter не може бути інстанційований"""
        from adapters.base import AbstractSourceAdapter

        # Спроба створити екземпляр абстрактного класу повинна викликати TypeError
        with pytest.raises(TypeError):
            AbstractSourceAdapter({})

    def test_abstract_output_processor_cannot_be_instantiated(self):
        """Перевірка, що абстрактний клас OutputProcessor не може бути інстанційований"""
        from processors.base import AbstractOutputProcessor

        # Спроба створити екземпляр абстрактного класу повинна викликати TypeError
        with pytest.raises(TypeError):
            AbstractOutputProcessor({})

    def test_abstract_llm_provider_cannot_be_instantiated(self):
        """Перевірка, що абстрактний клас LLMProvider не може бути інстанційований"""
        from llm.base import AbstractLLMProvider

        # Спроба створити екземпляр абстрактного класу повинна викликати TypeError
        with pytest.raises(TypeError):
            AbstractLLMProvider({})
