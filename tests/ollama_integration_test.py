#!/usr/bin/env python3
"""Simple test script to verify Ollama integration with the project"""

import asyncio

from llm.ollama import OllamaProvider
from config import settings


def test_ollama_initialization():
    """Test that we can initialize the Ollama provider"""
    print("Testing Ollama provider initialization...")
    
    config = {
        "model": settings.ollama_model,  # Update model name from settings
        "base_url": settings.ollama_base_url
    }
    
    print(f"Config model: {config['model']}")
    print(f"Config base_url: {config['base_url']}")
    
    try:
        provider = OllamaProvider(config)
        print(f"✓ Successfully initialized Ollama provider")
        print(f"  Model: {provider.model_name}")
        print(f"  Base URL: {provider.base_url}")
        print(f"  Model object: {provider.model}")
        return provider
    except Exception as e:
        print(f"✗ Failed to initialize Ollama provider: {e}")
        return None


async def test_classification(provider, test_message):
    """Test issue classification"""
    print(f"\nTesting issue classification with message: '{test_message}'")
    
    try:
        result = await provider.classify_issue(test_message)
        print(f"✓ Classification successful:")
        print(f"  Output: {result.output}")
        return result
    except Exception as e:
        print(f"✗ Classification failed: {e}")
        return None


async def test_entity_extraction(provider, test_message):
    """Test entity extraction"""
    print(f"\nTesting entity extraction with message: '{test_message}'")
    
    try:
        result = await provider.extract_entities(test_message)
        print(f"✓ Entity extraction successful:")
        print(f"  Output: {result.output}")
        return result
    except Exception as e:
        print(f"✗ Entity extraction failed: {e}")
        return None


async def main():
    """Main test function"""
    print("=" * 50)
    print("Ollama Integration Test")
    print("=" * 50)
    
    # Test initialization
    provider = test_ollama_initialization()
    if not provider:
        return
    
    # Test messages
    test_messages = [
        "The login page is not loading properly, users are getting timeout errors.",
        "We need to add a new feature to export reports in PDF format.",
        "Can you help me understand how the authentication system works?"
    ]
    
    # Test each message
    for i, message in enumerate(test_messages, 1):
        print(f"\n--- Test Message {i} ---")
        await test_classification(provider, message)
        await test_entity_extraction(provider, message)
    
    print("\n" + "=" * 50)
    print("Test completed!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
