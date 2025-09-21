from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class TextClassification(BaseModel):
    is_issue: bool
    category: Literal["bug", "feature", "improvement", "question", "chore"]
    priority: Literal["low", "medium", "high", "critical"]
    confidence: float = Field(..., ge=0.0, le=1.0)


class EntityExtraction(BaseModel):
    projects: list[Literal["agroserver", "fms"]] | None
    components: list[str] | None
    technologies: list[str] | None
    mentions: list[str] | None = Field(description="Імена згадуваних людей")
    dates: list[datetime] | None
    versions: list[str] | None


class EntityStructured(BaseModel):
    short: str = Field(
        description="Коротка примітка (1-2 речення) українською мовою. Це має бути підсумок повідомлення."
    )
