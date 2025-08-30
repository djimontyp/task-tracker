from typing import Optional
from pydantic import Field, AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Pydantic v2 settings config
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker",
        validation_alias=AliasChoices("DATABASE_URL", "database_url"),
    )

    # LLM Provider
    llm_provider: str = Field(
        default="ollama", validation_alias=AliasChoices("LLM_PROVIDER", "llm_provider")
    )
    openai_api_key: Optional[str] = Field(
        default=None, validation_alias=AliasChoices("OPENAI_API_KEY", "openai_api_key")
    )
    ollama_base_url: str = Field(
        default="http://localhost:11434",
        validation_alias=AliasChoices("OLLAMA_BASE_URL", "ollama_base_url"),
    )
    ollama_model: str = Field(
        default="mistral-nemo:12b-instruct-2407-q4_k_m",
        validation_alias=AliasChoices("OLLAMA_MODEL", "ollama_model"),
    )

    # Telegram
    telegram_bot_token: str = Field(
        default="",
        validation_alias=AliasChoices("TELEGRAM_BOT_TOKEN", "telegram_bot_token"),
    )

    # TaskIQ NATS
    taskiq_nats_servers: str = Field(
        default="nats://localhost:4222",
        validation_alias=AliasChoices("TASKIQ_NATS_SERVERS", "taskiq_nats_servers"),
    )
    taskiq_nats_queue: str = Field(
        default="taskiq",
        validation_alias=AliasChoices("TASKIQ_NATS_QUEUE", "taskiq_nats_queue"),
    )

    # Integration Tests
    run_integration_tests: bool = Field(
        default=False,
        validation_alias=AliasChoices("RUN_INTEGRATION_TESTS", "run_integration_tests"),
    )

    # Output Processor
    output_processor_type: str = Field(
        default="jira",
        validation_alias=AliasChoices("OUTPUT_PROCESSOR_TYPE", "output_processor_type"),
    )
    jira_url: str = Field(
        default="https://your-company.atlassian.net",
        validation_alias=AliasChoices("JIRA_URL", "jira_url"),
    )
    jira_username: str = Field(
        default="your_email@example.com",
        validation_alias=AliasChoices("JIRA_USERNAME", "jira_username"),
    )
    jira_api_token: str = Field(
        default="your_jira_api_token_here",
        validation_alias=AliasChoices("JIRA_API_TOKEN", "jira_api_token"),
    )

    # Logging
    log_level: str = Field(
        default="INFO", validation_alias=AliasChoices("LOG_LEVEL", "log_level")
    )


settings = Settings()
