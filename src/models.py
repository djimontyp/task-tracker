from datetime import datetime

from sqlalchemy import BigInteger, DateTime, func, UniqueConstraint, Text, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import SQLModel, Field, Relationship


class IDMixin(SQLModel):
    id: int | None = Field(default=None, primary_key=True, sa_type=BigInteger)


class TimestampMixin(SQLModel):
    created_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now()},
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()},
    )


class Source(IDMixin, TimestampMixin, SQLModel, table=True):
    type: str = Field(max_length=50)
    name: str = Field(max_length=100)
    config: dict | None = Field(default=None, sa_type=JSONB)
    is_active: bool = Field(default=True)

    # Relationships
    streams: list["Stream"] = Relationship(
        back_populates="source",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "passive_deletes": True,
        },
    )
    messages: list["Message"] = Relationship(
        back_populates="source",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "passive_deletes": True,
        },
    )


class Stream(IDMixin, TimestampMixin, SQLModel, table=True):
    source_id: int = Field(
        foreign_key="source.id",
        sa_type=BigInteger,
        ondelete="CASCADE",
    )
    type: str = Field(max_length=50)  # chat, channel, dm, mailbox, api_endpoint, etc.
    external_id: str = Field(max_length=100)
    name: str = Field(max_length=100)
    config: dict | None = Field(default=None, sa_type=JSONB)

    # Relationships
    source: "Source" = Relationship(back_populates="streams")
    messages: list["Message"] = Relationship(
        back_populates="stream",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "passive_deletes": True,
        },
    )
    jobs: list["ProcessingJob"] = Relationship(
        back_populates="stream",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "passive_deletes": True,
        },
    )

    __table_args__ = (
        UniqueConstraint("source_id", "external_id", name="uq_stream_source_external"),
    )


class Message(IDMixin, TimestampMixin, SQLModel, table=True):
    source_id: int = Field(
        foreign_key="source.id",
        sa_type=BigInteger,
        ondelete="CASCADE",
    )
    stream_id: int | None = Field(
        default=None,
        foreign_key="stream.id",
        sa_type=BigInteger,
        ondelete="SET NULL",
        nullable=True,
    )
    external_message_id: str = Field(max_length=100)
    subject: str | None = None
    content: str = Field(sa_type=Text)
    content_html: str | None = Field(default=None, sa_type=Text)
    payload: dict | None = Field(default=None, sa_type=JSONB)
    author: str = Field(max_length=100)
    thread_key: str | None = None
    sent_at: datetime

    # Relationships
    source: "Source" = Relationship(back_populates="messages")
    stream: "Stream | None" = Relationship(back_populates="messages")
    issues: list["Issue"] = Relationship(
        back_populates="message",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "passive_deletes": True,
        },
    )

    __table_args__ = (
        UniqueConstraint(
            "source_id",
            "stream_id",
            "external_message_id",
            name="uq_msg_src_stream_extid",
        ),
        Index("ix_message_sent_at", "sent_at"),
        Index("ix_message_thread_key", "thread_key"),
    )


class Issue(IDMixin, TimestampMixin, SQLModel, table=True):
    message_id: int = Field(
        foreign_key="message.id", sa_type=BigInteger, ondelete="CASCADE"
    )
    classification: str = Field(max_length=50)
    category: str = Field(max_length=50)
    priority: str = Field(max_length=20)
    confidence: float

    # Relationships
    message: "Message" = Relationship(back_populates="issues")
    outputs: list["Output"] = Relationship(
        back_populates="issue",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "passive_deletes": True,
        },
    )


class ProcessingJob(IDMixin, SQLModel, table=True):
    stream_id: int = Field(
        foreign_key="stream.id",
        sa_type=BigInteger,
        ondelete="CASCADE",
    )
    processor_type: str = Field(max_length=50)
    status: str = Field(max_length=20)
    config: dict | None = Field(default=None, sa_type=JSONB)
    started_at: datetime | None = None
    completed_at: datetime | None = None

    # Relationships
    stream: "Stream" = Relationship(back_populates="jobs")


class Output(IDMixin, TimestampMixin, SQLModel, table=True):
    issue_id: int = Field(
        foreign_key="issue.id", sa_type=BigInteger, ondelete="CASCADE"
    )
    processor_type: str = Field(max_length=50)
    external_id: str = Field(max_length=100)
    status: str = Field(max_length=20)

    # Relationships
    issue: "Issue" = Relationship(back_populates="outputs")


class LLMProvider(IDMixin, SQLModel, table=True):
    name: str = Field(max_length=100)
    type: str = Field(max_length=50)
    config: dict | None = Field(default=None, sa_type=JSONB)
    is_active: bool = Field(default=True)
    usage_stats: dict | None = Field(default=None, sa_type=JSONB)
