from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime


class Source(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    type: str = Field(max_length=50)
    name: str = Field(max_length=100)
    config: str  # JSON configuration
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Channel(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    source_id: int = Field(foreign_key="source.id")
    external_id: str = Field(max_length=100)
    name: str = Field(max_length=100)
    config: str  # JSON configuration
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    channel_id: int = Field(foreign_key="channel.id")
    external_message_id: str = Field(max_length=100)
    content: str
    author: str = Field(max_length=100)
    timestamp: datetime


class Issue(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    message_id: int = Field(foreign_key="message.id")
    classification: str = Field(max_length=50)
    category: str = Field(max_length=50)
    priority: str = Field(max_length=20)
    confidence: float
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ProcessingJob(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    channel_id: int = Field(foreign_key="channel.id")
    processor_type: str = Field(max_length=50)
    status: str = Field(max_length=20)
    config: str  # JSON configuration
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class Output(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    issue_id: int = Field(foreign_key="issue.id")
    processor_type: str = Field(max_length=50)
    external_id: str = Field(max_length=100)
    status: str = Field(max_length=20)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class LLMProvider(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    type: str = Field(max_length=50)
    config: str  # JSON configuration
    is_active: bool = Field(default=True)
    usage_stats: Optional[str] = None  # JSON statistics
