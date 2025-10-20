"""Knowledge extraction API endpoints for Topics and Atoms extraction from messages."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.models import AgentConfig
from app.tasks import extract_knowledge_from_messages_task

router = APIRouter()


class KnowledgeExtractionRequest(BaseModel):
    """Request schema for triggering knowledge extraction."""

    message_ids: list[int] = Field(
        min_length=1, max_length=100, description="Message IDs to analyze (1-100, 10-50 recommended)"
    )
    agent_config_id: UUID = Field(description="Agent Config UUID to use for extraction")


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

    **WebSocket Events:**
    - `knowledge.extraction_started` - Extraction begins
    - `knowledge.topic_created` - New topic created
    - `knowledge.atom_created` - New atom created
    - `knowledge.extraction_completed` - Extraction finished
    - `knowledge.extraction_failed` - Extraction failed

    **Recommended batch size:** 10-50 messages for optimal extraction quality.

    Args:
        request: Extraction request with message IDs and agent config
        db: Database session

    Returns:
        Response confirming extraction task was queued

    Raises:
        HTTPException 404: If agent config not found
        HTTPException 400: If request validation fails
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

    await extract_knowledge_from_messages_task.kiq(
        message_ids=request.message_ids, agent_config_id=str(request.agent_config_id)
    )

    return KnowledgeExtractionResponse(
        message=f"Knowledge extraction queued for {len(request.message_ids)} messages using agent '{agent_config.name}'",
        message_count=len(request.message_ids),
        agent_config_id=str(request.agent_config_id),
    )
