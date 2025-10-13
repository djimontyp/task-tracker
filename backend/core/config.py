from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = Field(
        default="Pulse Radar",
        validation_alias=AliasChoices("APP_NAME", "app_name"),
    )
    app_description: str = Field(
        default="AI-powered contextual workspace that organizes project information in smart, living knowledge containers with real-time pulse monitoring and intelligent automation.",
        validation_alias=AliasChoices("APP_DESCRIPTION", "app_description"),
    )

    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker",
        validation_alias=AliasChoices("DATABASE_URL", "database_url"),
    )
    migration_database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker"
    ollama_base_url: str = Field(
        default="http://localhost:11434",
        validation_alias=AliasChoices("OLLAMA_BASE_URL", "ollama_base_url"),
    )
    llm_provider: str = Field(default="ollama", validation_alias=AliasChoices("LLM_PROVIDER", "llm_provider"))
    ollama_model: str = Field(
        default="mistral-nemo:12b-instruct-2407-q4_k_m",
        validation_alias=AliasChoices("OLLAMA_MODEL", "ollama_model"),
    )
    telegram_bot_token: str = Field(
        default="",
        validation_alias=AliasChoices("TELEGRAM_BOT_TOKEN", "telegram_bot_token"),
    )
    # Telegram Client API credentials (for historical message fetching)
    telegram_api_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices("TELEGRAM_API_ID", "telegram_api_id"),
    )
    telegram_api_hash: str | None = Field(
        default=None,
        validation_alias=AliasChoices("TELEGRAM_API_HASH", "telegram_api_hash"),
    )
    telegram_session_string: str | None = Field(
        default=None,
        validation_alias=AliasChoices("TELEGRAM_SESSION_STRING", "telegram_session_string"),
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
        default="INFO",
        validation_alias=AliasChoices("LOG_LEVEL", "LOGURU_LEVEL", "log_level"),
    )
    webapp_url: str = Field(
        default="http://localhost:8000/webapp",
        validation_alias=AliasChoices("WEBAPP_URL", "webapp_url"),
    )
    api_base_url: str = Field(
        default="http://localhost:8000",
        validation_alias=AliasChoices("API_BASE_URL", "api_base_url"),
    )
    webhook_base_url: str = Field(
        default="http://localhost",
        validation_alias=AliasChoices("WEBHOOK_BASE_URL", "webhook_base_url"),
    )
    encryption_key: str = Field(
        default="",
        validation_alias=AliasChoices("ENCRYPTION_KEY", "encryption_key"),
    )


settings = Settings()
