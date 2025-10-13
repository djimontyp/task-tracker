"""Base models and mixins for all entities."""

from datetime import datetime

from sqlalchemy import BigInteger, Column, DateTime, func
from sqlmodel import Field, SQLModel


class IDMixin(SQLModel):
    """Primary key mixin with BigInteger for scalability."""

    id: int | None = Field(default=None, primary_key=True, sa_type=BigInteger)


class TimestampMixin(SQLModel):
    """Timestamp mixin with automatic creation and update tracking."""

    created_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now()),
    )
