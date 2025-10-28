"""DEPRECATED: Backward compatibility wrapper for knowledge extraction service.

This module has been refactored and split into:
- app.services.knowledge.knowledge_schemas (Pydantic models)
- app.services.knowledge.llm_agents (LLM agent definitions)
- app.services.knowledge.knowledge_orchestrator (orchestration logic)

Please update imports to use app.services.knowledge instead.
This compatibility wrapper will be removed in a future version.
"""

from app.services.knowledge.knowledge_orchestrator import KnowledgeOrchestrator as KnowledgeExtractionService
from app.services.knowledge.knowledge_orchestrator import get_messages_by_period
from app.services.knowledge.knowledge_schemas import (
    ExtractedAtom,
    ExtractedTopic,
    KnowledgeExtractionOutput,
    PeriodType,
)
from app.services.knowledge.llm_agents import KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT

__all__ = [
    "KnowledgeExtractionService",
    "get_messages_by_period",
    "ExtractedAtom",
    "ExtractedTopic",
    "KnowledgeExtractionOutput",
    "PeriodType",
    "KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT",
]
