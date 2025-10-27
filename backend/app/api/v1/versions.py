from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.schemas.version import (
    ApproveVersionRequest,
    AtomVersionResponse,
    BulkVersionRequest,
    BulkVersionResponse,
    PendingVersionsCountResponse,
    RejectVersionRequest,
    TopicVersionResponse,
    VersionDiffResponse,
)
from app.database import get_session
from app.services.versioning_service import VersioningService

router = APIRouter(tags=["versions"])


@router.get(
    "/topics/{topic_id}/versions",
    response_model=list[TopicVersionResponse],
    summary="Get all versions for a topic",
)
async def get_topic_versions(
    topic_id: int,
    db: AsyncSession = Depends(get_session),
) -> list[TopicVersionResponse]:
    """Retrieve all versions for a specific topic, ordered newest first"""
    service = VersioningService()
    versions = await service.get_versions(db, "topic", topic_id)
    return versions


@router.get(
    "/topics/{topic_id}/versions/{version}/diff",
    response_model=VersionDiffResponse,
    summary="Get diff between topic versions",
)
async def get_topic_version_diff(
    topic_id: int,
    version: int,
    compare_to: int,
    db: AsyncSession = Depends(get_session),
) -> VersionDiffResponse:
    """
    Generate diff between two topic versions.

    - **version**: Version to compare (typically newer)
    - **compare_to**: Base version to compare against (typically older)
    """
    service = VersioningService()
    try:
        diff = await service.get_version_diff(db, "topic", topic_id, compare_to, version)
        return diff
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post(
    "/topics/{topic_id}/versions/{version}/approve",
    response_model=TopicVersionResponse,
    summary="Approve topic version",
)
async def approve_topic_version(
    topic_id: int,
    version: int,
    request: ApproveVersionRequest,
    db: AsyncSession = Depends(get_session),
) -> TopicVersionResponse:
    """
    Approve a topic version and apply changes to the main topic entity.

    This action:
    1. Marks the version as approved
    2. Applies version data to the main Topic record
    3. Sets approved_at timestamp
    """
    service = VersioningService()
    try:
        approved_version = await service.approve_version(db, "topic", topic_id, version)
        return approved_version
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/topics/{topic_id}/versions/{version}/reject",
    response_model=TopicVersionResponse,
    summary="Reject topic version",
)
async def reject_topic_version(
    topic_id: int,
    version: int,
    request: RejectVersionRequest,
    db: AsyncSession = Depends(get_session),
) -> TopicVersionResponse:
    """Reject a topic version (mark as reviewed but not applied)"""
    service = VersioningService()
    try:
        rejected_version = await service.reject_version(db, "topic", topic_id, version)
        return rejected_version
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get(
    "/atoms/{atom_id}/versions",
    response_model=list[AtomVersionResponse],
    summary="Get all versions for an atom",
)
async def get_atom_versions(
    atom_id: int,
    db: AsyncSession = Depends(get_session),
) -> list[AtomVersionResponse]:
    """Retrieve all versions for a specific atom, ordered newest first"""
    service = VersioningService()
    versions = await service.get_versions(db, "atom", atom_id)
    return versions


@router.get(
    "/atoms/{atom_id}/versions/{version}/diff",
    response_model=VersionDiffResponse,
    summary="Get diff between atom versions",
)
async def get_atom_version_diff(
    atom_id: int,
    version: int,
    compare_to: int,
    db: AsyncSession = Depends(get_session),
) -> VersionDiffResponse:
    """Generate diff between two atom versions"""
    service = VersioningService()
    try:
        diff = await service.get_version_diff(db, "atom", atom_id, compare_to, version)
        return diff
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post(
    "/atoms/{atom_id}/versions/{version}/approve",
    response_model=AtomVersionResponse,
    summary="Approve atom version",
)
async def approve_atom_version(
    atom_id: int,
    version: int,
    request: ApproveVersionRequest,
    db: AsyncSession = Depends(get_session),
) -> AtomVersionResponse:
    """Approve an atom version and apply changes to the main atom entity"""
    service = VersioningService()
    try:
        approved_version = await service.approve_version(db, "atom", atom_id, version)
        return approved_version
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/atoms/{atom_id}/versions/{version}/reject",
    response_model=AtomVersionResponse,
    summary="Reject atom version",
)
async def reject_atom_version(
    atom_id: int,
    version: int,
    request: RejectVersionRequest,
    db: AsyncSession = Depends(get_session),
) -> AtomVersionResponse:
    """Reject an atom version"""
    service = VersioningService()
    try:
        rejected_version = await service.reject_version(db, "atom", atom_id, version)
        return rejected_version
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post(
    "/bulk-approve",
    response_model=BulkVersionResponse,
    summary="Bulk approve versions",
)
async def bulk_approve_versions(
    request: BulkVersionRequest,
    db: AsyncSession = Depends(get_session),
) -> BulkVersionResponse:
    """
    Approve multiple versions in a single transaction-safe operation.

    Validates entity_type and processes all versions atomically.
    Returns success count and any failed IDs with error messages.
    """
    if request.entity_type not in ("topic", "atom"):
        raise HTTPException(status_code=400, detail="entity_type must be 'topic' or 'atom'")

    service = VersioningService()
    success_count, failed_ids, errors = await service.bulk_approve_versions(
        db,
        request.entity_type,  # type: ignore[arg-type]
        request.version_ids,
    )

    return BulkVersionResponse(
        success_count=success_count,
        failed_ids=failed_ids,
        errors=errors,
    )


@router.post(
    "/bulk-reject",
    response_model=BulkVersionResponse,
    summary="Bulk reject versions",
)
async def bulk_reject_versions(
    request: BulkVersionRequest,
    db: AsyncSession = Depends(get_session),
) -> BulkVersionResponse:
    """
    Reject multiple versions in a single operation.

    Marks versions as reviewed but not applied.
    Returns success count and any failed IDs with error messages.
    """
    if request.entity_type not in ("topic", "atom"):
        raise HTTPException(status_code=400, detail="entity_type must be 'topic' or 'atom'")

    service = VersioningService()
    success_count, failed_ids, errors = await service.bulk_reject_versions(
        db,
        request.entity_type,  # type: ignore[arg-type]
        request.version_ids,
    )

    return BulkVersionResponse(
        success_count=success_count,
        failed_ids=failed_ids,
        errors=errors,
    )


@router.get(
    "/pending-count",
    response_model=PendingVersionsCountResponse,
    summary="Get pending versions count",
)
async def get_pending_count(
    db: AsyncSession = Depends(get_session),
) -> PendingVersionsCountResponse:
    """
    Get count of pending (unapproved) versions across all entities.

    Returns total count and breakdown by entity type (topics/atoms).
    """
    service = VersioningService()
    counts = await service.get_pending_count(db)
    return PendingVersionsCountResponse(**counts)
