"""Pydantic schemas for knowledge extraction domain."""

import uuid
from typing import Literal

from pydantic import BaseModel, Field

PeriodType = Literal["last_24h", "last_7d", "last_30d", "custom"]


class ExtractedTopic(BaseModel):
    """Topic extracted from messages."""

    name: str = Field(max_length=100, description="Concise topic name (2-4 words max)")
    description: str = Field(default="", description="Clear description of the discussion theme")
    confidence: float = Field(
        default=0.7, ge=0.0, le=1.0, description="Extraction confidence (0.7+ recommended for auto-creation)"
    )
    keywords: list[str] = Field(default_factory=list, description="Key terms associated with this topic")
    related_message_ids: list[uuid.UUID] = Field(
        default_factory=list, description="Source message IDs that contributed to this topic"
    )


class ExtractedAtom(BaseModel):
    """Atom extracted from messages."""

    type: str = Field(
        default="insight", description="Atom type: problem/solution/decision/insight/question/pattern/requirement"
    )
    title: str = Field(max_length=200, description="Brief title summarizing the atomic knowledge unit")
    content: str = Field(default="", description="Full self-contained content of the atom")
    confidence: float = Field(
        default=0.7, ge=0.0, le=1.0, description="Extraction confidence (0.7+ recommended for auto-creation)"
    )
    topic_name: str = Field(default="", description="Parent topic name this atom belongs to")
    related_message_ids: list[uuid.UUID] = Field(
        default_factory=list, description="Source message IDs that contributed to this atom"
    )
    links_to_atom_titles: list[str] = Field(default_factory=list, description="Titles of related atoms to link with")
    link_types: list[str] = Field(
        default_factory=list,
        description="Link relationship types: solves/supports/contradicts/continues/refines/relates_to/depends_on",
    )


class KnowledgeExtractionOutput(BaseModel):
    """Full knowledge extraction output from LLM."""

    topics: list[ExtractedTopic] = Field(description="Extracted discussion topics")
    atoms: list[ExtractedAtom] = Field(description="Extracted atomic knowledge units")
