"""API endpoints for message ingestion."""

import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlmodel import select

from app.dependencies import DatabaseDep
from app.models import IngestionStatus, MessageIngestionJob, MessageIngestionJobPublic
from app.tasks import ingest_telegram_messages_task

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ingestion", tags=["ingestion"])


class TelegramIngestionRequest(BaseModel):
    """Request to ingest messages from Telegram."""

    chat_ids: list[str]
    limit: int = 1000


class IngestionJobResponse(BaseModel):
    """Response with job ID."""

    job_id: int
    status: str
    message: str


@router.post("/telegram", response_model=IngestionJobResponse)
async def start_telegram_ingestion(
    request: TelegramIngestionRequest,
    db: DatabaseDep,
):
    """
    Start ingesting messages from Telegram chats.

    Creates a background job that fetches historical messages from specified chats.
    Progress can be tracked via WebSocket or by polling the job status endpoint.
    """
    try:
        # Create ingestion job
        job = MessageIngestionJob(
            source_type="telegram",
            source_identifiers={"chat_ids": request.chat_ids},
            status=IngestionStatus.pending,
            created_at=datetime.utcnow(),
        )

        db.add(job)
        await db.commit()
        await db.refresh(job)

        logger.info(f"Created ingestion job {job.id} for chats: {request.chat_ids}")

        # Start background task
        await ingest_telegram_messages_task.kiq(
            job_id=job.id,
            chat_ids=request.chat_ids,
            limit=request.limit,
        )

        return IngestionJobResponse(
            job_id=job.id,
            status="pending",
            message=f"Ingestion started for {len(request.chat_ids)} chat(s)",
        )

    except Exception as e:
        logger.error(f"Failed to start ingestion: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start ingestion: {str(e)}")


@router.get("/jobs/{job_id}", response_model=MessageIngestionJobPublic)
async def get_ingestion_job(job_id: int, db: DatabaseDep):
    """Get status of an ingestion job."""
    job = await db.get(MessageIngestionJob, job_id)

    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    return job


@router.get("/jobs", response_model=list[MessageIngestionJobPublic])
async def list_ingestion_jobs(
    db: DatabaseDep,
    limit: int = 50,
    status: str | None = None,
):
    """List ingestion jobs with optional status filter."""
    stmt = select(MessageIngestionJob).order_by(MessageIngestionJob.created_at.desc()).limit(limit)

    if status:
        try:
            status_enum = IngestionStatus(status)
            stmt = stmt.where(MessageIngestionJob.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    result = await db.execute(stmt)
    jobs = result.scalars().all()

    return jobs
