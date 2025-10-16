"""Atom model for Zettelkasten knowledge graph system."""

from datetime import datetime
from enum import Enum

from pgvector.sqlalchemy import Vector  # type: ignore[import-untyped]
from pydantic import field_validator
from sqlalchemy import JSON, BigInteger, Column, DateTime, Text, func
from sqlmodel import Field, SQLModel

from .base import IDMixin, TimestampMixin


class AtomType(str, Enum):
    """Types of atomic knowledge units."""

    problem = "problem"
    solution = "solution"
    decision = "decision"
    question = "question"
    insight = "insight"
    pattern = "pattern"
    requirement = "requirement"


class LinkType(str, Enum):
    """Types of relationships between atoms."""

    continues = "continues"
    solves = "solves"
    contradicts = "contradicts"
    supports = "supports"
    refines = "refines"
    relates_to = "relates_to"
    depends_on = "depends_on"


class Atom(IDMixin, TimestampMixin, SQLModel, table=True):
    """
    Atomic unit of knowledge - self-contained idea.

    Based on Zettelkasten methodology, each atom represents a single
    complete thought, problem, solution, or insight that can be linked
    to other atoms and organized under topics.
    """

    __tablename__ = "atoms"

    type: str = Field(
        max_length=20,
        description="Type of atom (problem, solution, decision, etc.)",
    )
    title: str = Field(
        max_length=200,
        index=True,
        description="Brief title summarizing the atom",
    )
    content: str = Field(
        sa_type=Text,
        description="Full content of the atomic knowledge unit",
    )
    confidence: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="AI confidence score for auto-generated atoms (0-1)",
    )
    user_approved: bool = Field(
        default=False,
        description="Whether user has explicitly approved this atom",
    )
    meta: dict | None = Field(
        default=None,
        sa_type=JSON,
        description="Additional structured metadata (tags, sources, etc.)",
    )

    embedding: list[float] | None = Field(
        default=None,
        sa_column=Column(Vector(1536)),
        description="Vector embedding for semantic search (must match settings.openai_embedding_dimensions)",
    )

    @field_validator("type", mode="before")
    @classmethod
    def validate_atom_type(cls, v: str | AtomType) -> str:
        """Validate that atom type is one of the allowed values."""
        if isinstance(v, AtomType):
            return v.value
        if v not in [t.value for t in AtomType]:
            raise ValueError(f"Invalid atom type: {v}")
        return v


class AtomLink(TimestampMixin, SQLModel, table=True):
    """
    Bidirectional links between atoms.

    Represents semantic relationships between atomic knowledge units,
    enabling graph-based knowledge exploration.
    """

    __tablename__ = "atom_links"

    from_atom_id: int = Field(
        sa_type=BigInteger,
        foreign_key="atoms.id",
        primary_key=True,
        description="Source atom ID",
    )
    to_atom_id: int = Field(
        sa_type=BigInteger,
        foreign_key="atoms.id",
        primary_key=True,
        description="Target atom ID",
    )
    link_type: str = Field(
        max_length=20,
        description="Type of relationship (continues, solves, contradicts, etc.)",
    )
    strength: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Strength of the relationship (0-1, optional)",
    )

    @field_validator("link_type", mode="before")
    @classmethod
    def validate_link_type(cls, v: str | LinkType) -> str:
        """Validate that link type is one of the allowed values."""
        if isinstance(v, LinkType):
            return v.value
        if v not in [t.value for t in LinkType]:
            raise ValueError(f"Invalid link type: {v}")
        return v


class TopicAtom(TimestampMixin, SQLModel, table=True):
    """
    Many-to-many relationship: Topics ↔ Atoms.

    Enables organizing atoms under topics with optional positioning
    and contextual notes.
    """

    __tablename__ = "topic_atoms"

    topic_id: int = Field(
        sa_type=BigInteger,
        foreign_key="topics.id",
        primary_key=True,
        description="Topic ID",
    )
    atom_id: int = Field(
        sa_type=BigInteger,
        foreign_key="atoms.id",
        primary_key=True,
        description="Atom ID",
    )
    position: int | None = Field(
        default=None,
        description="Display order within topic (optional)",
    )
    note: str | None = Field(
        default=None,
        sa_type=Text,
        description="Contextual note about why this atom belongs to this topic",
    )


class AtomPublic(SQLModel):
    """Public schema for atom responses."""

    id: int
    type: str
    title: str
    content: str
    confidence: float | None
    user_approved: bool
    meta: dict | None
    embedding: list[float] | None = None
    has_embedding: bool = False
    created_at: str
    updated_at: str


class AtomCreate(SQLModel):
    """Schema for creating a new atom."""

    type: str = Field(
        max_length=20,
        description="Type of atom (problem, solution, decision, etc.)",
    )
    title: str = Field(
        min_length=1,
        max_length=200,
        description="Brief title summarizing the atom",
    )
    content: str = Field(
        min_length=1,
        description="Full content of the atomic knowledge unit",
    )
    confidence: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="AI confidence score (0-1, optional)",
    )
    user_approved: bool = Field(
        default=False,
        description="Whether user has explicitly approved this atom",
    )
    meta: dict | None = Field(
        default=None,
        description="Additional structured metadata",
    )

    @field_validator("type", mode="before")
    @classmethod
    def validate_atom_type(cls, v: str | AtomType) -> str:
        """Validate that atom type is one of the allowed values."""
        if isinstance(v, AtomType):
            return v.value
        if v not in [t.value for t in AtomType]:
            raise ValueError(f"Invalid atom type: {v}. Must be one of: {', '.join(t.value for t in AtomType)}")
        return v


class AtomUpdate(SQLModel):
    """Schema for updating an existing atom."""

    type: str | None = Field(
        default=None,
        max_length=20,
        description="Type of atom",
    )
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
        description="Brief title",
    )
    content: str | None = Field(
        default=None,
        min_length=1,
        description="Full content",
    )
    confidence: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="AI confidence score (0-1)",
    )
    user_approved: bool | None = Field(
        default=None,
        description="User approval status",
    )
    meta: dict | None = Field(
        default=None,
        description="Additional metadata",
    )

    @field_validator("type", mode="before")
    @classmethod
    def validate_atom_type(cls, v: str | AtomType | None) -> str | None:
        """Validate that atom type is one of the allowed values."""
        if v is None:
            return v
        if isinstance(v, AtomType):
            return v.value
        if v not in [t.value for t in AtomType]:
            raise ValueError(f"Invalid atom type: {v}. Must be one of: {', '.join(t.value for t in AtomType)}")
        return v


class AtomLinkPublic(SQLModel):
    """Public schema for atom link responses."""

    from_atom_id: int
    to_atom_id: int
    link_type: str
    strength: float | None
    created_at: str
    updated_at: str


class AtomLinkCreate(SQLModel):
    """Schema for creating a new atom link."""

    from_atom_id: int = Field(
        description="Source atom ID",
    )
    to_atom_id: int = Field(
        description="Target atom ID",
    )
    link_type: str = Field(
        max_length=20,
        description="Type of relationship (continues, solves, contradicts, etc.)",
    )
    strength: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Strength of the relationship (0-1, optional)",
    )

    @field_validator("link_type", mode="before")
    @classmethod
    def validate_link_type(cls, v: str | LinkType) -> str:
        """Validate that link type is one of the allowed values."""
        if isinstance(v, LinkType):
            return v.value
        if v not in [t.value for t in LinkType]:
            raise ValueError(f"Invalid link type: {v}. Must be one of: {', '.join(t.value for t in LinkType)}")
        return v


class TopicAtomPublic(SQLModel):
    """Public schema for topic-atom relationship responses."""

    topic_id: int
    atom_id: int
    position: int | None
    note: str | None
    created_at: str
    updated_at: str


class TopicAtomCreate(SQLModel):
    """Schema for creating a new topic-atom relationship."""

    topic_id: int = Field(
        description="Topic ID",
    )
    atom_id: int = Field(
        description="Atom ID",
    )
    position: int | None = Field(
        default=None,
        description="Display order within topic (optional)",
    )
    note: str | None = Field(
        default=None,
        description="Contextual note",
    )


class AtomListResponse(SQLModel):
    """Paginated response schema for atoms."""

    items: list[AtomPublic]
    total: int
    page: int
    page_size: int
