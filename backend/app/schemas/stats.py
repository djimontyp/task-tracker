"""Stats response schemas"""

from pydantic import BaseModel


class StatsResponse(BaseModel):
    """Response schema for statistics"""

    total_tasks: int
    by_status: dict[str, int]
    by_category: dict[str, int]
    by_priority: dict[str, int]
    total_messages: int
    total_sources: int
