"""Search API endpoint for topics, messages, and atoms using PostgreSQL Full-Text Search."""

import uuid
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.dependencies import DatabaseDep

router = APIRouter(prefix="/search", tags=["search"])

# Atom type literal for type safety
AtomType = Literal["problem", "solution", "decision", "question", "insight", "pattern", "requirement"]


class TopicBrief(BaseModel):
    """Brief topic information for message search results."""

    id: uuid.UUID
    name: str


class TopicSearchResult(BaseModel):
    """Search result for a topic."""

    id: uuid.UUID
    name: str
    description: str | None
    match_snippet: str = Field(description="Highlighted match snippet")
    rank: float = Field(description="Relevance rank score")


class MessageSearchResult(BaseModel):
    """Search result for a message."""

    id: uuid.UUID
    content_snippet: str = Field(description="Content snippet with highlighted match (max 200 chars)")
    author: str
    timestamp: datetime
    topic: TopicBrief | None = Field(default=None, description="Linked topic if available")
    rank: float = Field(description="Relevance rank score")


class AtomSearchResult(BaseModel):
    """Search result for an atom."""

    id: uuid.UUID
    type: AtomType = Field(description="Atom type: problem, solution, decision, etc.")
    title: str
    content_snippet: str = Field(description="Content snippet with highlighted match (max 200 chars)")
    user_approved: bool
    rank: float = Field(description="Relevance rank score")


class SearchResultsResponse(BaseModel):
    """Search results response."""

    topics: list[TopicSearchResult]
    messages: list[MessageSearchResult]
    atoms: list[AtomSearchResult]
    total_results: int
    query: str


@router.get(
    "",
    response_model=SearchResultsResponse,
    summary="Search topics, messages, and atoms",
    description="Search across topics, messages, and atoms using PostgreSQL Full-Text Search with ranked results.",
)
async def search(
    q: str = Query(..., min_length=1, max_length=256, description="Search query string (1-256 characters)"),
    limit: int = Query(default=10, ge=1, le=50, description="Maximum results per group (default 10)"),
    db: DatabaseDep = None,  # type: ignore[assignment]
) -> SearchResultsResponse:
    """
    Search topics, messages, and atoms using PostgreSQL Full-Text Search.

    Searches across:
    - Topic names and descriptions
    - Message content
    - Atom titles and content

    Returns top N results per category, ranked by relevance using ts_rank.
    Snippets include highlighted matches using ts_headline with <mark> tags.

    Args:
        q: Search query string (1-256 characters)
        limit: Maximum results per group (1-50, default 10)
        db: Database session (injected)

    Returns:
        SearchResultsResponse with topics, messages, atoms, and total count

    Raises:
        HTTPException: 400 if query is empty or invalid
    """
    # Validate query
    query = q.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Search query cannot be empty")

    # Convert query to tsquery format (handle special characters)
    tsquery = query.replace("'", "''")
    tsquery_formatted = " & ".join(tsquery.split())

    # Search topics using raw SQL for FTS
    topic_query = text(
        """
        SELECT
            id,
            name,
            description,
            ts_rank(to_tsvector('simple', name || ' ' || COALESCE(description, '')),
                    to_tsquery('simple', :tsquery)) as rank,
            ts_headline('simple', name || ' ' || COALESCE(description, ''),
                       to_tsquery('simple', :tsquery),
                       'MaxWords=50, MinWords=20, StartSel=<mark>, StopSel=</mark>') as snippet
        FROM topics
        WHERE
            to_tsvector('simple', name || ' ' || COALESCE(description, '')) @@ to_tsquery('simple', :tsquery)
            OR name ILIKE :like_query
            OR description ILIKE :like_query
        ORDER BY rank DESC
        LIMIT :limit
        """
    )

    topic_result = await db.execute(
        topic_query, {"tsquery": tsquery_formatted, "like_query": f"%{query}%", "limit": limit}
    )
    topics_data = topic_result.all()

    topics = [
        TopicSearchResult(
            id=row.id,
            name=row.name,
            description=row.description,
            match_snippet=row.snippet[:200],
            rank=float(row.rank),
        )
        for row in topics_data
    ]

    # Search messages with author join
    message_query = text(
        """
        SELECT
            m.id,
            m.content,
            m.sent_at,
            m.topic_id,
            u.first_name,
            u.last_name,
            t.id as topic_id_join,
            t.name as topic_name,
            ts_rank(to_tsvector('simple', m.content), to_tsquery('simple', :tsquery)) as rank,
            ts_headline('simple', m.content, to_tsquery('simple', :tsquery),
                'MaxWords=50, MinWords=20, StartSel=<mark>, StopSel=</mark>') as snippet
        FROM messages m
        JOIN users u ON m.author_id = u.id
        LEFT JOIN topics t ON m.topic_id = t.id
        WHERE
            to_tsvector('simple', m.content) @@ to_tsquery('simple', :tsquery)
            OR m.content ILIKE :like_query
        ORDER BY rank DESC
        LIMIT :limit
        """
    )

    message_result = await db.execute(
        message_query, {"tsquery": tsquery_formatted, "like_query": f"%{query}%", "limit": limit}
    )
    messages_data = message_result.all()

    messages = [
        MessageSearchResult(
            id=row.id,
            content_snippet=row.snippet[:200],
            author=f"{row.first_name} {row.last_name}".strip() if row.last_name else row.first_name,
            timestamp=row.sent_at,
            topic=TopicBrief(id=row.topic_id_join, name=row.topic_name) if row.topic_id_join else None,
            rank=float(row.rank),
        )
        for row in messages_data
    ]

    # Search atoms by title and content
    atom_query = text(
        """
        SELECT
            id,
            type,
            title,
            content,
            user_approved,
            ts_rank(to_tsvector('simple', title || ' ' || content),
                    to_tsquery('simple', :tsquery)) as rank,
            ts_headline('simple', title || ' ' || content,
                       to_tsquery('simple', :tsquery),
                       'MaxWords=50, MinWords=20, StartSel=<mark>, StopSel=</mark>') as snippet
        FROM atoms
        WHERE
            archived = false
            AND (
                to_tsvector('simple', title || ' ' || content) @@ to_tsquery('simple', :tsquery)
                OR title ILIKE :like_query
                OR content ILIKE :like_query
            )
        ORDER BY rank DESC
        LIMIT :limit
        """
    )

    atom_result = await db.execute(
        atom_query, {"tsquery": tsquery_formatted, "like_query": f"%{query}%", "limit": limit}
    )
    atoms_data = atom_result.all()

    atoms = [
        AtomSearchResult(
            id=row.id,
            type=row.type,
            title=row.title,
            content_snippet=row.snippet[:200],
            user_approved=row.user_approved,
            rank=float(row.rank),
        )
        for row in atoms_data
    ]

    total_results = len(topics) + len(messages) + len(atoms)

    return SearchResultsResponse(
        topics=topics,
        messages=messages,
        atoms=atoms,
        total_results=total_results,
        query=query,
    )
