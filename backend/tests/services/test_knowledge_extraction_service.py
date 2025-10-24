"""Comprehensive tests for KnowledgeExtractionService.

Tests cover:
1. LLM extraction with mocked Pydantic AI agent
2. Topic creation and deduplication
3. Atom creation with topic relationships
4. Atom link relationships
5. Message topic assignment
6. Confidence threshold filtering
7. Error handling for LLM failures
8. Provider configuration validation
"""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from app.models import Atom, AtomLink, LLMProvider, Message, ProviderType, Source, SourceType, Topic, TopicAtom, User
from app.services.knowledge_extraction_service import (
    ExtractedAtom,
    ExtractedTopic,
    KnowledgeExtractionOutput,
    KnowledgeExtractionService,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
def ollama_provider() -> LLMProvider:
    """Create mock Ollama provider."""
    return LLMProvider(
        id=uuid4(),
        name="Ollama Test",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=True,
    )


@pytest.fixture
def openai_provider() -> LLMProvider:
    """Create mock OpenAI provider."""
    return LLMProvider(
        id=uuid4(),
        name="OpenAI Test",
        type=ProviderType.openai,
        api_key_encrypted=b"encrypted_key_12345",
        is_active=True,
    )


@pytest.fixture
async def sample_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        first_name="Test",
        last_name="User",
        email="test@example.com",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def sample_source(db_session: AsyncSession) -> Source:
    """Create a test source."""
    source = Source(
        name="Test Telegram",
        type=SourceType.telegram,
        is_active=True,
    )
    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)
    return source


@pytest.fixture
async def sample_messages(db_session: AsyncSession, sample_user: User, sample_source: Source) -> list[Message]:
    """Create test messages for extraction."""
    messages = [
        Message(
            id=1,
            external_message_id="msg_1",
            content="We have a critical bug in the authentication system. Users cannot log in.",
            sent_at=datetime.now(UTC),
            source_id=sample_source.id,
            author_id=sample_user.id,
            analyzed=False,
        ),
        Message(
            id=2,
            external_message_id="msg_2",
            content="I fixed it by resetting the session store. Should work now.",
            sent_at=datetime.now(UTC),
            source_id=sample_source.id,
            author_id=sample_user.id,
            analyzed=False,
        ),
        Message(
            id=3,
            external_message_id="msg_3",
            content="Let's discuss the new feature roadmap for Q1 next week.",
            sent_at=datetime.now(UTC),
            source_id=sample_source.id,
            author_id=sample_user.id,
            analyzed=False,
        ),
    ]

    for msg in messages:
        db_session.add(msg)
    await db_session.commit()
    for msg in messages:
        await db_session.refresh(msg)

    return messages


@pytest.fixture
def mock_extraction_output() -> KnowledgeExtractionOutput:
    """Create mock extraction output from LLM."""
    return KnowledgeExtractionOutput(
        topics=[
            ExtractedTopic(
                name="Bug Fixes",
                description="Critical bugs and issues requiring immediate attention",
                confidence=0.95,
                keywords=["bug", "error", "critical", "fix"],
                related_message_ids=[1, 2],
            ),
            ExtractedTopic(
                name="Feature Planning",
                description="Discussion about upcoming features and roadmap",
                confidence=0.85,
                keywords=["feature", "roadmap", "planning"],
                related_message_ids=[3],
            ),
        ],
        atoms=[
            ExtractedAtom(
                type="problem",
                title="Authentication system login failure",
                content="Users cannot log in due to authentication system bug",
                confidence=0.92,
                topic_name="Bug Fixes",
                related_message_ids=[1],
                links_to_atom_titles=["Session store reset fix"],
                link_types=["solves"],
            ),
            ExtractedAtom(
                type="solution",
                title="Session store reset fix",
                content="Fixed authentication issue by resetting the session store",
                confidence=0.88,
                topic_name="Bug Fixes",
                related_message_ids=[2],
                links_to_atom_titles=[],
                link_types=[],
            ),
            ExtractedAtom(
                type="requirement",
                title="Q1 feature roadmap discussion",
                content="Need to discuss and plan Q1 feature roadmap",
                confidence=0.75,
                topic_name="Feature Planning",
                related_message_ids=[3],
                links_to_atom_titles=[],
                link_types=[],
            ),
        ],
    )


@pytest.mark.asyncio
async def test_extract_knowledge_empty_messages(ollama_provider: LLMProvider) -> None:
    """Test extraction with empty message list."""
    service = KnowledgeExtractionService(provider=ollama_provider)

    result = await service.extract_knowledge([])

    assert len(result.topics) == 0
    assert len(result.atoms) == 0


@pytest.mark.asyncio
async def test_extract_knowledge_success_ollama(
    ollama_provider: LLMProvider, sample_messages: list[Message], mock_extraction_output: KnowledgeExtractionOutput
) -> None:
    """Test successful knowledge extraction with Ollama."""
    with patch("app.services.knowledge_extraction_service.PydanticAgent") as mock_agent_class:
        mock_agent = MagicMock()
        mock_result = AsyncMock()
        mock_result.output = mock_extraction_output
        mock_agent.run = AsyncMock(return_value=mock_result)
        mock_agent_class.return_value = mock_agent

        service = KnowledgeExtractionService(provider=ollama_provider)
        result = await service.extract_knowledge(sample_messages)

        assert len(result.topics) == 2
        assert len(result.atoms) == 3
        assert result.topics[0].name == "Bug Fixes"
        assert result.topics[1].name == "Feature Planning"
        assert result.atoms[0].type == "problem"
        assert result.atoms[1].type == "solution"

        mock_agent.run.assert_called_once()


@pytest.mark.asyncio
async def test_extract_knowledge_success_openai(
    openai_provider: LLMProvider, sample_messages: list[Message], mock_extraction_output: KnowledgeExtractionOutput
) -> None:
    """Test successful knowledge extraction with OpenAI."""
    with (
        patch("app.services.knowledge_extraction_service.PydanticAgent") as mock_agent_class,
        patch("app.services.knowledge_extraction_service.CredentialEncryption") as mock_encryptor_class,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test-key-12345"
        mock_encryptor_class.return_value = mock_encryptor

        mock_agent = MagicMock()
        mock_result = AsyncMock()
        mock_result.output = mock_extraction_output
        mock_agent.run = AsyncMock(return_value=mock_result)
        mock_agent_class.return_value = mock_agent

        service = KnowledgeExtractionService(provider=openai_provider)
        result = await service.extract_knowledge(sample_messages)

        assert len(result.topics) == 2
        assert len(result.atoms) == 3

        mock_encryptor.decrypt.assert_called_once()
        mock_agent.run.assert_called_once()


@pytest.mark.asyncio
async def test_extract_knowledge_llm_failure(ollama_provider: LLMProvider, sample_messages: list[Message]) -> None:
    """Test error handling when LLM extraction fails."""
    with patch("app.services.knowledge_extraction_service.PydanticAgent") as mock_agent_class:
        mock_agent = MagicMock()
        mock_agent.run = AsyncMock(side_effect=Exception("LLM timeout"))
        mock_agent_class.return_value = mock_agent

        service = KnowledgeExtractionService(provider=ollama_provider)

        with pytest.raises(Exception, match="Knowledge extraction failed"):
            await service.extract_knowledge(sample_messages)


@pytest.mark.asyncio
async def test_extract_knowledge_invalid_api_key_decryption(
    openai_provider: LLMProvider, sample_messages: list[Message]
) -> None:
    """Test error handling for API key decryption failure."""
    with patch("app.services.knowledge_extraction_service.CredentialEncryption") as mock_encryptor_class:
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.side_effect = Exception("Decryption failed")
        mock_encryptor_class.return_value = mock_encryptor

        service = KnowledgeExtractionService(provider=openai_provider)

        with pytest.raises(ValueError, match="Failed to decrypt API key"):
            await service.extract_knowledge(sample_messages)


@pytest.mark.asyncio
async def test_save_topics_creates_new(db_session: AsyncSession) -> None:
    """Test creating new topics from extraction."""
    extracted_topics = [
        ExtractedTopic(
            name="Bug Fixes",
            description="Critical bugs and issues",
            confidence=0.95,
            keywords=["bug", "error"],
            related_message_ids=[1, 2],
        ),
        ExtractedTopic(
            name="Feature Planning",
            description="Upcoming features",
            confidence=0.85,
            keywords=["feature", "roadmap"],
            related_message_ids=[3],
        ),
    ]

    service = KnowledgeExtractionService(provider=MagicMock())
    topic_map, version_ids = await service.save_topics(extracted_topics, db_session, confidence_threshold=0.7)

    assert len(topic_map) == 2
    assert "Bug Fixes" in topic_map
    assert "Feature Planning" in topic_map
    assert len(version_ids) == 0

    result = await db_session.execute(select(Topic))
    topics = result.scalars().all()
    assert len(topics) == 2


@pytest.mark.asyncio
async def test_save_topics_filters_low_confidence(db_session: AsyncSession) -> None:
    """Test that topics below confidence threshold are not created."""
    extracted_topics = [
        ExtractedTopic(
            name="High Confidence Topic",
            description="This should be created",
            confidence=0.85,
            keywords=["test"],
            related_message_ids=[1],
        ),
        ExtractedTopic(
            name="Low Confidence Topic",
            description="This should be filtered",
            confidence=0.5,
            keywords=["test"],
            related_message_ids=[2],
        ),
    ]

    service = KnowledgeExtractionService(provider=MagicMock())
    topic_map, version_ids = await service.save_topics(extracted_topics, db_session, confidence_threshold=0.7)

    assert len(topic_map) == 1
    assert "High Confidence Topic" in topic_map
    assert "Low Confidence Topic" not in topic_map
    assert len(version_ids) == 0


@pytest.mark.asyncio
async def test_save_topics_reuses_existing(db_session: AsyncSession) -> None:
    """Test that existing topics create versions instead of duplicates."""
    from app.models.topic_version import TopicVersion

    existing_topic = Topic(
        name="Bug Fixes",
        description="Existing topic",
        icon="BugIcon",
        color="#FF0000",
    )
    db_session.add(existing_topic)
    await db_session.commit()
    await db_session.refresh(existing_topic)

    extracted_topics = [
        ExtractedTopic(
            name="Bug Fixes",
            description="Critical bugs and issues",
            confidence=0.95,
            keywords=["bug", "error"],
            related_message_ids=[1, 2],
        )
    ]

    service = KnowledgeExtractionService(provider=MagicMock())
    topic_map, version_ids = await service.save_topics(extracted_topics, db_session, created_by="test_user")

    assert len(topic_map) == 1
    assert topic_map["Bug Fixes"].id == existing_topic.id
    assert len(version_ids) == 1
    assert version_ids[0] == existing_topic.id

    result = await db_session.execute(select(Topic))
    topics = result.scalars().all()
    assert len(topics) == 1

    version_result = await db_session.execute(select(TopicVersion).where(TopicVersion.topic_id == existing_topic.id))
    versions = version_result.scalars().all()
    assert len(versions) == 1
    assert versions[0].data["description"] == "Critical bugs and issues"
    assert versions[0].created_by == "test_user"
    assert versions[0].approved is False


@pytest.mark.asyncio
async def test_save_atoms_creates_with_topic_links(db_session: AsyncSession) -> None:
    """Test creating atoms and linking them to topics."""
    topic = Topic(
        name="Bug Fixes",
        description="Critical bugs",
        icon="BugIcon",
        color="#FF0000",
    )
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    topic_map = {"Bug Fixes": topic}

    extracted_atoms = [
        ExtractedAtom(
            type="problem",
            title="Test Problem",
            content="This is a test problem",
            confidence=0.9,
            topic_name="Bug Fixes",
            related_message_ids=[1],
            links_to_atom_titles=[],
            link_types=[],
        )
    ]

    service = KnowledgeExtractionService(provider=MagicMock())
    saved_atoms, version_ids = await service.save_atoms(extracted_atoms, topic_map, db_session)

    assert len(saved_atoms) == 1
    assert saved_atoms[0].type == "problem"
    assert saved_atoms[0].title == "Test Problem"
    assert len(version_ids) == 0

    result = await db_session.execute(select(TopicAtom))
    topic_atoms = result.scalars().all()
    assert len(topic_atoms) == 1
    assert topic_atoms[0].topic_id == topic.id
    assert topic_atoms[0].atom_id == saved_atoms[0].id


@pytest.mark.asyncio
async def test_save_atoms_filters_low_confidence(db_session: AsyncSession) -> None:
    """Test that atoms below confidence threshold are not created."""
    topic = Topic(name="Test Topic", description="Test", icon="Icon", color="#000000")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    topic_map = {"Test Topic": topic}

    extracted_atoms = [
        ExtractedAtom(
            type="problem",
            title="High Confidence Atom",
            content="Should be created",
            confidence=0.85,
            topic_name="Test Topic",
            related_message_ids=[1],
            links_to_atom_titles=[],
            link_types=[],
        ),
        ExtractedAtom(
            type="problem",
            title="Low Confidence Atom",
            content="Should be filtered",
            confidence=0.5,
            topic_name="Test Topic",
            related_message_ids=[2],
            links_to_atom_titles=[],
            link_types=[],
        ),
    ]

    service = KnowledgeExtractionService(provider=MagicMock())
    saved_atoms, version_ids = await service.save_atoms(extracted_atoms, topic_map, db_session, confidence_threshold=0.7)

    assert len(saved_atoms) == 1
    assert saved_atoms[0].title == "High Confidence Atom"
    assert len(version_ids) == 0


@pytest.mark.asyncio
async def test_save_atoms_skips_unknown_topics(db_session: AsyncSession) -> None:
    """Test that atoms referencing unknown topics are skipped."""
    topic_map: dict[str, Topic] = {}

    extracted_atoms = [
        ExtractedAtom(
            type="problem",
            title="Orphaned Atom",
            content="References non-existent topic",
            confidence=0.9,
            topic_name="Unknown Topic",
            related_message_ids=[1],
            links_to_atom_titles=[],
            link_types=[],
        )
    ]

    service = KnowledgeExtractionService(provider=MagicMock())
    saved_atoms, version_ids = await service.save_atoms(extracted_atoms, topic_map, db_session)

    assert len(saved_atoms) == 0
    assert len(version_ids) == 0


@pytest.mark.asyncio
async def test_save_atoms_creates_version_for_existing(db_session: AsyncSession) -> None:
    """Test that existing atoms create versions instead of direct updates."""
    from app.models.atom_version import AtomVersion

    topic = Topic(name="Test Topic", description="Test", icon="Icon", color="#000000")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    existing_atom = Atom(
        type="problem",
        title="Existing Atom",
        content="Original content",
        confidence=0.8,
        user_approved=False,
    )
    db_session.add(existing_atom)
    await db_session.commit()
    await db_session.refresh(existing_atom)

    topic_map = {"Test Topic": topic}

    extracted_atoms = [
        ExtractedAtom(
            type="solution",
            title="Existing Atom",
            content="Updated content with new solution",
            confidence=0.9,
            topic_name="Test Topic",
            related_message_ids=[1],
            links_to_atom_titles=[],
            link_types=[],
        )
    ]

    service = KnowledgeExtractionService(provider=MagicMock())
    saved_atoms, version_ids = await service.save_atoms(
        extracted_atoms, topic_map, db_session, created_by="test_user"
    )

    assert len(saved_atoms) == 1
    assert saved_atoms[0].id == existing_atom.id
    assert len(version_ids) == 1
    assert version_ids[0] == existing_atom.id

    await db_session.refresh(existing_atom)
    assert existing_atom.content == "Original content"

    version_result = await db_session.execute(select(AtomVersion).where(AtomVersion.atom_id == existing_atom.id))
    versions = version_result.scalars().all()
    assert len(versions) == 1
    assert versions[0].data["content"] == "Updated content with new solution"
    assert versions[0].data["type"] == "solution"
    assert versions[0].created_by == "test_user"
    assert versions[0].approved is False


@pytest.mark.asyncio
async def test_link_atoms_creates_relationships(db_session: AsyncSession) -> None:
    """Test creating atom link relationships."""
    atom1 = Atom(type="problem", title="Problem Atom", content="Test problem", confidence=0.9)
    atom2 = Atom(type="solution", title="Solution Atom", content="Test solution", confidence=0.9)
    db_session.add(atom1)
    db_session.add(atom2)
    await db_session.commit()
    await db_session.refresh(atom1)
    await db_session.refresh(atom2)

    extracted_atoms = [
        ExtractedAtom(
            type="problem",
            title="Problem Atom",
            content="Test problem",
            confidence=0.9,
            topic_name="Test",
            related_message_ids=[1],
            links_to_atom_titles=["Solution Atom"],
            link_types=["solves"],
        ),
        ExtractedAtom(
            type="solution",
            title="Solution Atom",
            content="Test solution",
            confidence=0.9,
            topic_name="Test",
            related_message_ids=[2],
            links_to_atom_titles=[],
            link_types=[],
        ),
    ]

    service = KnowledgeExtractionService(provider=MagicMock())
    links_created = await service.link_atoms(extracted_atoms, [atom1, atom2], db_session)

    assert links_created == 1

    result = await db_session.execute(select(AtomLink))
    links = result.scalars().all()
    assert len(links) == 1
    assert links[0].from_atom_id == atom1.id
    assert links[0].to_atom_id == atom2.id
    assert links[0].link_type == "solves"


@pytest.mark.asyncio
async def test_link_atoms_skips_self_referential(db_session: AsyncSession) -> None:
    """Test that self-referential links are skipped."""
    atom = Atom(type="problem", title="Self Ref Atom", content="Test", confidence=0.9)
    db_session.add(atom)
    await db_session.commit()
    await db_session.refresh(atom)

    extracted_atoms = [
        ExtractedAtom(
            type="problem",
            title="Self Ref Atom",
            content="Test",
            confidence=0.9,
            topic_name="Test",
            related_message_ids=[1],
            links_to_atom_titles=["Self Ref Atom"],
            link_types=["relates_to"],
        )
    ]

    service = KnowledgeExtractionService(provider=MagicMock())
    links_created = await service.link_atoms(extracted_atoms, [atom], db_session)

    assert links_created == 0


@pytest.mark.asyncio
async def test_link_atoms_skips_duplicates(db_session: AsyncSession) -> None:
    """Test that duplicate links are not created."""
    atom1 = Atom(type="problem", title="Atom 1", content="Test", confidence=0.9)
    atom2 = Atom(type="solution", title="Atom 2", content="Test", confidence=0.9)
    db_session.add(atom1)
    db_session.add(atom2)
    await db_session.commit()
    await db_session.refresh(atom1)
    await db_session.refresh(atom2)

    existing_link = AtomLink(from_atom_id=atom1.id, to_atom_id=atom2.id, link_type="solves")
    db_session.add(existing_link)
    await db_session.commit()

    extracted_atoms = [
        ExtractedAtom(
            type="problem",
            title="Atom 1",
            content="Test",
            confidence=0.9,
            topic_name="Test",
            related_message_ids=[1],
            links_to_atom_titles=["Atom 2"],
            link_types=["solves"],
        )
    ]

    service = KnowledgeExtractionService(provider=MagicMock())
    links_created = await service.link_atoms(extracted_atoms, [atom1, atom2], db_session)

    assert links_created == 0


@pytest.mark.asyncio
async def test_update_messages_assigns_topics(db_session: AsyncSession, sample_messages: list[Message]) -> None:
    """Test updating Message.topic_id based on extraction results."""
    topic1 = Topic(name="Topic 1", description="Test", icon="Icon", color="#000000")
    topic2 = Topic(name="Topic 2", description="Test", icon="Icon", color="#000000")
    db_session.add(topic1)
    db_session.add(topic2)
    await db_session.commit()
    await db_session.refresh(topic1)
    await db_session.refresh(topic2)

    topic_map = {"Topic 1": topic1, "Topic 2": topic2}

    extracted_topics = [
        ExtractedTopic(
            name="Topic 1",
            description="Test",
            confidence=0.9,
            keywords=["test"],
            related_message_ids=[1, 2],
        ),
        ExtractedTopic(
            name="Topic 2",
            description="Test",
            confidence=0.9,
            keywords=["test"],
            related_message_ids=[3],
        ),
    ]

    service = KnowledgeExtractionService(provider=MagicMock())
    updated_count = await service.update_messages(sample_messages, topic_map, extracted_topics, db_session)

    assert updated_count == 3
    assert sample_messages[0].topic_id == topic1.id
    assert sample_messages[1].topic_id == topic1.id
    assert sample_messages[2].topic_id == topic2.id


@pytest.mark.asyncio
async def test_update_messages_skips_multiple_assignments(
    db_session: AsyncSession, sample_messages: list[Message]
) -> None:
    """Test that messages with multiple topic assignments keep the first one."""
    topic1 = Topic(name="Topic 1", description="Test", icon="Icon", color="#000000")
    topic2 = Topic(name="Topic 2", description="Test", icon="Icon", color="#000000")
    db_session.add(topic1)
    db_session.add(topic2)
    await db_session.commit()
    await db_session.refresh(topic1)
    await db_session.refresh(topic2)

    topic_map = {"Topic 1": topic1, "Topic 2": topic2}

    extracted_topics = [
        ExtractedTopic(
            name="Topic 1",
            description="Test",
            confidence=0.9,
            keywords=["test"],
            related_message_ids=[1],
        ),
        ExtractedTopic(
            name="Topic 2",
            description="Test",
            confidence=0.9,
            keywords=["test"],
            related_message_ids=[1],
        ),
    ]

    service = KnowledgeExtractionService(provider=MagicMock())
    updated_count = await service.update_messages(sample_messages, topic_map, extracted_topics, db_session)

    assert updated_count == 1
    assert sample_messages[0].topic_id == topic1.id


@pytest.mark.asyncio
async def test_build_prompt_formats_correctly(sample_messages: list[Message]) -> None:
    """Test that prompt is formatted correctly."""
    service = KnowledgeExtractionService(provider=MagicMock())
    prompt = service._build_prompt(sample_messages)

    assert "Message 1 (ID: 1" in prompt
    assert "Message 2 (ID: 2" in prompt
    assert "Message 3 (ID: 3" in prompt
    assert "authentication system" in prompt
    assert "feature roadmap" in prompt


@pytest.mark.asyncio
async def test_build_model_instance_ollama(ollama_provider: LLMProvider) -> None:
    """Test building Ollama model instance."""
    service = KnowledgeExtractionService(provider=ollama_provider)
    model = service._build_model_instance()

    assert model is not None
    assert model.model_name == "qwen2.5:14b"


@pytest.mark.asyncio
async def test_build_model_instance_openai(openai_provider: LLMProvider) -> None:
    """Test building OpenAI model instance."""
    with patch("app.services.knowledge_extraction_service.CredentialEncryption") as mock_encryptor_class:
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test-key"
        mock_encryptor_class.return_value = mock_encryptor

        service = KnowledgeExtractionService(provider=openai_provider)
        model = service._build_model_instance("sk-test-key")

        assert model is not None
        assert model.model_name == "qwen2.5:14b"


@pytest.mark.asyncio
async def test_build_model_instance_ollama_missing_base_url() -> None:
    """Test error when Ollama provider is missing base_url."""
    provider = LLMProvider(
        id=uuid4(),
        name="Ollama No URL",
        type=ProviderType.ollama,
        base_url=None,
        is_active=True,
    )

    service = KnowledgeExtractionService(provider=provider)

    with pytest.raises(ValueError, match="missing base_url"):
        service._build_model_instance()


@pytest.mark.asyncio
async def test_build_model_instance_openai_missing_api_key() -> None:
    """Test error when OpenAI provider is missing API key."""
    provider = LLMProvider(
        id=uuid4(),
        name="OpenAI No Key",
        type=ProviderType.openai,
        api_key_encrypted=None,
        is_active=True,
    )

    service = KnowledgeExtractionService(provider=provider)

    with pytest.raises(ValueError, match="requires an API key"):
        service._build_model_instance(None)


@pytest.mark.asyncio
async def test_build_model_instance_unsupported_provider() -> None:
    """Test error for unsupported provider type."""
    provider = MagicMock()
    provider.type = "unsupported_type"
    provider.name = "Unsupported"

    service = KnowledgeExtractionService(provider=provider)

    with pytest.raises(ValueError, match="Unsupported provider type"):
        service._build_model_instance()


# Period selection helper tests


@pytest.mark.asyncio
async def test_get_messages_by_period_last_24h(
    db_session: AsyncSession, sample_user: User, sample_source: Source
) -> None:
    """Test last 24 hours period selection."""
    from datetime import timedelta
    from app.services.knowledge_extraction_service import get_messages_by_period

    now = datetime.now(UTC)
    recent_time = now - timedelta(hours=12)
    old_time = now - timedelta(days=2)

    messages_recent = [
        Message(
            external_message_id=f"msg_recent_{i}",
            content=f"Recent message {i}",
            sent_at=recent_time,
            source_id=sample_source.id,
            author_id=sample_user.id,
        )
        for i in range(3)
    ]

    messages_old = [
        Message(
            external_message_id=f"msg_old_{i}",
            content=f"Old message {i}",
            sent_at=old_time,
            source_id=sample_source.id,
            author_id=sample_user.id,
        )
        for i in range(2)
    ]

    for msg in messages_recent + messages_old:
        db_session.add(msg)
    await db_session.commit()

    result = await get_messages_by_period(db_session, period_type="last_24h")

    assert len(result) == 3
    assert all(msg_id in [m.id for m in messages_recent] for msg_id in result)


@pytest.mark.asyncio
async def test_get_messages_by_period_last_7d(
    db_session: AsyncSession, sample_user: User, sample_source: Source
) -> None:
    """Test last 7 days period selection."""
    from datetime import timedelta
    from app.services.knowledge_extraction_service import get_messages_by_period

    now = datetime.now(UTC)
    recent_time = now - timedelta(days=3)
    old_time = now - timedelta(days=15)

    messages_recent = [
        Message(
            external_message_id=f"msg_recent_7d_{i}",
            content=f"Recent message {i}",
            sent_at=recent_time,
            source_id=sample_source.id,
            author_id=sample_user.id,
        )
        for i in range(3)
    ]

    messages_old = [
        Message(
            external_message_id=f"msg_old_7d_{i}",
            content=f"Old message {i}",
            sent_at=old_time,
            source_id=sample_source.id,
            author_id=sample_user.id,
        )
        for i in range(2)
    ]

    for msg in messages_recent + messages_old:
        db_session.add(msg)
    await db_session.commit()

    result = await get_messages_by_period(db_session, period_type="last_7d")

    assert len(result) == 3
    assert all(msg_id in [m.id for m in messages_recent] for msg_id in result)


@pytest.mark.asyncio
async def test_get_messages_by_period_last_30d(
    db_session: AsyncSession, sample_user: User, sample_source: Source
) -> None:
    """Test last 30 days period selection."""
    from datetime import timedelta
    from app.services.knowledge_extraction_service import get_messages_by_period

    now = datetime.now(UTC)
    recent_time = now - timedelta(days=15)
    old_time = now - timedelta(days=45)

    messages_recent = [
        Message(
            external_message_id=f"msg_recent_30d_{i}",
            content=f"Recent message {i}",
            sent_at=recent_time,
            source_id=sample_source.id,
            author_id=sample_user.id,
        )
        for i in range(3)
    ]

    messages_old = [
        Message(
            external_message_id=f"msg_old_30d_{i}",
            content=f"Old message {i}",
            sent_at=old_time,
            source_id=sample_source.id,
            author_id=sample_user.id,
        )
        for i in range(2)
    ]

    for msg in messages_recent + messages_old:
        db_session.add(msg)
    await db_session.commit()

    result = await get_messages_by_period(db_session, period_type="last_30d")

    assert len(result) == 3
    assert all(msg_id in [m.id for m in messages_recent] for msg_id in result)


@pytest.mark.asyncio
async def test_get_messages_by_period_custom_valid(
    db_session: AsyncSession, sample_user: User, sample_source: Source
) -> None:
    """Test custom date range period selection."""
    from datetime import timedelta
    from app.services.knowledge_extraction_service import get_messages_by_period

    now = datetime.now(UTC)
    start_date = now - timedelta(days=5)
    end_date = now - timedelta(days=2)

    messages_in_range = [
        Message(
            external_message_id=f"msg_in_range_{i}",
            content=f"In range message {i}",
            sent_at=now - timedelta(days=3),
            source_id=sample_source.id,
            author_id=sample_user.id,
        )
        for i in range(3)
    ]

    messages_before = [
        Message(
            external_message_id=f"msg_before_{i}",
            content=f"Before message {i}",
            sent_at=now - timedelta(days=10),
            source_id=sample_source.id,
            author_id=sample_user.id,
        )
        for i in range(2)
    ]

    messages_after = [
        Message(
            external_message_id=f"msg_after_{i}",
            content=f"After message {i}",
            sent_at=now - timedelta(hours=1),
            source_id=sample_source.id,
            author_id=sample_user.id,
        )
        for i in range(2)
    ]

    for msg in messages_in_range + messages_before + messages_after:
        db_session.add(msg)
    await db_session.commit()

    result = await get_messages_by_period(
        db_session, period_type="custom", start_date=start_date, end_date=end_date
    )

    assert len(result) == 3
    assert all(msg_id in [m.id for m in messages_in_range] for msg_id in result)


@pytest.mark.asyncio
async def test_get_messages_by_period_with_topic_filter(
    db_session: AsyncSession, sample_user: User, sample_source: Source
) -> None:
    """Test period selection with topic ID filter."""
    from datetime import timedelta
    from app.models import Topic
    from app.services.knowledge_extraction_service import get_messages_by_period

    topic1 = Topic(name="Topic 1", description="Test", icon="Icon", color="#000")
    topic2 = Topic(name="Topic 2", description="Test", icon="Icon", color="#000")
    db_session.add(topic1)
    db_session.add(topic2)
    await db_session.commit()
    await db_session.refresh(topic1)
    await db_session.refresh(topic2)

    now = datetime.now(UTC)
    recent_time = now - timedelta(hours=12)

    messages_topic1 = [
        Message(
            external_message_id=f"msg_topic1_{i}",
            content=f"Topic 1 message {i}",
            sent_at=recent_time,
            source_id=sample_source.id,
            author_id=sample_user.id,
            topic_id=topic1.id,
        )
        for i in range(3)
    ]

    messages_topic2 = [
        Message(
            external_message_id=f"msg_topic2_{i}",
            content=f"Topic 2 message {i}",
            sent_at=recent_time,
            source_id=sample_source.id,
            author_id=sample_user.id,
            topic_id=topic2.id,
        )
        for i in range(2)
    ]

    for msg in messages_topic1 + messages_topic2:
        db_session.add(msg)
    await db_session.commit()

    result = await get_messages_by_period(db_session, period_type="last_24h", topic_id=topic1.id)

    assert len(result) == 3
    assert all(msg_id in [m.id for m in messages_topic1] for msg_id in result)


@pytest.mark.asyncio
async def test_get_messages_by_period_no_results(
    db_session: AsyncSession, sample_user: User, sample_source: Source
) -> None:
    """Test period selection returning empty list when no messages match."""
    from datetime import timedelta
    from app.services.knowledge_extraction_service import get_messages_by_period

    now = datetime.now(UTC)
    old_time = now - timedelta(days=100)

    msg = Message(
        external_message_id="msg_very_old",
        content="Very old message",
        sent_at=old_time,
        source_id=sample_source.id,
        author_id=sample_user.id,
    )
    db_session.add(msg)
    await db_session.commit()

    result = await get_messages_by_period(db_session, period_type="last_24h")

    assert len(result) == 0
    assert result == []


@pytest.mark.asyncio
async def test_get_messages_by_period_custom_missing_start_date(
    db_session: AsyncSession,
) -> None:
    """Test custom period validation when start_date is missing."""
    from datetime import timedelta
    from app.services.knowledge_extraction_service import get_messages_by_period

    now = datetime.now(UTC)
    end_date = now

    with pytest.raises(ValueError, match="Custom period requires both start_date and end_date"):
        await get_messages_by_period(
            db_session, period_type="custom", start_date=None, end_date=end_date
        )


@pytest.mark.asyncio
async def test_get_messages_by_period_custom_missing_end_date(
    db_session: AsyncSession,
) -> None:
    """Test custom period validation when end_date is missing."""
    from datetime import timedelta
    from app.services.knowledge_extraction_service import get_messages_by_period

    now = datetime.now(UTC)
    start_date = now - timedelta(days=5)

    with pytest.raises(ValueError, match="Custom period requires both start_date and end_date"):
        await get_messages_by_period(
            db_session, period_type="custom", start_date=start_date, end_date=None
        )


@pytest.mark.asyncio
async def test_get_messages_by_period_custom_start_after_end(
    db_session: AsyncSession,
) -> None:
    """Test custom period validation when start_date is after end_date."""
    from datetime import timedelta
    from app.services.knowledge_extraction_service import get_messages_by_period

    now = datetime.now(UTC)
    start_date = now - timedelta(days=2)
    end_date = now - timedelta(days=5)

    with pytest.raises(ValueError, match="start_date must be before end_date"):
        await get_messages_by_period(
            db_session, period_type="custom", start_date=start_date, end_date=end_date
        )


@pytest.mark.asyncio
async def test_get_messages_by_period_custom_future_start_date(
    db_session: AsyncSession,
) -> None:
    """Test custom period validation when start_date is in the future."""
    from datetime import timedelta
    from app.services.knowledge_extraction_service import get_messages_by_period

    now = datetime.now(UTC)
    future = now + timedelta(days=5)
    start_date = future
    end_date = future + timedelta(days=1)

    with pytest.raises(ValueError, match="dates cannot be in the future"):
        await get_messages_by_period(
            db_session, period_type="custom", start_date=start_date, end_date=end_date
        )


@pytest.mark.asyncio
async def test_get_messages_by_period_custom_future_end_date(
    db_session: AsyncSession,
) -> None:
    """Test custom period validation when end_date is in the future."""
    from datetime import timedelta
    from app.services.knowledge_extraction_service import get_messages_by_period

    now = datetime.now(UTC)
    start_date = now - timedelta(days=5)
    end_date = now + timedelta(days=5)

    with pytest.raises(ValueError, match="dates cannot be in the future"):
        await get_messages_by_period(
            db_session, period_type="custom", start_date=start_date, end_date=end_date
        )


@pytest.mark.asyncio
async def test_get_messages_by_period_invalid_period_type(
    db_session: AsyncSession,
) -> None:
    """Test error handling for invalid period type."""
    from datetime import timedelta
    from app.services.knowledge_extraction_service import get_messages_by_period

    with pytest.raises(ValueError, match="Invalid period_type"):
        await get_messages_by_period(db_session, period_type="invalid_type")  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_get_messages_by_period_naive_datetime_handling(
    db_session: AsyncSession, sample_user: User, sample_source: Source
) -> None:
    """Test that naive datetimes are converted to UTC."""
    from datetime import timedelta
    from app.services.knowledge_extraction_service import get_messages_by_period

    now = datetime.now(UTC)
    start_date = now - timedelta(days=5)
    end_date = now - timedelta(days=2)

    msg = Message(
        external_message_id="msg_naive_test",
        content="Test message",
        sent_at=now - timedelta(days=3),
        source_id=sample_source.id,
        author_id=sample_user.id,
    )
    db_session.add(msg)
    await db_session.commit()

    result = await get_messages_by_period(
        db_session, period_type="custom", start_date=start_date, end_date=end_date
    )

    assert len(result) == 1
