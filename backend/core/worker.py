"""
TaskIQ Worker Module

This module serves as the entry point for TaskIQ worker processes.
It imports all task definitions to ensure they are registered with the broker.
"""

# Import all task modules to register tasks with the broker
from app.tasks import (  # noqa: F401
    execute_analysis_run,
    ingest_telegram_messages_task,
    process_message,
    save_telegram_message,
)

from .taskiq_config import nats_broker

# Export broker for TaskIQ worker command
__all__ = ["nats_broker"]
