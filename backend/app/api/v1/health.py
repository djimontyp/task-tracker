from datetime import datetime

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.api.v1.response_models import ConfigResponse, HealthResponse
from app.tasks import score_message_task

router = APIRouter(tags=["health"])


class TestTaskRequest(BaseModel):
    """Request model for triggering test task."""

    message_id: int = Field(default=1, description="Message ID to score")


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
