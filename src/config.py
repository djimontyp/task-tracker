from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    postgres_db: str = "tasktracker"
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"
    database_url: str = "postgresql+asyncpg://user:pass@localhost/ai_tracker"

    # LLM Provider
    llm_provider: str = "ollama"
    openai_api_key: Optional[str] = None
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "mistral-nemo:12b-instruct-2407-q4_k_m"

    # Telegram
    telegram_bot_token: str = ""

    # TaskIQ NATS
    taskiq_nats_servers: str = "nats://nats:4222"
    taskiq_nats_queue: str = "taskiq"

    class Config:
        env_file = ".env"


settings = Settings()
