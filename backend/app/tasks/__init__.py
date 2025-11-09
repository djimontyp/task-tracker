"""Background tasks module.

This module provides backward compatibility for the refactored task system.
Tasks are now organized into focused modules:
- analysis.py: Analysis runs and classification experiments
- ingestion.py: Message ingestion and webhook processing
- knowledge.py: Knowledge extraction, embeddings, and scheduled tasks
- scoring.py: Message importance scoring

All tasks are re-exported from this __init__.py for backward compatibility.
"""

from app.config.ai_config import ai_config
from app.tasks.ingestion import (
    ingest_telegram_messages_task,
    process_message,
    queue_knowledge_extraction_if_needed,
    save_telegram_message,
)
from app.tasks.knowledge import (
    embed_atoms_batch_task,
    embed_messages_batch_task,
    extract_knowledge_from_messages_task,
    scheduled_auto_approval_task,
    scheduled_knowledge_extraction_task,
)
from app.tasks.scoring import score_message_task, score_unscored_messages_task

KNOWLEDGE_EXTRACTION_THRESHOLD = ai_config.knowledge_extraction.message_threshold
KNOWLEDGE_EXTRACTION_LOOKBACK_HOURS = ai_config.knowledge_extraction.lookback_hours

__all__ = [
    # Ingestion
    "process_message",
    "save_telegram_message",
    "ingest_telegram_messages_task",
    "queue_knowledge_extraction_if_needed",
    # Scoring
    "score_message_task",
    "score_unscored_messages_task",
    # Knowledge
    "embed_messages_batch_task",
    "embed_atoms_batch_task",
    "extract_knowledge_from_messages_task",
    "scheduled_knowledge_extraction_task",
    "scheduled_auto_approval_task",
    # Config constants (backward compatibility)
    "KNOWLEDGE_EXTRACTION_THRESHOLD",
    "KNOWLEDGE_EXTRACTION_LOOKBACK_HOURS",
]
