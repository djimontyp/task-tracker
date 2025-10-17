"""Integration tests for RAG (Retrieval-Augmented Generation) pipeline.

Tests cover:
1. End-to-end RAG context building with real database
2. Integration with embedding and search services
3. Historical proposal retrieval
4. Relevant atom retrieval
5. Related message retrieval
6. Context formatting
7. Error handling in full pipeline
8. Performance characteristics
"""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from app.models.atom import Atom
from app.models.enums import ProposalStatus, SourceType
from app.models.legacy import Source
from app.models.llm_provider import LLMProvider, ProviderType
from app.models.message import Message
from app.models.task_proposal import TaskProposal
from app.models.user import User
from app.services.embedding_service import EmbeddingService
from app.services.rag_context_builder import RAGContextBuilder
from app.services.semantic_search_service import SemanticSearchService
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
async def openai_provider(db_session: AsyncSession) -> LLMProvider:
    """Create OpenAI provider for testing."""
    provider = LLMProvider(
        id=uuid4(),
        name="OpenAI RAG Test",
        type=ProviderType.openai,
        api_key_encrypted=b"test_encrypted_key_123",
        is_active=True,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)
    return provider


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create test user."""
    user = User(
        first_name="RAG",
        last_name="Tester",
        email="rag.test@tasktracker.test",
        is_active=True,
        is_bot=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_source(db_session: AsyncSession) -> Source:
    """Create test source."""
    source = Source(
        name="RAG Test Chat",
        type=SourceType.telegram,
        is_active=True,
    )
    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)
    return source


@pytest.fixture
def mock_embedding() -> list[float]:
    """Create mock embedding vector."""
    return [0.1] * 1536


@pytest.fixture
async def historical_proposals(db_session: AsyncSession) -> list[TaskProposal]:
    """Create historical approved proposals with embeddings."""
    proposals = []

    for i in range(3):
        proposal = TaskProposal(
            id=uuid4(),
            title=f"Historical Proposal {i}",
            description=f"This is a past proposal about feature {i}",
            priority="medium",
            status=ProposalStatus.approved,
            confidence=0.9,
            embedding=[float(i) * 0.1] * 1536,
        )
        proposals.append(proposal)
        db_session.add(proposal)

    await db_session.commit()
    for proposal in proposals:
        await db_session.refresh(proposal)

    return proposals


@pytest.fixture
async def knowledge_atoms(db_session: AsyncSession) -> list[Atom]:
    """Create knowledge base atoms with embeddings."""
    atoms = []

    atom_data = [
        ("problem", "Authentication Issue", "OAuth2 integration challenges"),
        ("solution", "Database Pooling", "Optimize connection management"),
        ("pattern", "Dependency Injection", "FastAPI DI best practices"),
    ]

    for i, (atom_type, title, content) in enumerate(atom_data):
        atom = Atom(
            type=atom_type,
            title=title,
            content=content,
            embedding=[float(i) * 0.15] * 1536,
            confidence=0.85,
            user_approved=True,
        )
        atoms.append(atom)
        db_session.add(atom)

    await db_session.commit()
    for atom in atoms:
        await db_session.refresh(atom)

    return atoms


@pytest.fixture
async def historical_messages(
    db_session: AsyncSession,
    test_user: User,
    test_source: Source,
) -> list[Message]:
    """Create historical messages with embeddings."""
    messages = []

    for i in range(5):
        msg = Message(
            external_message_id=f"rag-hist-{i}",
            content=f"Historical message {i} about project context",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
            embedding=[float(i) * 0.2] * 1536,
            analyzed=True,
        )
        messages.append(msg)
        db_session.add(msg)

    await db_session.commit()
    for msg in messages:
        await db_session.refresh(msg)

    return messages


@pytest.mark.asyncio
async def test_rag_context_build_with_empty_database(
    db_session: AsyncSession,
    openai_provider: LLMProvider,
    test_user: User,
    test_source: Source,
) -> None:
    """Test RAG context building with no historical data."""
    current_messages = [
        Message(
            external_message_id="rag-current-1",
            content="New feature request",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
        )
    ]

    with (
        patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
        patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test-key"
        mock_encryptor_class.return_value = mock_encryptor

        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.5] * 1536)]
        mock_client.embeddings.create.return_value = mock_response
        mock_openai.return_value = mock_client

        embedding_service = EmbeddingService(openai_provider)
        search_service = SemanticSearchService(embedding_service)
        rag_builder = RAGContextBuilder(embedding_service, search_service)

        context = await rag_builder.build_context(db_session, current_messages, top_k=5)

        assert "similar_proposals" in context
        assert "relevant_atoms" in context
        assert "related_messages" in context
        assert "context_summary" in context

        assert context["similar_proposals"] == []
        assert context["relevant_atoms"] == []
        assert context["related_messages"] == []


@pytest.mark.asyncio
async def test_rag_context_retrieves_historical_proposals(
    db_session: AsyncSession,
    openai_provider: LLMProvider,
    historical_proposals: list[TaskProposal],
    test_user: User,
    test_source: Source,
) -> None:
    """Test that RAG context retrieves similar historical proposals."""
    current_messages = [
        Message(
            external_message_id="rag-test-msg",
            content="Feature similar to historical ones",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
        )
    ]

    with (
        patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
        patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test-key"
        mock_encryptor_class.return_value = mock_encryptor

        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.15] * 1536)]
        mock_client.embeddings.create.return_value = mock_response
        mock_openai.return_value = mock_client

        embedding_service = EmbeddingService(openai_provider)
        search_service = SemanticSearchService(embedding_service)
        rag_builder = RAGContextBuilder(embedding_service, search_service)

        context = await rag_builder.build_context(db_session, current_messages, top_k=5)

        proposals = context["similar_proposals"]
        assert isinstance(proposals, list)


@pytest.mark.asyncio
async def test_rag_context_retrieves_knowledge_atoms(
    db_session: AsyncSession,
    openai_provider: LLMProvider,
    knowledge_atoms: list[Atom],
    test_user: User,
    test_source: Source,
) -> None:
    """Test that RAG context retrieves relevant knowledge atoms."""
    current_messages = [
        Message(
            external_message_id="rag-atom-test",
            content="Need help with authentication patterns",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
        )
    ]

    with (
        patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
        patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test-key"
        mock_encryptor_class.return_value = mock_encryptor

        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.15] * 1536)]
        mock_client.embeddings.create.return_value = mock_response
        mock_openai.return_value = mock_client

        embedding_service = EmbeddingService(openai_provider)
        search_service = SemanticSearchService(embedding_service)
        rag_builder = RAGContextBuilder(embedding_service, search_service)

        context = await rag_builder.build_context(db_session, current_messages, top_k=5)

        atoms = context["relevant_atoms"]
        assert isinstance(atoms, list)


@pytest.mark.asyncio
async def test_rag_context_retrieves_related_messages(
    db_session: AsyncSession,
    openai_provider: LLMProvider,
    historical_messages: list[Message],
    test_user: User,
    test_source: Source,
) -> None:
    """Test that RAG context retrieves related historical messages."""
    current_messages = [
        Message(
            id=999,
            external_message_id="rag-current-test",
            content="Current discussion about project",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
        )
    ]

    with (
        patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
        patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test-key"
        mock_encryptor_class.return_value = mock_encryptor

        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.3] * 1536)]
        mock_client.embeddings.create.return_value = mock_response
        mock_openai.return_value = mock_client

        embedding_service = EmbeddingService(openai_provider)
        search_service = SemanticSearchService(embedding_service)
        rag_builder = RAGContextBuilder(embedding_service, search_service)

        context = await rag_builder.build_context(db_session, current_messages, top_k=5)

        related = context["related_messages"]
        assert isinstance(related, list)


@pytest.mark.asyncio
async def test_rag_context_format_output(
    db_session: AsyncSession,
    openai_provider: LLMProvider,
    historical_proposals: list[TaskProposal],
    knowledge_atoms: list[Atom],
    test_user: User,
    test_source: Source,
) -> None:
    """Test that RAG context is properly formatted for LLM consumption."""
    current_messages = [
        Message(
            external_message_id="rag-format-test",
            content="Testing context formatting",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
        )
    ]

    with (
        patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
        patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test-key"
        mock_encryptor_class.return_value = mock_encryptor

        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.15] * 1536)]
        mock_client.embeddings.create.return_value = mock_response
        mock_openai.return_value = mock_client

        embedding_service = EmbeddingService(openai_provider)
        search_service = SemanticSearchService(embedding_service)
        rag_builder = RAGContextBuilder(embedding_service, search_service)

        context = await rag_builder.build_context(db_session, current_messages, top_k=3)

        formatted = rag_builder.format_context(context)

        assert isinstance(formatted, str)
        assert "## Relevant Past Context" in formatted

        if context["similar_proposals"]:
            assert "### Similar Past Proposals:" in formatted

        if context["relevant_atoms"]:
            assert "### Relevant Knowledge Base Items:" in formatted

        if context["related_messages"]:
            assert "### Related Past Messages:" in formatted


@pytest.mark.asyncio
async def test_rag_handles_multiple_current_messages(
    db_session: AsyncSession,
    openai_provider: LLMProvider,
    test_user: User,
    test_source: Source,
) -> None:
    """Test RAG context building with multiple current messages."""
    current_messages = [
        Message(
            external_message_id="rag-multi-1",
            content="First message in batch",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
        ),
        Message(
            external_message_id="rag-multi-2",
            content="Second message in batch",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
        ),
        Message(
            external_message_id="rag-multi-3",
            content="Third message in batch",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
        ),
    ]

    with (
        patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
        patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test-key"
        mock_encryptor_class.return_value = mock_encryptor

        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.5] * 1536)]
        mock_client.embeddings.create.return_value = mock_response
        mock_openai.return_value = mock_client

        embedding_service = EmbeddingService(openai_provider)
        search_service = SemanticSearchService(embedding_service)
        rag_builder = RAGContextBuilder(embedding_service, search_service)

        context = await rag_builder.build_context(db_session, current_messages, top_k=5)

        assert "similar_proposals" in context
        assert "relevant_atoms" in context
        assert "related_messages" in context

        mock_client.embeddings.create.assert_called_once()


@pytest.mark.asyncio
async def test_rag_respects_top_k_parameter(
    db_session: AsyncSession,
    openai_provider: LLMProvider,
    historical_proposals: list[TaskProposal],
    knowledge_atoms: list[Atom],
    historical_messages: list[Message],
    test_user: User,
    test_source: Source,
) -> None:
    """Test that RAG context respects top_k limit for results."""
    current_messages = [
        Message(
            external_message_id="rag-topk-test",
            content="Test top_k limiting",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
        )
    ]

    with (
        patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
        patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test-key"
        mock_encryptor_class.return_value = mock_encryptor

        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.15] * 1536)]
        mock_client.embeddings.create.return_value = mock_response
        mock_openai.return_value = mock_client

        embedding_service = EmbeddingService(openai_provider)
        search_service = SemanticSearchService(embedding_service)
        rag_builder = RAGContextBuilder(embedding_service, search_service)

        context = await rag_builder.build_context(db_session, current_messages, top_k=2)

        assert len(context["similar_proposals"]) <= 2
        assert len(context["relevant_atoms"]) <= 2
        assert len(context["related_messages"]) <= 2


@pytest.mark.asyncio
async def test_rag_handles_embedding_generation_failure(
    db_session: AsyncSession,
    openai_provider: LLMProvider,
    test_user: User,
    test_source: Source,
) -> None:
    """Test RAG gracefully handles embedding generation failure."""
    current_messages = [
        Message(
            external_message_id="rag-fail-test",
            content="Test failure handling",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
        )
    ]

    with (
        patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
        patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test-key"
        mock_encryptor_class.return_value = mock_encryptor

        mock_client = AsyncMock()
        mock_client.embeddings.create.side_effect = Exception("API Error")
        mock_openai.return_value = mock_client

        embedding_service = EmbeddingService(openai_provider)
        search_service = SemanticSearchService(embedding_service)
        rag_builder = RAGContextBuilder(embedding_service, search_service)

        context = await rag_builder.build_context(db_session, current_messages, top_k=5)

        assert context["similar_proposals"] == []
        assert context["relevant_atoms"] == []
        assert context["related_messages"] == []
        assert "Failed to generate embedding" in context["context_summary"]


@pytest.mark.asyncio
async def test_rag_context_summary_generation(
    db_session: AsyncSession,
    openai_provider: LLMProvider,
    historical_proposals: list[TaskProposal],
    knowledge_atoms: list[Atom],
    test_user: User,
    test_source: Source,
) -> None:
    """Test that context summary is properly generated."""
    current_messages = [
        Message(
            external_message_id="rag-summary-test",
            content="Test summary generation",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
        )
    ]

    with (
        patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
        patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test-key"
        mock_encryptor_class.return_value = mock_encryptor

        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.15] * 1536)]
        mock_client.embeddings.create.return_value = mock_response
        mock_openai.return_value = mock_client

        embedding_service = EmbeddingService(openai_provider)
        search_service = SemanticSearchService(embedding_service)
        rag_builder = RAGContextBuilder(embedding_service, search_service)

        context = await rag_builder.build_context(db_session, current_messages, top_k=3)

        summary = context["context_summary"]
        assert isinstance(summary, str)
        assert len(summary) > 0
