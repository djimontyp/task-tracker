"""
TaskIQ Worker Module

This module serves as the entry point for TaskIQ worker processes.
It imports all task definitions to ensure they are registered with the broker
and initializes the WebSocketManager for cross-process broadcasting.
"""

from app.services.websocket_manager import websocket_manager
from app.tasks import (  # noqa: F401
    execute_analysis_run,
    ingest_telegram_messages_task,
    process_message,
    save_telegram_message,
)
from loguru import logger
from taskiq import TaskiqEvents, TaskiqState

from .config import settings
from .taskiq_config import nats_broker


@nats_broker.on_event(TaskiqEvents.WORKER_STARTUP)
async def on_worker_startup(state: TaskiqState) -> None:
    """Initialize WebSocketManager for worker process."""
    logger.info("🚀 WORKER_STARTUP event triggered!")
    logger.info(f"🚀 Initializing WebSocketManager for worker process, NATS servers: {settings.taskiq.taskiq_nats_servers}")
    try:
        await websocket_manager.startup(settings.taskiq.taskiq_nats_servers)
        logger.info("✅ WebSocketManager startup completed")
    except Exception as e:
        logger.error(f"❌ WebSocketManager startup failed: {e}", exc_info=True)


@nats_broker.on_event(TaskiqEvents.WORKER_SHUTDOWN)
async def on_worker_shutdown(state: TaskiqState) -> None:
    """Cleanup WebSocketManager on worker shutdown."""
    logger.info("🛑 Shutting down WebSocketManager for worker process")
    await websocket_manager.shutdown()


__all__ = ["nats_broker"]
