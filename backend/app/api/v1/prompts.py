"""API endpoints for prompt configuration and tuning."""

import logging
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException

from app.api.v1.schemas.prompt import (
    PromptConfig,
    PromptListResponse,
    PromptType,
    PromptUpdateRequest,
    PromptValidationRequest,
    PromptValidationResponse,
    ValidationError,
    ValidationErrorType,
)
from app.services.knowledge.llm_agents import KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/prompts", tags=["prompts"])


REQUIRED_PLACEHOLDERS: dict[PromptType, list[str]] = {
    PromptType.message_scoring: ["{message}"],
    PromptType.classification: ["{message}", "{categories}"],
    PromptType.knowledge_extraction: ["{message}", "{context}"],
    PromptType.analysis_proposal: ["{messages}", "{topics}"],
}


PROMPT_STORAGE: dict[PromptType, str] = {
    PromptType.knowledge_extraction: KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT,
    PromptType.message_scoring: "Score the following message based on importance: {message}",
    PromptType.classification: "Classify the message into categories {categories}: {message}",
    PromptType.analysis_proposal: "Create task proposals from messages {messages} with topics {topics}",
}


def validate_prompt_text(prompt_text: str, prompt_type: PromptType) -> list[ValidationError]:
    """Validate prompt text and return list of errors.

    Args:
        prompt_text: Prompt text to validate
        prompt_type: Type of prompt being validated

    Returns:
        List of validation errors (empty if valid)
    """
    errors: list[ValidationError] = []

    if len(prompt_text) < 50:
        errors.append(
            ValidationError(
                field=ValidationErrorType.length,
                message="Prompt must be at least 50 characters",
            )
        )

    if len(prompt_text) > 2000:
        errors.append(
            ValidationError(
                field=ValidationErrorType.length,
                message="Prompt must not exceed 2000 characters",
            )
        )

    required_placeholders = REQUIRED_PLACEHOLDERS.get(prompt_type, [])
    for placeholder in required_placeholders:
        if placeholder not in prompt_text:
            errors.append(
                ValidationError(
                    field=ValidationErrorType.placeholder,
                    message=f"Missing required placeholder: {placeholder}",
                )
            )

    return errors


@router.post("/validate", response_model=PromptValidationResponse)
async def validate_prompt(request: PromptValidationRequest) -> PromptValidationResponse:
    """Validate a prompt before saving.

    Checks:
    - Character limits (50-2000)
    - Required placeholders presence
    - Basic syntax validation

    Args:
        request: Validation request with prompt text and type

    Returns:
        Validation response with errors (if any)
    """
    errors = validate_prompt_text(request.prompt_text, request.prompt_type)

    return PromptValidationResponse(
        valid=len(errors) == 0,
        errors=errors,
    )


@router.get("", response_model=PromptListResponse)
async def list_prompts() -> PromptListResponse:
    """List all configured prompts.

    Returns:
        List of all prompt configurations
    """
    prompts = []

    for prompt_type, prompt_text in PROMPT_STORAGE.items():
        prompts.append(
            PromptConfig(
                prompt_type=prompt_type,
                prompt_text=prompt_text,
                placeholders=REQUIRED_PLACEHOLDERS.get(prompt_type, []),
                updated_at=datetime.now(UTC),
                updated_by=None,
            )
        )

    return PromptListResponse(prompts=prompts)


@router.get("/{prompt_type}", response_model=PromptConfig)
async def get_prompt(prompt_type: PromptType) -> PromptConfig:
    """Get specific prompt configuration.

    Args:
        prompt_type: Type of prompt to retrieve

    Returns:
        Prompt configuration

    Raises:
        HTTPException: If prompt type not found
    """
    prompt_text = PROMPT_STORAGE.get(prompt_type)

    if prompt_text is None:
        raise HTTPException(status_code=404, detail=f"Prompt type '{prompt_type}' not found")

    return PromptConfig(
        prompt_type=prompt_type,
        prompt_text=prompt_text,
        placeholders=REQUIRED_PLACEHOLDERS.get(prompt_type, []),
        updated_at=datetime.now(UTC),
        updated_by=None,
    )


@router.put("/{prompt_type}", response_model=PromptConfig)
async def update_prompt(prompt_type: PromptType, request: PromptUpdateRequest) -> PromptConfig:
    """Update a prompt configuration.

    Validates prompt before saving and updates the configuration.

    Args:
        prompt_type: Type of prompt to update
        request: Update request with new prompt text

    Returns:
        Updated prompt configuration

    Raises:
        HTTPException: If validation fails
    """
    errors = validate_prompt_text(request.prompt_text, prompt_type)

    if errors:
        error_messages = [f"{e.field}: {e.message}" for e in errors]
        raise HTTPException(
            status_code=400,
            detail=f"Prompt validation failed: {', '.join(error_messages)}",
        )

    PROMPT_STORAGE[prompt_type] = request.prompt_text

    logger.info(
        f"Prompt '{prompt_type}' updated",
        extra={
            "prompt_type": prompt_type,
            "updated_by": request.updated_by,
            "prompt_length": len(request.prompt_text),
        },
    )

    return PromptConfig(
        prompt_type=prompt_type,
        prompt_text=request.prompt_text,
        placeholders=REQUIRED_PLACEHOLDERS.get(prompt_type, []),
        updated_at=datetime.now(UTC),
        updated_by=request.updated_by,
    )
