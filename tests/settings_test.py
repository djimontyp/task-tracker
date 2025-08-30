#!/usr/bin/env python3
"""Simple test script to verify settings"""

from config import settings

print("LLM Provider:", settings.llm_provider)
print("Ollama Base URL:", settings.ollama_base_url)
print("Ollama Model:", settings.ollama_model)
print("Database URL:", settings.database_url)
