"""
Worker for TaskIQ task processing using NATS
"""

from .taskiq_config import nats_broker


@nats_broker.task
async def process_message(message: str) -> str:
    """Example function for message processing"""
    print(f"Processing message: {message}")
    # Implementation of message processing will be here
    return f"Processed: {message}"
