"""Knowledge extraction API endpoints for Topics and Atoms extraction from messages."""

from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.models import AgentConfig
from app.services.knowledge.knowledge_orchestrator import get_messages_by_period
from app.tasks import extract_knowledge_from_messages_task

router = APIRouter()


class PeriodRequest(BaseModel):
    """Period-based message selection for knowledge extraction."""

    period_type: Literal["last_24h", "last_7d", "last_30d", "custom"] = Field(
        description="Time period type: last_24h, last_7d, last_30d, or custom"
    )
    topic_id: int | None = Field(default=None, description="Optional topic ID to filter messages")
    start_date: datetime | None = Field(
        default=None, description="Start date for custom period (timezone-aware, required for custom)"
    )
    end_date: datetime | None = Field(
        default=None, description="End date for custom period (timezone-aware, required for custom)"
    )


class KnowledgeExtractionRequest(BaseModel):
    """Request schema for triggering knowledge extraction."""

    message_ids: list[int] | None = Field(
        default=None,
        min_length=1,
        max_length=100,
        description="Message IDs to analyze (1-100, 10-50 recommended). Mutually exclusive with period.",
    )
    period: PeriodRequest | None = Field(
        default=None, description="Period-based message selection. Mutually exclusive with message_ids."
    )
    agent_config_id: UUID = Field(description="Agent Config UUID to use for extraction")

    @model_validator(mode="after")
    def validate_message_selection(self) -> "KnowledgeExtractionRequest":
        """Ensure exactly one of message_ids or period is provided."""
        if self.message_ids is None and self.period is None:
            raise ValueError("Either message_ids or period must be provided")
        if self.message_ids is not None and self.period is not None:
            raise ValueError("Cannot specify both message_ids and period, choose one")
        return self


class KnowledgeExtractionResponse(BaseModel):
    """Response schema for knowledge extraction trigger."""

    message: str = Field(description="Success message")
    message_count: int = Field(description="Number of messages queued for extraction")
    agent_config_id: str = Field(description="Agent Config UUID used for extraction")


DatabaseDep = Annotated[AsyncSession, Depends(get_db_session)]


@router.post("/extract", response_model=KnowledgeExtractionResponse, status_code=status.HTTP_202_ACCEPTED)
async def trigger_knowledge_extraction(
    request: KnowledgeExtractionRequest, db: DatabaseDep
) -> KnowledgeExtractionResponse:
    """Trigger manual knowledge extraction from selected messages.

    Queues a background task to analyze messages and extract:
    - **Topics**: Discussion themes and contexts
    - **Atoms**: Atomic knowledge units (problems, solutions, decisions, insights)
    - **Links**: Relationships between atoms

    The task processes messages in batches and broadcasts real-time updates via WebSocket.

    **Message Selection Methods:**
    1. **Direct IDs**: Provide `message_ids` list (1-100, 10-50 recommended)
    2. **Time Period**: Provide `period` object with:
       - `period_type`: "last_24h", "last_7d", "last_30d", or "custom"
       - `topic_id`: Optional topic filter
       - `start_date`, `end_date`: Required for custom periods

    **WebSocket Events:**
    - `knowledge.extraction_started` - Extraction begins
    - `knowledge.topic_created` - New topic created
    - `knowledge.atom_created` - New atom created
    - `knowledge.version_created` - Version created for existing entity
    - `knowledge.extraction_completed` - Extraction finished
    - `knowledge.extraction_failed` - Extraction failed

    **Recommended batch size:** 10-50 messages for optimal extraction quality.

    Args:
        request: Extraction request with message IDs/period and agent config
        db: Database session

    Returns:
        Response confirming extraction task was queued

    Raises:
        HTTPException 404: If agent config not found
        HTTPException 400: If request validation fails or no messages found
    """
    agent_config = await db.get(AgentConfig, request.agent_config_id)
    if not agent_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Agent config {request.agent_config_id} not found"
        )

    if not agent_config.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Agent config '{agent_config.name}' is not active"
        )

    if request.message_ids is not None:
        message_ids = request.message_ids
    else:
        try:
            message_ids = await get_messages_by_period(
                db=db,
                period_type=request.period.period_type,  # type: ignore[union-attr]
                topic_id=request.period.topic_id,  # type: ignore[union-attr]
                start_date=request.period.start_date,  # type: ignore[union-attr]
                end_date=request.period.end_date,  # type: ignore[union-attr]
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

        if len(message_ids) == 0:
            period_desc = f"period {request.period.period_type}"  # type: ignore[union-attr]
            if request.period.topic_id:  # type: ignore[union-attr]
                period_desc += f" and topic_id {request.period.topic_id}"  # type: ignore[union-attr]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=f"No messages found for the selected {period_desc}"
            )

    await extract_knowledge_from_messages_task.kiq(
        message_ids=message_ids, agent_config_id=str(request.agent_config_id), created_by="api_trigger"
    )

    return KnowledgeExtractionResponse(
        message=f"Knowledge extraction queued for {len(message_ids)} messages using agent '{agent_config.name}'",
        message_count=len(message_ids),
        agent_config_id=str(request.agent_config_id),
    )
