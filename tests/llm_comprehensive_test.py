#!/usr/bin/env python3
"""Comprehensive test script to demonstrate LLM functionality with Ukrainian messages"""

import asyncio

from llm.ollama import OllamaProvider
from config import settings


def test_ollama_initialization():
    """Test that we can initialize the Ollama provider"""
    print("=" * 60)
    print("Ollama Provider Initialization Test")
    print("=" * 60)
    
    config = {
        "model": settings.ollama_model,
        "base_url": settings.ollama_base_url
    }
    
    print(f"Config model: {config['model']}")
    print(f"Config base_url: {config['base_url']}")
    
    try:
        provider = OllamaProvider(config)
        print(f"✓ Successfully initialized Ollama provider")
        print(f"  Model: {provider.model_name}")
        print(f"  Base URL: {provider.base_url}")
        return provider
    except Exception as e:
        print(f"✗ Failed to initialize Ollama provider: {e}")
        return None


async def test_classification(provider, test_message, test_name):
    """Test issue classification"""
    print(f"\n--- {test_name} ---")
    print(f"Повідомлення: '{test_message}'")
    
    try:
        result = await provider.classify_issue(test_message)
        print(f"✓ Класифікація успішна:")
        print(f"  Результат: {result.output}")
        return result
    except Exception as e:
        print(f"✗ Класифікація не вдалася: {e}")
        return None


async def test_entity_extraction(provider, test_message, test_name):
    """Test entity extraction"""
    print(f"\n--- {test_name} ---")
    print(f"Повідомлення: '{test_message}'")
    
    try:
        result = await provider.extract_entities(test_message)
        print(f"✓ Видобування сутностей успішне:")
        print(f"  Результат: {result.output}")
        return result
    except Exception as e:
        print(f"✗ Видобування сутностей не вдалося: {e}")
        return None


async def main():
    """Main test function"""
    print("=" * 60)
    print("Комплексне тестування інтеграції LLM з українськими повідомленнями")
    print("=" * 60)
    
    # Test initialization
    provider = test_ollama_initialization()
    if not provider:
        return
    
    # Test cases with Ukrainian messages
    test_cases = [
        {
            "name": "Повідомлення про помилку",
            "message": "Сторінка входу не завантажується, користувачі отримують помилки таймауту.",
            "type": "both"
        },
        {
            "name": "Запит на нову функцію",
            "message": "Потрібно додати нову функцію для експорту звітів у форматі PDF.",
            "type": "both"
        },
        {
            "name": "Питання",
            "message": "Допоможіть зрозуміти, як працює система автентифікації?",
            "type": "both"
        },
        {
            "name": "Пропозиція щодо вдосконалення",
            "message": "Інтерфейс користувача можна покращити, додавши кращий контраст кольорів для доступності.",
            "type": "both"
        }
    ]
    
    # Run tests
    for test_case in test_cases:
        if test_case["type"] in ["both", "classification"]:
            await test_classification(provider, test_case["message"], test_case["name"])
        if test_case["type"] in ["both", "extraction"]:
            await test_entity_extraction(provider, test_case["message"], test_case["name"])
    
    print("\n" + "=" * 60)
    print("Всі тести завершено!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
