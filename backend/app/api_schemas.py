from datetime import datetime
from typing import Dict

from pydantic import BaseModel
from sqlmodel import SQLModel, Field


# API Request schemas
class TaskCreateRequest(BaseModel):
    title: str
    description: str
    category: str
    priority: str
    source: str


class MessageCreateRequest(BaseModel):
    id: str
    content: str
    author: str
    timestamp: str
    chat_id: str


# API Response schemas
class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str
    source: str
    created_at: datetime
    status: str = "open"

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: int
    external_message_id: str
    content: str
    author: str
    sent_at: datetime
    source_name: str

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    total_tasks: int
    open_tasks: int
    completed_tasks: int
    categories: Dict[str, int]
    priorities: Dict[str, int]


# Simplified database models for basic functionality
class SimpleSource(SQLModel, table=True):
    __tablename__ = "simple_sources"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    created_at: datetime | None = Field(default=None)


class SimpleMessage(SQLModel, table=True):
    __tablename__ = "simple_messages"

    id: int | None = Field(default=None, primary_key=True)
    external_message_id: str = Field(max_length=100)
    content: str
    author: str = Field(max_length=100)
    sent_at: datetime
    source_id: int | None = Field(default=None, foreign_key="simple_sources.id")
    created_at: datetime | None = Field(default=None)


class SimpleTask(SQLModel, table=True):
    __tablename__ = "simple_tasks"

    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(max_length=200)
    description: str
    category: str = Field(max_length=50)
    priority: str = Field(max_length=20)
    source: str = Field(max_length=50)
    status: str = Field(default="open", max_length=20)
    created_at: datetime | None = Field(default=None)