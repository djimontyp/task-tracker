"""Topic versioning model for tracking changes and approval workflow."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, BigInteger, Boolean, Column, DateTime, ForeignKey, Integer, func
from sqlmodel import Field, Relationship, SQLModel

from .base import IDMixin

if TYPE_CHECKING:
    from .topic import Topic


class TopicVersion(IDMixin, SQLModel, table=True):
    """
    Immutable version snapshot for Topic changes.

    Each version represents a complete snapshot of topic data at a point in time,
    enabling change tracking, diff comparison, and approval workflow.
    """

    __tablename__ = "topic_versions"

    topic_id: int = Field(sa_column=Column(BigInteger, ForeignKey("topics.id"), nullable=False, index=True))
    version: int = Field(sa_column=Column(Integer, nullable=False))
    data: dict = Field(sa_column=Column(JSON, nullable=False))
    created_at: datetime = Field(sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False))
    created_by: str | None = Field(default=None, max_length=100)
    approved: bool = Field(default=False, sa_column=Column(Boolean, nullable=False, server_default="false"))
    approved_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True), nullable=True))

    topic: "Topic" = Relationship(back_populates="versions")


class TopicVersionPublic(SQLModel):
    """Public schema for topic version responses."""

    id: int
    topic_id: int
    version: int
    data: dict
    created_at: datetime
    created_by: str | None
    approved: bool
    approved_at: datetime | None
