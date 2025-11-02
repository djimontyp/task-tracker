"""Pydantic schemas for prompt configuration API."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class PromptType(str, Enum):
    """Types of prompts used in the system."""

    message_scoring = "message_scoring"
    classification = "classification"
    knowledge_extraction = "knowledge_extraction"
    analysis_proposal = "analysis_proposal"


class ValidationErrorType(str, Enum):
    """Types of validation errors."""

    length = "length"
    placeholder = "placeholder"
    syntax = "syntax"


class ValidationError(BaseModel):
    """Single validation error."""

    field: ValidationErrorType
    message: str


class PromptConfig(BaseModel):
    """Prompt configuration model."""

    prompt_type: PromptType
    prompt_text: str = Field(..., min_length=50, max_length=2000)
    placeholders: list[str]
    updated_at: datetime
    updated_by: str | None = None

    class Config:
        json_schema_extra = {
            "example": {
                "prompt_type": "knowledge_extraction",
                "prompt_text": "Extract knowledge from the following message: {message}",
                "placeholders": ["{message}", "{context}"],
                "updated_at": "2025-01-15T10:30:00Z",
                "updated_by": "admin@example.com",
            }
        }


class PromptValidationRequest(BaseModel):
    """Request model for prompt validation."""

    prompt_text: str = Field(..., min_length=1, max_length=3000)
    prompt_type: PromptType

    class Config:
        json_schema_extra = {
            "example": {
                "prompt_text": "Analyze this message: {message} with context: {context}",
                "prompt_type": "knowledge_extraction",
            }
        }


class PromptValidationResponse(BaseModel):
    """Response model for prompt validation."""

    valid: bool
    errors: list[ValidationError]

    class Config:
        json_schema_extra = {
            "example": {
                "valid": False,
                "errors": [
                    {
                        "field": "length",
                        "message": "Prompt must be at least 50 characters",
                    }
                ],
            }
        }


class PromptUpdateRequest(BaseModel):
    """Request model for updating a prompt."""

    prompt_text: str = Field(..., min_length=50, max_length=2000)
    updated_by: str | None = None

    @field_validator("prompt_text")
    @classmethod
    def validate_not_empty(cls, v: str) -> str:
        """Validate prompt text is not empty after stripping."""
        if not v.strip():
            raise ValueError("Prompt text cannot be empty")
        return v.strip()

    class Config:
        json_schema_extra = {
            "example": {
                "prompt_text": "Extract knowledge from the following message: {message} using context: {context}",
                "updated_by": "admin@example.com",
            }
        }


class PromptListResponse(BaseModel):
    """Response model for listing all prompts."""

    prompts: list[PromptConfig]

    class Config:
        json_schema_extra = {
            "example": {
                "prompts": [
                    {
                        "prompt_type": "knowledge_extraction",
                        "prompt_text": "Extract knowledge from: {message}",
                        "placeholders": ["{message}", "{context}"],
                        "updated_at": "2025-01-15T10:30:00Z",
                        "updated_by": "admin@example.com",
                    }
                ]
            }
        }
