from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).parent.parent.parent / ".env"


class DatabaseSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ENV_FILE), extra="ignore")

    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker",
        validation_alias=AliasChoices("DATABASE_URL", "database_url"),
    )
    migration_database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker"


class TelegramSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ENV_FILE), extra="ignore")

    telegram_bot_token: str = Field(
        default="",
        validation_alias=AliasChoices("TELEGRAM_BOT_TOKEN", "telegram_bot_token"),
    )
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


class LLMSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ENV_FILE), extra="ignore")

    ollama_base_url: str = Field(
        default="http://localhost:11434",
        validation_alias=AliasChoices("OLLAMA_BASE_URL", "ollama_base_url"),
    )
    ollama_base_url_docker: str = Field(
        default="http://host.docker.internal:11434",
        validation_alias=AliasChoices("OLLAMA_BASE_URL_DOCKER", "ollama_base_url_docker"),
    )
    running_in_docker: bool = Field(
        default=False,
        validation_alias=AliasChoices("RUNNING_IN_DOCKER", "running_in_docker"),
    )
    llm_provider: str = Field(default="ollama", validation_alias=AliasChoices("LLM_PROVIDER", "llm_provider"))
    ollama_model: str = Field(
        default="mistral-nemo:12b-instruct-2407-q4_k_m",
        validation_alias=AliasChoices("OLLAMA_MODEL", "ollama_model"),
    )


class TaskIQSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ENV_FILE), extra="ignore")

    taskiq_nats_servers: str = Field(
        default="nats://nats:4222",
        validation_alias=AliasChoices("TASKIQ_NATS_SERVERS", "taskiq_nats_servers"),
    )
    taskiq_nats_queue: str = Field(
        default="taskiq",
        validation_alias=AliasChoices("TASKIQ_NATS_QUEUE", "taskiq_nats_queue"),
    )


class EmbeddingSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ENV_FILE), extra="ignore")

    openai_embedding_model: str = Field(
        default="text-embedding-3-small",
        validation_alias=AliasChoices("OPENAI_EMBEDDING_MODEL", "openai_embedding_model"),
    )
    openai_embedding_dimensions: int = Field(
        default=1536,
        validation_alias=AliasChoices("OPENAI_EMBEDDING_DIMENSIONS", "openai_embedding_dimensions"),
    )
    ollama_embedding_model: str = Field(
        default="llama3",
        validation_alias=AliasChoices("OLLAMA_EMBEDDING_MODEL", "ollama_embedding_model"),
    )
    vector_similarity_threshold: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        validation_alias=AliasChoices("VECTOR_SIMILARITY_THRESHOLD", "vector_similarity_threshold"),
    )
    vector_search_limit: int = Field(
        default=10,
        ge=1,
        le=100,
        validation_alias=AliasChoices("VECTOR_SEARCH_LIMIT", "vector_search_limit"),
    )
    embedding_batch_size: int = Field(
        default=100,
        ge=1,
        le=1000,
        validation_alias=AliasChoices("EMBEDDING_BATCH_SIZE", "embedding_batch_size"),
    )


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ENV_FILE), extra="ignore")

    app_name: str = Field(
        default="Pulse Radar",
        validation_alias=AliasChoices("APP_NAME", "app_name"),
    )
    app_description: str = Field(
        default="AI-powered contextual workspace that organizes project information in smart, living knowledge containers with real-time pulse monitoring and intelligent automation.",
        validation_alias=AliasChoices("APP_DESCRIPTION", "app_description"),
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
    log_level: str = Field(
        default="INFO",
        validation_alias=AliasChoices("LOG_LEVEL", "LOGURU_LEVEL", "log_level"),
    )


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ENV_FILE), extra="ignore")

    app: AppSettings = Field(default_factory=AppSettings)
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    telegram: TelegramSettings = Field(default_factory=TelegramSettings)
    llm: LLMSettings = Field(default_factory=LLMSettings)
    taskiq: TaskIQSettings = Field(default_factory=TaskIQSettings)
    embedding: EmbeddingSettings = Field(default_factory=EmbeddingSettings)


settings = Settings()
