from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class VersionBase(BaseModel):
    version: int = Field(..., description="Version number")
    data: dict[str, Any] = Field(..., description="Version snapshot data")
    created_by: str | None = Field(None, description="User who created version")
    approved: bool = Field(False, description="Approval status")


class TopicVersionResponse(VersionBase):
    id: int
    topic_id: int
    created_at: datetime
    approved_at: datetime | None = None

    class Config:
        from_attributes = True


class AtomVersionResponse(VersionBase):
    id: int
    atom_id: int
    created_at: datetime
    approved_at: datetime | None = None

    class Config:
        from_attributes = True


class VersionChange(BaseModel):
    type: str = Field(..., description="Change type: values_changed, type_changes, etc.")
    path: str = Field(..., description="JSON path to changed field")
    old_value: Any = Field(None, description="Previous value")
    new_value: Any = Field(None, description="New value")


class VersionDiffResponse(BaseModel):
    from_version: int
    to_version: int
    changes: list[VersionChange]
    summary: str


class ApproveVersionRequest(BaseModel):
    pass


class RejectVersionRequest(BaseModel):
    pass
