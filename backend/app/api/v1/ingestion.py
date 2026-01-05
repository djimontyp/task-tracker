"""API endpoints for message ingestion."""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Literal, cast

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import Column
from sqlmodel import select

from app.dependencies import DatabaseDep
from app.models import IngestionStatus, MessageIngestionJob, MessageIngestionJobPublic
from app.services.source_adapters import TelegramSourceAdapter, MessageCountResult
from app.tasks import ingest_telegram_messages_task

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ingestion", tags=["ingestion"])

# Type alias for depth options
DepthOption = Literal["skip", "24h", "7d", "30d", "all"]

# Mapping from depth option to timedelta (None means no time filter)
DEPTH_TO_TIMEDELTA: dict[DepthOption, timedelta | None] = {
    "skip": None,  # Skip import entirely
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
    "all": None,  # No time filter - fetch all available
}


def depth_to_offset_date(depth: DepthOption) -> datetime | None:
    """
    Convert depth option to offset_date for Telegram API.

    Args:
        depth: Time-based depth option

    Returns:
        datetime cutoff for messages, or None for no filter
    """
    if depth == "skip":
        return None  # Will be handled specially - no import

    delta = DEPTH_TO_TIMEDELTA.get(depth)
    if delta is None:
        return None  # "all" - no time filter

    return datetime.utcnow() - delta


class TelegramIngestionRequest(BaseModel):
    """Request to ingest messages from Telegram."""

    chat_ids: list[str]
    limit: int = 1000
    depth: DepthOption = Field(
        default="7d",
        description="Time-based depth for message import: skip (no import), 24h, 7d, 30d, or all",
    )


class IngestionJobResponse(BaseModel):
    """Response with job ID."""

    job_id: int
    status: str
    message: str


# Type alias for estimate depth (excludes "skip" option)
EstimateDepth = Literal["24h", "7d", "30d", "all"]


class MessageEstimateRequest(BaseModel):
    """Request to estimate message counts from Telegram chats."""

    chat_ids: list[str] = Field(
        ...,
        min_length=1,
        description="List of Telegram chat IDs to estimate messages for",
    )
    depth: EstimateDepth = Field(
        default="7d",
        description="Time-based depth for estimation: 24h, 7d, 30d, or all",
    )


class MessageEstimateResult(BaseModel):
    """Estimate result for a single chat."""

    source_id: str
    count: int | None
    is_estimate: bool
    error: str | None

    @classmethod
    def from_adapter_result(cls, result: MessageCountResult) -> "MessageEstimateResult":
        """Create from adapter MessageCountResult."""
        return cls(
            source_id=result.source_id,
            count=result.count,
            is_estimate=result.is_estimate,
            error=result.error,
        )


class MessageEstimateResponse(BaseModel):
    """Response with message count estimates."""

    estimates: list[MessageEstimateResult]
    depth: EstimateDepth
    total_count: int | None = Field(
        None,
        description="Sum of all successful estimates (None if any failed)",
    )


# Type alias for GET estimate depth (includes "skip" option for frontend UI)
GetEstimateDepth = Literal["skip", "24h", "7d", "30d", "all"]


class ChatEstimateResult(BaseModel):
    """Estimate result for a single chat (GET endpoint response item).

    Simplified response format for frontend consumption.
    """

    chat_id: str
    count: int | None
    is_estimate: bool
    error: str | None = None

    @classmethod
    def from_adapter_result(cls, result: MessageCountResult) -> "ChatEstimateResult":
        """Create from adapter MessageCountResult."""
        return cls(
            chat_id=result.source_id,
            count=result.count,
            is_estimate=result.is_estimate,
            error=result.error,
        )


def _estimate_depth_to_datetime(depth: EstimateDepth) -> datetime | None:
    """
    Convert estimate depth to datetime cutoff.

    Args:
        depth: Time-based depth option (24h, 7d, 30d, all)

    Returns:
        datetime cutoff for messages, or None for "all"
    """
    mapping: dict[EstimateDepth, timedelta | None] = {
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
        "all": None,
    }

    delta = mapping.get(depth)
    if delta is None:
        return None

    return datetime.utcnow() - delta


def _get_depth_to_datetime(depth: GetEstimateDepth) -> datetime | None:
    """
    Convert GET estimate depth to datetime cutoff.

    Args:
        depth: Time-based depth option (skip, 24h, 7d, 30d, all)

    Returns:
        datetime cutoff for messages, or None for "all" or "skip"
    """
    if depth == "skip":
        return None  # Skip means no estimation needed

    mapping: dict[str, timedelta | None] = {
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
        "all": None,
    }

    delta = mapping.get(depth)
    if delta is None:
        return None

    return datetime.utcnow() - delta


@router.get("/telegram/estimate", response_model=list[ChatEstimateResult])
async def get_telegram_message_estimates(
    chat_ids: list[str] = Query(
        ...,
        alias="chat_ids[]",
        description="List of Telegram chat IDs to estimate messages for",
        min_length=1,
    ),
    depth: GetEstimateDepth = Query(
        default="7d",
        description="Time-based depth for estimation: skip, 24h, 7d, 30d, or all",
    ),
) -> list[ChatEstimateResult]:
    """
    Estimate message counts from Telegram chats (GET variant).

    This endpoint is designed for frontend consumption with query parameters.
    Fetches approximate message counts for each specified chat ID within
    the given time depth.

    Query Parameters:
        chat_ids[]: List of Telegram chat IDs (required, at least 1)
        depth: Time-based depth for estimation (default: 7d)
            - skip: Return empty counts (no API calls)
            - 24h: Count messages from last 24 hours
            - 7d: Count messages from last 7 days (default)
            - 30d: Count messages from last 30 days
            - all: Count all available messages

    Returns:
        List of estimate results for each chat with count or error

    Note:
        - Rate limit errors are returned per-chat, not as HTTP errors
        - Partial results are returned if some chats fail
        - Counts are fetched in parallel for efficiency
    """
    logger.info(f"GET estimate: {len(chat_ids)} chats, depth={depth}")

    # Handle "skip" depth - return empty results without API calls
    if depth == "skip":
        logger.info("Skip depth requested - returning empty counts")
        return [
            ChatEstimateResult(
                chat_id=chat_id,
                count=0,
                is_estimate=False,
                error=None,
            )
            for chat_id in chat_ids
        ]

    # Calculate cutoff datetime
    since = _get_depth_to_datetime(depth)

    # Create adapter instance
    adapter = TelegramSourceAdapter()

    async def fetch_count(chat_id: str) -> MessageCountResult:
        """Fetch count for a single chat (handles its own errors)."""
        return await adapter.get_message_count(chat_id, since=since)

    # Fetch counts in parallel using asyncio.gather
    results = await asyncio.gather(
        *[fetch_count(chat_id) for chat_id in chat_ids],
        return_exceptions=False,  # Errors are handled in adapter
    )

    # Convert to response models
    estimates = [ChatEstimateResult.from_adapter_result(r) for r in results]

    logger.info(
        f"GET estimate results: {[(e.chat_id, e.count, e.error) for e in estimates]}"
    )

    return estimates


@router.post("/telegram/estimate", response_model=MessageEstimateResponse)
async def estimate_telegram_messages(
    request: MessageEstimateRequest,
) -> MessageEstimateResponse:
    """
    Estimate message counts from Telegram chats.

    Fetches approximate message counts for each specified chat ID within
    the given time depth. Useful for onboarding UI to show expected import size.

    Counts are fetched in parallel for efficiency. Rate limit errors are
    returned per-chat rather than failing the entire request.

    Args:
        request: Estimate request with chat_ids and depth:
            - 24h: Count messages from last 24 hours
            - 7d: Count messages from last 7 days (default)
            - 30d: Count messages from last 30 days
            - all: Count all available messages

    Returns:
        Estimates for each chat with total count if all succeeded
    """
    logger.info(f"Estimating message counts for {len(request.chat_ids)} chats (depth={request.depth})")

    # Calculate cutoff datetime
    since = _estimate_depth_to_datetime(request.depth)

    # Create adapter instance
    adapter = TelegramSourceAdapter()

    async def fetch_count(chat_id: str) -> MessageCountResult:
        """Fetch count for a single chat (handles its own errors)."""
        return await adapter.get_message_count(chat_id, since=since)

    # Fetch counts in parallel using asyncio.gather
    results = await asyncio.gather(
        *[fetch_count(chat_id) for chat_id in request.chat_ids],
        return_exceptions=False,  # Errors are handled in adapter
    )

    # Convert to response models
    estimates = [MessageEstimateResult.from_adapter_result(r) for r in results]

    # Calculate total if all estimates succeeded
    all_successful = all(e.count is not None for e in estimates)
    total_count = sum(e.count for e in estimates if e.count is not None) if all_successful else None

    logger.info(
        f"Estimated counts: {[(e.source_id, e.count) for e in estimates]}, "
        f"total={total_count}, depth={request.depth}"
    )

    return MessageEstimateResponse(
        estimates=estimates,
        depth=request.depth,
        total_count=total_count,
    )


@router.post("/telegram", response_model=IngestionJobResponse)
async def start_telegram_ingestion(
    request: TelegramIngestionRequest,
    db: DatabaseDep,
) -> IngestionJobResponse:
    """
    Start ingesting messages from Telegram chats.

    Creates a background job that fetches historical messages from specified chats.
    Progress can be tracked via WebSocket or by polling the job status endpoint.

    Args:
        request: Ingestion request with chat_ids, limit, and depth options:
            - skip: Skip history import entirely (useful for fresh start)
            - 24h: Import last 24 hours of messages
            - 7d: Import last 7 days (default)
            - 30d: Import last 30 days
            - all: Import all available history
    """
    # Handle "skip" depth - return immediately without creating job
    if request.depth == "skip":
        logger.info(f"Skipping history import for chats: {request.chat_ids} (depth=skip)")
        return IngestionJobResponse(
            job_id=0,
            status="skipped",
            message="History import skipped as requested",
        )

    try:
        # Calculate offset_date based on depth
        offset_date = depth_to_offset_date(request.depth)
        offset_date_iso = offset_date.isoformat() if offset_date else None

        # Create ingestion job with depth metadata
        job = MessageIngestionJob(
            source_type="telegram",
            source_identifiers={
                "chat_ids": request.chat_ids,
                "depth": request.depth,
                "offset_date": offset_date_iso,
            },
            status=IngestionStatus.pending,
            created_at=datetime.utcnow(),
        )

        db.add(job)
        await db.commit()
        await db.refresh(job)

        if job.id is None:
            raise HTTPException(status_code=500, detail="Failed to create job: ID is None")

        logger.info(
            f"Created ingestion job {job.id} for chats: {request.chat_ids} "
            f"(depth={request.depth}, offset_date={offset_date_iso})"
        )

        # Start background task with offset_date
        await ingest_telegram_messages_task.kiq(
            job_id=job.id,
            chat_ids=request.chat_ids,
            limit=request.limit,
            offset_date_iso=offset_date_iso,
        )

        depth_desc = f"last {request.depth}" if request.depth != "all" else "all available"
        return IngestionJobResponse(
            job_id=job.id,
            status="pending",
            message=f"Ingestion started for {len(request.chat_ids)} chat(s), importing {depth_desc} messages",
        )

    except Exception as e:
        logger.error(f"Failed to start ingestion: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start ingestion: {str(e)}")


@router.get("/jobs/{job_id}", response_model=MessageIngestionJobPublic)
async def get_ingestion_job(job_id: int, db: DatabaseDep) -> MessageIngestionJobPublic:
    """Get status of an ingestion job."""
    job = await db.get(MessageIngestionJob, job_id)

    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    return MessageIngestionJobPublic.model_validate(job)


@router.get("/jobs", response_model=list[MessageIngestionJobPublic])
async def list_ingestion_jobs(
    db: DatabaseDep,
    limit: int = 50,
    status: str | None = None,
) -> list[MessageIngestionJobPublic]:
    """List ingestion jobs with optional status filter."""
    stmt = (
        select(MessageIngestionJob).order_by(cast(Column[datetime], MessageIngestionJob.created_at).desc()).limit(limit)
    )

    if status:
        try:
            status_enum = IngestionStatus(status)
            stmt = stmt.where(MessageIngestionJob.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    result = await db.execute(stmt)
    jobs = result.scalars().all()

    return [MessageIngestionJobPublic.model_validate(job) for job in jobs]
