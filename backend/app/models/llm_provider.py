"""LLM Provider model for managing AI service configurations."""
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Text, func
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

    # Primary Key
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Core Fields
    name: str = Field(
        sa_type=Text,
        unique=True,
        index=True,
        description="Unique provider name",
    )
    type: ProviderType = Field(description="Provider type (ollama, openai)")

    # Connection Configuration
    base_url: Optional[str] = Field(
        default=None,
        sa_type=Text,
        description="Base URL for provider API (e.g., http://localhost:11434)",
    )
    api_key_encrypted: Optional[bytes] = Field(
        default=None,
        description="Fernet-encrypted API key",
    )

    # Status & Validation
    is_active: bool = Field(default=True, description="Provider is active")
    validation_status: ValidationStatus = Field(
        default=ValidationStatus.pending,
        description="Connection validation status",
    )
    validation_error: Optional[str] = Field(
        default=None,
        sa_type=Text,
        description="Last validation error message",
    )
    validated_at: Optional[datetime] = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        description="Timestamp of last validation attempt",
    )

    # Timestamps
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now()},
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()},
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


# API Schemas
class LLMProviderCreate(SQLModel):
    """Schema for creating new LLM provider."""

    name: str
    type: ProviderType
    base_url: Optional[str] = None
    api_key: Optional[str] = None  # Plain text, will be encrypted
    is_active: bool = True


class LLMProviderUpdate(SQLModel):
    """Schema for updating LLM provider."""

    name: Optional[str] = None
    type: Optional[ProviderType] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None  # Plain text, will be encrypted
    is_active: Optional[bool] = None


class LLMProviderPublic(SQLModel):
    """Public schema for LLM provider responses."""

    id: UUID
    name: str
    type: ProviderType
    base_url: Optional[str] = None
    # Note: api_key_encrypted NOT included in public response
    is_active: bool
    validation_status: ValidationStatus
    validation_error: Optional[str] = None
    validated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
