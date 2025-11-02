"""API endpoints for Atom management.

Provides endpoints for managing atomic knowledge units (Zettelkasten atoms)
including CRUD operations and topic associations.
"""

import logging
import uuid

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models.atom import (
    Atom,
    AtomCreate,
    AtomListResponse,
    AtomPublic,
    AtomUpdate,
    BulkApproveRequest,
    BulkApproveResponse,
    BulkArchiveRequest,
    BulkArchiveResponse,
    BulkDeleteRequest,
    BulkDeleteResponse,
)
from app.models.topic import Topic
from app.services import AtomCRUD

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/atoms", tags=["atoms"])


@router.get(
    "",
    response_model=AtomListResponse,
    summary="List atoms",
    description="Get list of all atoms with pagination.",
)
async def list_atoms(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    session: AsyncSession = Depends(get_session),
) -> AtomListResponse:
    """List all atoms with pagination.

    Returns atoms sorted by creation date (newest first).
    Atoms represent atomic units of knowledge in the Zettelkasten system.

    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        session: Database session

    Returns:
        List of atoms with pagination metadata
    """
    crud = AtomCRUD(session)
    atoms, total = await crud.list_atoms(skip=skip, limit=limit)
    page = (skip // limit) + 1 if limit else 1
    return AtomListResponse(
        items=atoms,
        total=total,
        page=page,
        page_size=limit,
    )


@router.get(
    "/{atom_id}",
    response_model=AtomPublic,
    summary="Get atom by ID",
    description="Retrieve a specific atom by its ID.",
)
async def get_atom(
    atom_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> AtomPublic:
    """Get a specific atom by ID.

    Args:
        atom_id: Atom ID to retrieve
        session: Database session

    Returns:
        Atom details including type, title, content, and metadata

    Raises:
        HTTPException: 404 if atom not found
    """
    crud = AtomCRUD(session)
    atom = await crud.get_atom(atom_id)

    if not atom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Atom with ID {atom_id} not found",
        )

    return atom


@router.post(
    "",
    response_model=AtomPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create atom",
    description="Create a new atomic knowledge unit.",
)
async def create_atom(
    atom_data: AtomCreate,
    session: AsyncSession = Depends(get_session),
) -> AtomPublic:
    """Create a new atom.

    Atoms are self-contained units of knowledge based on Zettelkasten methodology.
    Each atom represents a single complete thought, problem, solution, or insight.

    Args:
        atom_data: Atom creation data (type, title, content, etc.)
        session: Database session

    Returns:
        Created atom with generated ID and timestamps
    """
    crud = AtomCRUD(session)
    return await crud.create_atom(atom_data)


@router.patch(
    "/{atom_id}",
    response_model=AtomPublic,
    summary="Update atom",
    description="Update an existing atom by ID.",
)
async def update_atom(
    atom_id: uuid.UUID,
    atom_data: AtomUpdate,
    session: AsyncSession = Depends(get_session),
) -> AtomPublic:
    """Update an existing atom.

    All fields are optional - only provided fields will be updated.
    Atom type validation is enforced during updates.

    Args:
        atom_id: Atom ID to update
        atom_data: Atom update data (all fields optional)
        session: Database session

    Returns:
        Updated atom

    Raises:
        HTTPException: 404 if atom not found
    """
    crud = AtomCRUD(session)
    atom = await crud.update_atom(atom_id, atom_data)

    if not atom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Atom with ID {atom_id} not found",
        )

    return atom


@router.delete(
    "/{atom_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete atom",
    description="Delete an atom by ID. Use with caution.",
)
async def delete_atom(
    atom_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> None:
    """Delete an atom.

    Permanently removes the atom and its relationships.
    This action cannot be undone.

    Args:
        atom_id: Atom ID to delete
        session: Database session

    Raises:
        HTTPException: 404 if atom not found
    """
    crud = AtomCRUD(session)
    deleted = await crud.delete(atom_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Atom with ID {atom_id} not found",
        )


@router.post(
    "/bulk-approve",
    response_model=BulkApproveResponse,
    status_code=status.HTTP_200_OK,
    summary="Bulk approve atoms",
    description="Approve multiple atoms in a single transaction with partial success support.",
)
async def bulk_approve_atoms(
    request: BulkApproveRequest,
    session: AsyncSession = Depends(get_session),
) -> BulkApproveResponse:
    """Bulk approve multiple atoms in a single operation.

    This endpoint enables efficient approval of multiple atoms at once,
    useful for admin workflows and batch operations. Uses partial success
    strategy: successfully processes valid atoms while reporting failures.

    Args:
        request: Request containing list of atom IDs to approve
        session: Database session

    Returns:
        Response with approved count, failed IDs, and error messages

    Raises:
        HTTPException: 400 if atom_ids list is empty
        HTTPException: 500 on database transaction errors

    Notes:
        - Idempotent: re-approving already approved atoms is safe
        - Atomic transaction: either all succeed or failures are reported
        - Invalid UUIDs and non-existent atoms are reported in failed_ids
    """
    if not request.atom_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="atom_ids list cannot be empty",
        )

    crud = AtomCRUD(session)

    try:
        result = await crud.bulk_approve_atoms(request.atom_ids)
    except Exception as e:
        logger.error(f"Unexpected error in bulk approve: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during bulk approve operation",
        )

    return result


@router.post(
    "/bulk-archive",
    response_model=BulkArchiveResponse,
    status_code=status.HTTP_200_OK,
    summary="Bulk archive atoms",
    description="Archive multiple atoms in a single transaction with partial success support.",
)
async def bulk_archive_atoms(
    request: BulkArchiveRequest,
    session: AsyncSession = Depends(get_session),
) -> BulkArchiveResponse:
    """Bulk archive multiple atoms in a single operation.

    This endpoint enables efficient archiving of multiple atoms at once,
    useful for admin workflows and batch operations. Uses partial success
    strategy: successfully processes valid atoms while reporting failures.

    Args:
        request: Request containing list of atom IDs to archive
        session: Database session

    Returns:
        Response with archived count, failed IDs, and error messages

    Raises:
        HTTPException: 400 if atom_ids list is empty
        HTTPException: 500 on database transaction errors

    Notes:
        - Idempotent: re-archiving already archived atoms is safe
        - Atomic transaction: either all succeed or failures are reported
        - Invalid UUIDs and non-existent atoms are reported in failed_ids
    """
    if not request.atom_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="atom_ids list cannot be empty",
        )

    crud = AtomCRUD(session)

    try:
        result = await crud.bulk_archive_atoms(request.atom_ids)
    except Exception as e:
        logger.error(f"Unexpected error in bulk archive: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during bulk archive operation",
        )

    return result


@router.post(
    "/bulk-delete",
    response_model=BulkDeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Bulk delete atoms",
    description="Delete multiple atoms permanently in a single transaction with partial success support.",
)
async def bulk_delete_atoms(
    request: BulkDeleteRequest,
    session: AsyncSession = Depends(get_session),
) -> BulkDeleteResponse:
    """Bulk delete multiple atoms in a single operation.

    This endpoint enables efficient deletion of multiple atoms at once,
    useful for admin workflows and batch operations. Uses partial success
    strategy: successfully deletes valid atoms while reporting failures.

    Cascade delete logic:
    - Deletes all atom_links (bidirectional)
    - Deletes all atom_versions
    - Deletes all topic_atoms relationships
    - Then deletes the atom itself

    Args:
        request: Request containing list of atom IDs to delete
        session: Database session

    Returns:
        Response with deleted count, failed IDs, and error messages

    Raises:
        HTTPException: 400 if atom_ids list is empty
        HTTPException: 500 on database transaction errors

    Notes:
        - NOT idempotent: re-deleting deleted atoms will report failures
        - Atomic transaction: either all succeed or failures are reported
        - Invalid UUIDs and non-existent atoms are reported in failed_ids
        - Cascade deletes all related records to prevent orphans
    """
    if not request.atom_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="atom_ids list cannot be empty",
        )

    crud = AtomCRUD(session)

    try:
        result = await crud.bulk_delete_atoms(request.atom_ids)
    except Exception as e:
        logger.error(f"Unexpected error in bulk delete: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during bulk delete operation",
        )

    return result


@router.post(
    "/{atom_id}/topics/{topic_id}",
    status_code=status.HTTP_201_CREATED,
    summary="Link atom to topic",
    description="Create a relationship between an atom and a topic.",
)
async def link_atom_to_topic(
    atom_id: uuid.UUID,
    topic_id: uuid.UUID,
    position: int | None = Query(None, description="Display order within topic"),
    note: str | None = Query(None, description="Contextual note about the relationship"),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Link an atom to a topic.

    Creates a many-to-many relationship between an atom and a topic,
    enabling organization of atomic knowledge units under topics.

    Args:
        atom_id: Atom ID to link
        topic_id: Topic ID to link to
        position: Optional display order (for manual sorting)
        note: Optional contextual note explaining why this atom belongs to this topic
        session: Database session

    Returns:
        Confirmation message with IDs

    Raises:
        HTTPException: 404 if atom or topic not found
        HTTPException: 409 if link already exists
    """
    atom = await session.get(Atom, atom_id)
    if not atom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Atom with ID {atom_id} not found",
        )

    topic = await session.get(Topic, topic_id)
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Topic with ID {topic_id} not found",
        )

    crud = AtomCRUD(session)
    linked = await crud.link_to_topic(atom_id, topic_id, position, note)

    if not linked:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Atom {atom_id} is already linked to topic {topic_id}",
        )

    return {
        "message": "Atom linked to topic successfully",
        "atom_id": str(atom_id),
        "topic_id": str(topic_id),
    }
