from pydantic import Field, AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker",
        validation_alias=AliasChoices("DATABASE_URL", "database_url"),
    )
    ollama_base_url: str = Field(
        default="http://localhost:11434",
        validation_alias=AliasChoices("OLLAMA_BASE_URL", "ollama_base_url"),
    )
    llm_provider: str = Field(
        default="ollama", validation_alias=AliasChoices("LLM_PROVIDER", "llm_provider")
    )
    ollama_model: str = Field(
        default="mistral-nemo:12b-instruct-2407-q4_k_m",
        validation_alias=AliasChoices("OLLAMA_MODEL", "ollama_model"),
    )
    telegram_bot_token: str = Field(
        default="",
        validation_alias=AliasChoices("TELEGRAM_BOT_TOKEN", "telegram_bot_token"),
    )
    taskiq_nats_servers: str = Field(
        default="nats://localhost:4222",
        validation_alias=AliasChoices("TASKIQ_NATS_SERVERS", "taskiq_nats_servers"),
    )
    taskiq_nats_queue: str = Field(
        default="taskiq",
        validation_alias=AliasChoices("TASKIQ_NATS_QUEUE", "taskiq_nats_queue"),
    )
    log_level: str = Field(
        default="INFO", validation_alias=AliasChoices("LOG_LEVEL", "log_level")
    )


settings = Settings()
