from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.v1.response_models import ConfigResponse, DetailedHealthResponse, HealthResponse
from app.database import get_session
from app.tasks import score_message_task

router = APIRouter(tags=["health"])


import uuid
from uuid import UUID

class TestTaskRequest(BaseModel):
    """Request model for triggering test task."""

    message_id: UUID = Field(default_factory=uuid.uuid4, description="Message ID to score")


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check endpoint",
    response_description="Current API health status with timestamp",
)
async def health_check() -> HealthResponse:
    """
    Check API health status.

    Returns current timestamp and healthy status indicator.
    """
    return HealthResponse(status="healthy", timestamp=datetime.now())


@router.get(
    "/health/detailed",
    response_model=DetailedHealthResponse,
    summary="Detailed health check with service status",
    response_description="Health status with individual checks for database and NATS",
)
async def detailed_health_check(
    session: AsyncSession = Depends(get_session),
) -> DetailedHealthResponse:
    """
    Detailed health check with individual service status.

    Checks:
    - database: PostgreSQL connectivity via SELECT 1
    - nats: NATS JetStream connection status

    Returns 'healthy' if all checks pass, 'degraded' otherwise.
    """
    checks: dict[str, bool] = {}

    # Database check
    try:
        await session.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception:
        checks["database"] = False

    # NATS check via WebSocketManager
    try:
        from app.services.websocket_manager import websocket_manager

        nats_client = websocket_manager._nats_client
        checks["nats"] = nats_client is not None and nats_client.is_connected
    except Exception:
        checks["nats"] = False

    status: str = "healthy" if all(checks.values()) else "degraded"

    return DetailedHealthResponse(
        status=status,  # type: ignore[arg-type]
        timestamp=datetime.now(UTC).isoformat(),
        checks=checks,
        version="1.0.0",
    )


@router.get(
    "/config",
    response_model=ConfigResponse,
    summary="Get client configuration",
    response_description="WebSocket and API base URLs for client connection",
)
async def get_client_config(request: Request) -> ConfigResponse:
    """
    Get client-side configuration for WebSocket and API connections.

    Detects nginx proxy via X-Forwarded-* headers and returns appropriate URLs.
    Falls back to localhost for local development without nginx.
    """
    forwarded_host = request.headers.get("x-forwarded-host")
    forwarded_proto = request.headers.get("x-forwarded-proto", "http")
    host = forwarded_host or request.headers.get("host", "localhost")

    ws_scheme = "wss" if forwarded_proto == "https" else "ws"
    ws_url = f"{ws_scheme}://{host}/ws"
    api_base_url = f"{forwarded_proto}://{host}"

    return ConfigResponse(wsUrl=ws_url, apiBaseUrl=api_base_url)


@router.post(
    "/test-task",
    summary="Trigger test task for WebSocket monitoring",
    response_description="Task trigger confirmation with task ID",
)
async def trigger_test_task(request: TestTaskRequest) -> dict[str, str]:
    """
    Trigger a test background task to verify WebSocket monitoring.

    This endpoint kicks off a score_message_task for testing the real-time
    monitoring dashboard. Watch for task_started, task_completed, or task_failed
    events on the 'monitoring' WebSocket topic.
    """
    task = await score_message_task.kiq(message_id=request.message_id)
    return {"status": "triggered", "task_id": task.task_id, "message": "Check monitoring dashboard for updates"}
