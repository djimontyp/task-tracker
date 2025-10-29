"""API endpoints for Atom management.

Provides endpoints for managing atomic knowledge units (Zettelkasten atoms)
including CRUD operations and topic associations.
"""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models.atom import (
    Atom,
    AtomCreate,
    AtomListResponse,
    AtomPublic,
    AtomUpdate,
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
    atom = await crud.get(atom_id)

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
    return await crud.create(atom_data)


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
    atom = await crud.update(atom_id, atom_data)

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
