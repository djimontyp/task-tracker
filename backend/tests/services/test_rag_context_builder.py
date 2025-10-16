"""Tests for RAG context builder service."""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from app.models.message import Message
from app.services.embedding_service import EmbeddingService
from app.services.rag_context_builder import RAGContext, RAGContextBuilder
from app.services.semantic_search_service import SemanticSearchService
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
def mock_embedding_service():
    """Create mock embedding service."""
    service = MagicMock(spec=EmbeddingService)
    service.generate_embedding = AsyncMock(return_value=[0.1] * 1536)
    return service


@pytest.fixture
def mock_search_service():
    """Create mock search service."""
    service = MagicMock(spec=SemanticSearchService)
    return service


@pytest.fixture
def mock_session():
    """Create mock database session."""
    session = MagicMock(spec=AsyncSession)
    return session


@pytest.fixture
def sample_messages():
    """Create sample messages for testing."""
    return [
        Message(
            id=1,
            content="Fix authentication bug in login flow",
            sent_at=datetime(2025, 1, 1, 12, 0),
            source_id=1,
            author_id=1,
        ),
        Message(
            id=2,
            content="Add user profile editing feature",
            sent_at=datetime(2025, 1, 1, 12, 5),
            source_id=1,
            author_id=1,
        ),
    ]


@pytest.fixture
def rag_builder(mock_embedding_service, mock_search_service):
    """Create RAG context builder."""
    return RAGContextBuilder(mock_embedding_service, mock_search_service)


class TestRAGContextBuilder:
    """Test RAG context builder functionality."""

    @pytest.mark.asyncio
    async def test_build_context_empty_messages(self, rag_builder, mock_session):
        """Test building context with empty message list."""
        context = await rag_builder.build_context(mock_session, [], top_k=5)

        assert context["similar_proposals"] == []
        assert context["relevant_atoms"] == []
        assert context["related_messages"] == []
        assert "No messages provided" in context["context_summary"]

    @pytest.mark.asyncio
    async def test_build_context_generates_embedding(
        self, rag_builder, mock_session, sample_messages, mock_embedding_service
    ):
        """Test that build_context generates embedding from messages."""
        mock_session.execute = AsyncMock()
        mock_result = MagicMock()
        mock_result.fetchall.return_value = []
        mock_session.execute.return_value = mock_result

        await rag_builder.build_context(mock_session, sample_messages, top_k=5)

        mock_embedding_service.generate_embedding.assert_called_once()
        call_arg = mock_embedding_service.generate_embedding.call_args[0][0]
        assert "Fix authentication" in call_arg or "Add user profile" in call_arg

    @pytest.mark.asyncio
    async def test_build_context_handles_embedding_failure(self, rag_builder, mock_session, sample_messages):
        """Test context building handles embedding generation failure gracefully."""
        rag_builder.embedding_service.generate_embedding.side_effect = Exception("Embedding failed")

        context = await rag_builder.build_context(mock_session, sample_messages, top_k=5)

        assert context["similar_proposals"] == []
        assert context["relevant_atoms"] == []
        assert context["related_messages"] == []
        assert "Failed to generate embedding" in context["context_summary"]

    @pytest.mark.asyncio
    async def test_find_similar_proposals(self, rag_builder, mock_session):
        """Test finding similar proposals from past data."""
        query_embedding = [0.1] * 1536

        mock_result = MagicMock()
        mock_row = MagicMock()
        mock_row.id = uuid4()
        mock_row.title = "Implement OAuth2"
        mock_row.description = "Add OAuth2 authentication for better security"
        mock_row.confidence = 0.95
        mock_row.similarity = 0.87
        mock_result.fetchall.return_value = [mock_row]

        mock_session.execute = AsyncMock(return_value=mock_result)

        proposals = await rag_builder.find_similar_proposals(mock_session, query_embedding, top_k=5)

        assert len(proposals) == 1
        assert proposals[0]["title"] == "Implement OAuth2"
        assert proposals[0]["confidence"] == 0.95
        assert proposals[0]["similarity"] == 0.87

    @pytest.mark.asyncio
    async def test_find_similar_proposals_handles_error(self, rag_builder, mock_session):
        """Test finding proposals handles database errors gracefully."""
        query_embedding = [0.1] * 1536
        mock_session.execute = AsyncMock(side_effect=Exception("Database error"))

        proposals = await rag_builder.find_similar_proposals(mock_session, query_embedding, top_k=5)

        assert proposals == []

    @pytest.mark.asyncio
    async def test_find_relevant_atoms(self, rag_builder, mock_session):
        """Test finding relevant atoms from knowledge base."""
        query_embedding = [0.1] * 1536

        mock_result = MagicMock()
        mock_row = MagicMock()
        mock_row.id = 42
        mock_row.type = "pattern"
        mock_row.title = "Authentication Best Practices"
        mock_row.content = "Use OAuth2 for modern authentication flows"
        mock_row.confidence = 0.92
        mock_row.similarity = 0.84
        mock_result.fetchall.return_value = [mock_row]

        mock_session.execute = AsyncMock(return_value=mock_result)

        atoms = await rag_builder.find_relevant_atoms(mock_session, query_embedding, top_k=5)

        assert len(atoms) == 1
        assert atoms[0]["title"] == "Authentication Best Practices"
        assert atoms[0]["type"] == "pattern"
        assert atoms[0]["similarity"] == 0.84

    @pytest.mark.asyncio
    async def test_find_relevant_atoms_handles_error(self, rag_builder, mock_session):
        """Test finding atoms handles database errors gracefully."""
        query_embedding = [0.1] * 1536
        mock_session.execute = AsyncMock(side_effect=Exception("Database error"))

        atoms = await rag_builder.find_relevant_atoms(mock_session, query_embedding, top_k=5)

        assert atoms == []

    @pytest.mark.asyncio
    async def test_find_related_messages(self, rag_builder, mock_session):
        """Test finding related messages with exclusions."""
        query_embedding = [0.1] * 1536
        exclude_ids = [1, 2]

        mock_result = MagicMock()
        mock_row = MagicMock()
        mock_row.id = 3
        mock_row.content = "Previous discussion about authentication"
        mock_row.sent_at = datetime(2025, 1, 1, 10, 0)
        mock_row.similarity = 0.79
        mock_result.fetchall.return_value = [mock_row]

        mock_session.execute = AsyncMock(return_value=mock_result)

        messages = await rag_builder._find_related_messages(mock_session, query_embedding, exclude_ids, top_k=5)

        assert len(messages) == 1
        assert messages[0]["id"] == 3
        assert messages[0]["similarity"] == 0.79
        assert "authentication" in messages[0]["content"]

    @pytest.mark.asyncio
    async def test_find_related_messages_handles_error(self, rag_builder, mock_session):
        """Test finding messages handles database errors gracefully."""
        query_embedding = [0.1] * 1536
        exclude_ids = [1, 2]
        mock_session.execute = AsyncMock(side_effect=Exception("Database error"))

        messages = await rag_builder._find_related_messages(mock_session, query_embedding, exclude_ids, top_k=5)

        assert messages == []

    def test_format_context_complete(self, rag_builder):
        """Test formatting complete RAG context with all sections."""
        context: RAGContext = {
            "similar_proposals": [
                {
                    "id": "uuid-1",
                    "title": "Add OAuth2",
                    "description": "Implement OAuth2 authentication",
                    "confidence": 0.95,
                    "similarity": 0.87,
                }
            ],
            "relevant_atoms": [
                {
                    "id": 42,
                    "type": "pattern",
                    "title": "Auth Best Practices",
                    "content": "Use OAuth2 for security",
                    "confidence": 0.92,
                    "similarity": 0.84,
                }
            ],
            "related_messages": [
                {"id": 3, "content": "Discussion about auth", "sent_at": "2025-01-01T10:00:00", "similarity": 0.79}
            ],
            "context_summary": "Retrieved 1 similar proposals, 1 relevant knowledge items, and 1 related messages.",
        }

        formatted = rag_builder.format_context(context)

        assert "## Relevant Past Context" in formatted
        assert "### Similar Past Proposals:" in formatted
        assert "Add OAuth2" in formatted
        assert "confidence: 0.95" in formatted
        assert "### Relevant Knowledge Base Items:" in formatted
        assert "Auth Best Practices" in formatted
        assert "### Related Past Messages:" in formatted
        assert "Discussion about auth" in formatted

    def test_format_context_empty_sections(self, rag_builder):
        """Test formatting context with empty sections."""
        context: RAGContext = {
            "similar_proposals": [],
            "relevant_atoms": [],
            "related_messages": [],
            "context_summary": "No historical context available.",
        }

        formatted = rag_builder.format_context(context)

        assert "## Relevant Past Context" in formatted
        assert "### Similar Past Proposals:" not in formatted
        assert "### Relevant Knowledge Base Items:" not in formatted
        assert "### Related Past Messages:" not in formatted
        assert "No historical context available" in formatted

    def test_format_context_partial_sections(self, rag_builder):
        """Test formatting context with some sections populated."""
        context: RAGContext = {
            "similar_proposals": [
                {
                    "id": "uuid-1",
                    "title": "Add feature",
                    "description": "Feature description",
                    "confidence": 0.85,
                    "similarity": 0.75,
                }
            ],
            "relevant_atoms": [],
            "related_messages": [],
            "context_summary": "Retrieved 1 similar proposals.",
        }

        formatted = rag_builder.format_context(context)

        assert "### Similar Past Proposals:" in formatted
        assert "Add feature" in formatted
        assert "### Relevant Knowledge Base Items:" not in formatted
        assert "### Related Past Messages:" not in formatted

    def test_create_summary(self, rag_builder):
        """Test summary creation."""
        summary = rag_builder._create_summary(3, 5, 7)

        assert "3 similar proposals" in summary
        assert "5 relevant knowledge items" in summary
        assert "7 related messages" in summary

    @pytest.mark.asyncio
    async def test_build_context_integration(self, rag_builder, mock_session, sample_messages):
        """Test full context building integration."""
        mock_result = MagicMock()
        mock_result.fetchall.return_value = []
        mock_session.execute = AsyncMock(return_value=mock_result)

        context = await rag_builder.build_context(mock_session, sample_messages, top_k=3)

        assert isinstance(context, dict)
        assert "similar_proposals" in context
        assert "relevant_atoms" in context
        assert "related_messages" in context
        assert "context_summary" in context
        assert isinstance(context["similar_proposals"], list)
        assert isinstance(context["relevant_atoms"], list)
        assert isinstance(context["related_messages"], list)

    @pytest.mark.asyncio
    async def test_truncates_long_message_content(self, rag_builder, mock_session):
        """Test that long message content is truncated."""
        long_message = Message(
            id=1,
            content="A" * 2000,
            sent_at=datetime(2025, 1, 1, 12, 0),
            source_id=1,
            author_id=1,
        )

        mock_result = MagicMock()
        mock_result.fetchall.return_value = []
        mock_session.execute = AsyncMock(return_value=mock_result)

        await rag_builder.build_context(mock_session, [long_message], top_k=5)

        call_arg = rag_builder.embedding_service.generate_embedding.call_args[0][0]
        assert len(call_arg) <= 1000
