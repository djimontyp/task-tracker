"""Atom versioning model for tracking changes and approval workflow."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, BigInteger, Boolean, Column, DateTime, ForeignKey, Integer, func
from sqlmodel import Field, Relationship, SQLModel

from .base import IDMixin

if TYPE_CHECKING:
    from .atom import Atom


class AtomVersion(IDMixin, SQLModel, table=True):
    """
    Immutable version snapshot for Atom changes.

    Each version represents a complete snapshot of atom data at a point in time,
    enabling change tracking, diff comparison, and approval workflow.
    """

    __tablename__ = "atom_versions"

    atom_id: int = Field(sa_column=Column(BigInteger, ForeignKey("atoms.id"), nullable=False, index=True))
    version: int = Field(sa_column=Column(Integer, nullable=False))
    data: dict = Field(sa_column=Column(JSON, nullable=False))
    created_at: datetime = Field(sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False))
    created_by: str | None = Field(default=None, max_length=100)
    approved: bool = Field(default=False, sa_column=Column(Boolean, nullable=False, server_default="false"))
    approved_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True), nullable=True))

    atom: "Atom" = Relationship(back_populates="versions")


class AtomVersionPublic(SQLModel):
    """Public schema for atom version responses."""

    id: int
    atom_id: int
    version: int
    data: dict
    created_at: datetime
    created_by: str | None
    approved: bool
    approved_at: datetime | None
