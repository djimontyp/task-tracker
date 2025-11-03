"""Search API endpoint for topics and messages using PostgreSQL Full-Text Search."""

import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.dependencies import DatabaseDep

router = APIRouter(prefix="/search", tags=["search"])


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


class SearchResultsResponse(BaseModel):
    """Search results response."""

    topics: list[TopicSearchResult]
    messages: list[MessageSearchResult]
    total_results: int
    query: str


@router.get(
    "",
    response_model=SearchResultsResponse,
    summary="Search topics and messages",
    description="Search across topics and messages using PostgreSQL Full-Text Search with ranked results.",
)
async def search(
    q: str = Query(..., min_length=1, max_length=500, description="Search query string"),
    db: DatabaseDep = None,  # type: ignore[assignment]
) -> SearchResultsResponse:
    """
    Search topics and messages using PostgreSQL Full-Text Search.

    Searches across:
    - Topic names and descriptions
    - Message content

    Returns top 10 topics and top 10 messages, ranked by relevance using ts_rank.
    Snippets include highlighted matches using ts_headline for better UX.

    Args:
        q: Search query string (1-500 characters)
        db: Database session (injected)

    Returns:
        SearchResultsResponse with topics, messages, and total count

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
        LIMIT 10
        """
    )

    topic_result = await db.execute(topic_query, {"tsquery": tsquery_formatted, "like_query": f"%{query}%"})
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

    # Search messages with author join - use raw SQL for complex FTS queries
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
        LIMIT 10
        """
    )

    message_result = await db.execute(message_query, {"tsquery": tsquery_formatted, "like_query": f"%{query}%"})
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

    total_results = len(topics) + len(messages)

    return SearchResultsResponse(
        topics=topics,
        messages=messages,
        total_results=total_results,
        query=query,
    )
