import logging
import os

from core.config import settings
from core.taskiq_config import nats_broker
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.database import create_db_and_tables
from app.llm.startup import initialize_llm_system
from app.middleware import ErrorHandlerMiddleware
from app.webhooks.router import webhook_router
from app.ws.router import router as ws_router

logger = logging.getLogger(__name__)

tags_metadata = [
    {
        "name": "health",
        "description": "Health check and configuration endpoints for monitoring API status and client setup.",
    },
    {
        "name": "messages",
        "description": "Message management operations including creation, retrieval, and filtering of messages from various sources.",
    },
    {
        "name": "tasks",
        "description": "Task CRUD operations for creating, reading, updating, and managing tasks within the system.",
    },
    {
        "name": "statistics",
        "description": "Analytics and statistics endpoints providing activity data, task metrics, and message analysis.",
    },
    {
        "name": "webhook-settings",
        "description": "Webhook configuration management for Telegram and other integrations, including group monitoring setup.",
    },
    {
        "name": "webhooks",
        "description": "Webhook receivers for external integrations like Telegram that process incoming events.",
    },
    {
        "name": "websocket",
        "description": "WebSocket connections for real-time updates and bidirectional communication with clients.",
    },
    {
        "name": "providers",
        "description": "LLM Provider management for configuring Ollama and OpenAI providers with async validation.",
    },
    {
        "name": "agents",
        "description": "Agent Configuration management for creating and managing PydanticAI agents with task assignments.",
    },
    {
        "name": "analysis",
        "description": "Analysis Run management for coordinating AI-driven task extraction runs with validation and metrics.",
    },
    {
        "name": "proposals",
        "description": "Task Proposal review endpoints for approving, rejecting, and merging AI-generated task proposals.",
    },
    {
        "name": "projects",
        "description": "Project Configuration management for defining classification keywords and team settings.",
    },
    {
        "name": "topics",
        "description": "Topic management for categorizing messages and tasks into organized groups.",
    },
    {
        "name": "versions",
        "description": "Version history management for topics and atoms with diff, approval, and rejection capabilities.",
    },
]


def create_app() -> FastAPI:
    app = FastAPI(
        title=f"{settings.app.app_name} API",
        description=settings.app.app_description,
        version="1.0.0",
        openapi_tags=tags_metadata,
    )

    # CORS configuration - restrict origins for security
    # Default allows localhost development, override with CORS_ORIGINS env var for production
    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost,http://localhost:80").split(",")

    app.add_middleware(ErrorHandlerMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
    )

    app.include_router(api_router)
    app.include_router(webhook_router)
    app.include_router(ws_router)

    @app.get("/")
    async def root() -> dict[str, str]:
        return {"message": f"{settings.app.app_name} API", "status": "running"}

    @app.get("/api/health")
    async def legacy_health_check() -> dict[str, str]:
        """Legacy health check endpoint for backward compatibility"""
        from datetime import datetime

        return {"status": "healthy", "timestamp": datetime.now().isoformat()}

    @app.post("/")
    async def root_post(request: Request) -> dict[str, str]:
        try:
            body = await request.body()
            logger.warning("Unexpected POST to root endpoint. Body: %s...", body.decode()[:200])
            return {
                "status": "redirect",
                "message": "Use /webhook/telegram for Telegram webhooks",
            }
        except Exception as e:
            logger.warning("Error handling POST to root: %s", e)
            return {"status": "error", "message": "Invalid request to root endpoint"}

    return app


app = create_app()


@app.on_event("startup")
async def startup() -> None:
    """Initialize database, LLM system, TaskIQ broker, and WebSocketManager on startup"""
    from tenacity import retry, stop_after_attempt, wait_exponential

    from app.services.websocket_manager import websocket_manager

    initialize_llm_system()

    @retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=1, max=10))
    async def connect_db() -> None:
        await create_db_and_tables()

    await connect_db()

    if not nats_broker.is_worker_process:

        @retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=1, max=10))
        async def connect_nats() -> None:
            await nats_broker.startup()
            await websocket_manager.startup(settings.taskiq.taskiq_nats_servers)

        await connect_nats()


@app.on_event("shutdown")
async def shutdown() -> None:
    """Shutdown TaskIQ broker and WebSocketManager on application shutdown"""
    from app.services.websocket_manager import websocket_manager

    if not nats_broker.is_worker_process:
        await websocket_manager.shutdown()
        await nats_broker.shutdown()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
