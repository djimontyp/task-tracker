"""Knowledge extraction API endpoints for Topics and Atoms extraction from messages."""

from datetime import UTC, datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.models import (
    AgentConfig,
    ExtractionStatus,
    KnowledgeExtractionRun,
    KnowledgeExtractionRunPublic,
)
from app.services.knowledge.knowledge_orchestrator import get_messages_by_period
from app.services.websocket_manager import websocket_manager
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

    message_ids: list[UUID] | None = Field(
        default=None,
        min_length=1,
        max_length=100,
        description="Message IDs to analyze (1-100, 10-50 recommended). Mutually exclusive with period.",
    )
    period: PeriodRequest | None = Field(
        default=None, description="Period-based message selection. Mutually exclusive with message_ids."
    )
    agent_config_id: UUID = Field(description="Agent Config UUID to use for extraction")
    project_config_id: UUID | None = Field(
        default=None, description="Optional ProjectConfig UUID for domain-specific context injection"
    )
    include_context: bool = Field(
        default=False, description="Whether to include surrounding messages as context (CAG)"
    )
    context_window: int = Field(
        default=5, ge=1, le=20, description="Number of messages to include before/after (+/- N)"
    )

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
    extraction_id: int = Field(description="Extraction run ID for tracking and cancellation")
    task_id: str | None = Field(default=None, description="TaskIQ task ID")


class CancelExtractionResponse(BaseModel):
    """Response schema for extraction cancellation."""

    message: str = Field(description="Cancellation status message")
    extraction_id: int = Field(description="Extraction run ID")
    status: ExtractionStatus = Field(description="New extraction status")


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
    - `knowledge.extraction_cancelling` - Cancellation requested
    - `knowledge.extraction_cancelled` - Extraction cancelled

    **Recommended batch size:** 10-50 messages for optimal extraction quality.

    Args:
        request: Extraction request with message IDs/period and agent config
        db: Database session

    Returns:
        Response with extraction_id for tracking and cancellation

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

    # Create extraction run record
    extraction_run = KnowledgeExtractionRun(
        agent_config_id=request.agent_config_id,
        status=ExtractionStatus.pending,
        message_count=len(message_ids),
    )
    db.add(extraction_run)
    await db.commit()
    await db.refresh(extraction_run)

    task = await extract_knowledge_from_messages_task.kiq(
        message_ids=message_ids,
        agent_config_id=str(request.agent_config_id),
        created_by="api_trigger",
        project_config_id=str(request.project_config_id) if request.project_config_id else None,
        extraction_run_id=str(extraction_run.id),
        include_context=request.include_context,
        context_window=request.context_window,
    )

    # Update extraction run with task_id
    extraction_run.task_id = task.task_id
    db.add(extraction_run)
    await db.commit()

    return KnowledgeExtractionResponse(
        message=f"Knowledge extraction queued for {len(message_ids)} messages using agent '{agent_config.name}'",
        message_count=len(message_ids),
        agent_config_id=str(request.agent_config_id),
        extraction_id=extraction_run.id,  # type: ignore[arg-type]
        task_id=task.task_id,
    )


@router.post(
    "/extract/{extraction_id}/cancel",
    response_model=CancelExtractionResponse,
    status_code=status.HTTP_200_OK,
)
async def cancel_knowledge_extraction(
    extraction_id: int, db: DatabaseDep
) -> CancelExtractionResponse:
    """Request cancellation of a running knowledge extraction.

    Sets `cancel_requested=True` and `status='cancelling'`. The worker will
    check this flag at checkpoints and exit gracefully.

    **Cancellation checkpoints:**
    1. Before LLM call
    2. After LLM extraction, before saving
    3. After topics saved, before atoms

    **Note:** Cannot cancel mid-LLM call (atomic operation). Expect 3-5 second
    delay between request and actual cancellation.

    **WebSocket Events:**
    - `knowledge.extraction_cancelling` - Cancellation requested
    - `knowledge.extraction_cancelled` - Extraction cancelled successfully

    Args:
        extraction_id: ID of the extraction run to cancel
        db: Database session

    Returns:
        Updated extraction status

    Raises:
        HTTPException 404: If extraction run not found
        HTTPException 400: If extraction is not in a cancellable state
    """
    extraction_run = await db.get(KnowledgeExtractionRun, extraction_id)
    if not extraction_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Extraction run {extraction_id} not found",
        )

    # Only allow cancellation for pending/running states
    if extraction_run.status not in (ExtractionStatus.pending, ExtractionStatus.running):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel extraction in '{extraction_run.status}' state. "
            f"Only 'pending' or 'running' extractions can be cancelled.",
        )

    # Set cancellation flag and status
    extraction_run.cancel_requested = True
    extraction_run.status = ExtractionStatus.cancelling
    db.add(extraction_run)
    await db.commit()
    await db.refresh(extraction_run)

    # Broadcast cancelling event
    await websocket_manager.broadcast(
        "knowledge",
        {
            "type": "knowledge.extraction_cancelling",
            "data": {
                "extraction_id": str(extraction_id),
                "agent_config_id": str(extraction_run.agent_config_id),
            },
        },
    )

    return CancelExtractionResponse(
        message="Cancellation requested. Extraction will stop at the next checkpoint.",
        extraction_id=extraction_id,
        status=extraction_run.status,
    )


@router.get(
    "/extract/{extraction_id}",
    response_model=KnowledgeExtractionRunPublic,
    status_code=status.HTTP_200_OK,
)
async def get_extraction_status(
    extraction_id: int, db: DatabaseDep
) -> KnowledgeExtractionRunPublic:
    """Get the current status of a knowledge extraction run.

    Returns full details including progress counters, timestamps, and error info.

    Args:
        extraction_id: ID of the extraction run
        db: Database session

    Returns:
        Extraction run details

    Raises:
        HTTPException 404: If extraction run not found
    """
    extraction_run = await db.get(KnowledgeExtractionRun, extraction_id)
    if not extraction_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Extraction run {extraction_id} not found",
        )

    return KnowledgeExtractionRunPublic.model_validate(extraction_run)
