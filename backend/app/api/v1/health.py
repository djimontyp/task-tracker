from datetime import datetime

from fastapi import APIRouter

from app.dependencies import SettingsDep

from .response_models import ConfigResponse, HealthResponse

router = APIRouter(tags=["health"])


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
async def get_client_config(settings: SettingsDep) -> ConfigResponse:
    """
    Get client-side configuration for WebSocket and API connections.

    Returns properly formatted URLs based on current API base URL setting.
    """
    base_url = settings.app.api_base_url.replace("http://", "").replace("https://", "")
    return ConfigResponse(wsUrl=f"ws://{base_url}/ws", apiBaseUrl=f"http://{base_url}")
