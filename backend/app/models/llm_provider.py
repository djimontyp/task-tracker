"""LLM Provider model for managing AI service configurations."""

from datetime import UTC, datetime
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, Text, func
from sqlmodel import Field, SQLModel


class ProviderType(str, Enum):
    """Supported LLM provider types."""

    ollama = "ollama"
    openai = "openai"


class ValidationStatus(str, Enum):
    """Provider validation status."""

    pending = "pending"
    validating = "validating"
    connected = "connected"
    error = "error"


class LLMProvider(SQLModel, table=True):
    """
    LLM Provider configuration.

    Stores credentials and connection details for AI service providers.
    Supports both local (Ollama) and cloud (OpenAI) providers.
    """

    __tablename__ = "llm_providers"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    name: str = Field(
        sa_type=Text,
        unique=True,
        index=True,
        description="Unique provider name",
    )
    type: ProviderType = Field(description="Provider type (ollama, openai)")

    base_url: str | None = Field(
        default=None,
        sa_type=Text,
        description="Base URL for provider API (e.g., http://localhost:11434)",
    )
    api_key_encrypted: bytes | None = Field(
        default=None,
        description="Fernet-encrypted API key",
    )

    is_active: bool = Field(default=True, description="Provider is active")
    validation_status: ValidationStatus = Field(
        default=ValidationStatus.pending,
        description="Connection validation status",
    )
    validation_error: str | None = Field(
        default=None,
        sa_type=Text,
        description="Last validation error message",
    )
    validated_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True)),
        description="Timestamp of last validation attempt",
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now()),
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "name": "Ollama Local",
                "type": "ollama",
                "base_url": "http://localhost:11434",
                "is_active": True,
                "validation_status": "pending",
            }
        }


class LLMProviderCreate(SQLModel):
    """Schema for creating new LLM provider."""

    name: str
    type: ProviderType
    base_url: str | None = None
    api_key: str | None = None
    is_active: bool = True


class LLMProviderUpdate(SQLModel):
    """Schema for updating LLM provider."""

    name: str | None = None
    type: ProviderType | None = None
    base_url: str | None = None
    api_key: str | None = None
    is_active: bool | None = None


class LLMProviderPublic(SQLModel):
    """Public schema for LLM provider responses."""

    id: UUID
    name: str
    type: ProviderType
    base_url: str | None = None
    is_active: bool
    validation_status: ValidationStatus
    validation_error: str | None = None
    validated_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class OllamaModel(SQLModel):
    """Schema for single Ollama model information."""

    name: str = Field(description="Model name (e.g., 'llama3.2:latest')")
    size: int = Field(description="Model size in bytes")
    modified_at: str = Field(description="Last modification timestamp")


class OllamaModelsResponse(SQLModel):
    """Response schema for Ollama models listing."""

    models: list[OllamaModel] = Field(
        default_factory=list,
        description="List of available Ollama models",
    )
