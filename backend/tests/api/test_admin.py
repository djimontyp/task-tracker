"""Tests for Admin API endpoints."""

from datetime import UTC, datetime, timedelta

import pytest
from app.models.atom import Atom
from app.models.confirmation_token import ConfirmationToken
from app.models.legacy import Source
from app.models.message import Message
from app.models.topic import Topic
from app.models.user import User
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select


@pytest.fixture
async def sample_source(db_session: AsyncSession) -> Source:
    """Create a sample source."""
    source = Source(
        name="Test Source",
        type="telegram",
    )
    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)
    return source


@pytest.fixture
async def sample_user(db_session: AsyncSession) -> User:
    """Create a sample user."""
    user = User(
        first_name="Test",
        last_name="User",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def sample_data(
    db_session: AsyncSession,
    sample_source: Source,
    sample_user: User,
) -> dict[str, int]:
    """Create sample messages, atoms, and topics."""
    # Create topics
    topics = []
    for i in range(3):
        topic = Topic(
            name=f"Topic {i}",
            description=f"Description {i}",
        )
        db_session.add(topic)
        topics.append(topic)

    await db_session.commit()

    # Create atoms
    atoms = []
    for i in range(5):
        atom = Atom(
            type="problem",
            title=f"Atom {i}",
            content=f"Content {i}",
        )
        db_session.add(atom)
        atoms.append(atom)

    await db_session.commit()

    # Create messages
    messages = []
    for i in range(10):
        message = Message(
            external_message_id=f"msg_{i}",
            content=f"Message content {i}",
            sent_at=datetime.now(UTC),
            source_id=sample_source.id,
            author_id=sample_user.id,
        )
        db_session.add(message)
        messages.append(message)

    await db_session.commit()

    return {
        "topics": len(topics),
        "atoms": len(atoms),
        "messages": len(messages),
    }


class TestAdminDataWipeAPI:
    """Test admin data wipe API endpoints."""

    @pytest.mark.asyncio
    async def test_preview_data_wipe(
        self,
        client: AsyncClient,
        sample_data: dict[str, int],
    ) -> None:
        """Test GET /api/v1/admin/data-wipe/preview."""
        response = await client.get("/api/v1/admin/data-wipe/preview")

        assert response.status_code == 200, (
            f"Expected 200, got {response.status_code}: {response.json()}"
        )

        data = response.json()
        assert data["messages"] == sample_data["messages"], (
            f"Expected {sample_data['messages']} messages, got {data['messages']}"
        )
        assert data["atoms"] == sample_data["atoms"]
        assert data["topics"] == sample_data["topics"]

    @pytest.mark.asyncio
    async def test_preview_data_wipe_with_scope(
        self,
        client: AsyncClient,
        sample_data: dict[str, int],
    ) -> None:
        """Test GET /api/v1/admin/data-wipe/preview with scope parameter."""
        response = await client.get(
            "/api/v1/admin/data-wipe/preview",
            params={"scope": "messages"},
        )

        assert response.status_code == 200

        data = response.json()
        assert "messages" in data
        assert "atoms" not in data
        assert "topics" not in data

    @pytest.mark.asyncio
    async def test_request_data_wipe(
        self,
        client: AsyncClient,
        sample_data: dict[str, int],
    ) -> None:
        """Test POST /api/v1/admin/data-wipe/request."""
        response = await client.post(
            "/api/v1/admin/data-wipe/request",
            json={"scope": "all"},
        )

        assert response.status_code == 200, (
            f"Expected 200, got {response.status_code}: {response.json()}"
        )

        data = response.json()
        assert "token" in data
        assert len(data["token"]) == 64, "Token should be 64 chars"
        assert data["scope"] == "all"
        assert "expires_at" in data
        assert "affected_counts" in data
        assert "warning" in data

        assert data["affected_counts"]["messages"] == sample_data["messages"]
        assert data["affected_counts"]["atoms"] == sample_data["atoms"]
        assert data["affected_counts"]["topics"] == sample_data["topics"]

    @pytest.mark.asyncio
    async def test_request_data_wipe_default_scope(
        self,
        client: AsyncClient,
        sample_data: dict[str, int],
    ) -> None:
        """Test POST /api/v1/admin/data-wipe/request with default scope."""
        response = await client.post(
            "/api/v1/admin/data-wipe/request",
            json={},
        )

        assert response.status_code == 200

        data = response.json()
        assert data["scope"] == "all", "Default scope should be 'all'"

    @pytest.mark.asyncio
    async def test_request_data_wipe_messages_scope(
        self,
        client: AsyncClient,
        sample_data: dict[str, int],
    ) -> None:
        """Test POST /api/v1/admin/data-wipe/request with messages scope."""
        response = await client.post(
            "/api/v1/admin/data-wipe/request",
            json={"scope": "messages"},
        )

        assert response.status_code == 200

        data = response.json()
        assert data["scope"] == "messages"
        assert "messages" in data["affected_counts"]
        assert "atoms" not in data["affected_counts"]

    @pytest.mark.asyncio
    async def test_execute_data_wipe(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        sample_data: dict[str, int],
    ) -> None:
        """Test POST /api/v1/admin/data-wipe/execute."""
        # First request a token
        request_response = await client.post(
            "/api/v1/admin/data-wipe/request",
            json={"scope": "all"},
        )
        assert request_response.status_code == 200

        token = request_response.json()["token"]

        # Execute with token
        execute_response = await client.post(
            "/api/v1/admin/data-wipe/execute",
            json={"token": token},
        )

        assert execute_response.status_code == 200, (
            f"Expected 200, got {execute_response.status_code}: {execute_response.json()}"
        )

        data = execute_response.json()
        assert data["success"] is True
        assert "deleted_counts" in data
        assert "message" in data

        assert data["deleted_counts"]["messages"] == sample_data["messages"]
        assert data["deleted_counts"]["atoms"] == sample_data["atoms"]
        assert data["deleted_counts"]["topics"] == sample_data["topics"]

    @pytest.mark.asyncio
    async def test_execute_data_wipe_invalid_token(
        self,
        client: AsyncClient,
    ) -> None:
        """Test POST /api/v1/admin/data-wipe/execute with invalid token."""
        response = await client.post(
            "/api/v1/admin/data-wipe/execute",
            json={"token": "invalid_token_12345678901234567890123456789012"},
        )

        assert response.status_code == 400, (
            f"Expected 400, got {response.status_code}"
        )
        assert "invalid" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_execute_data_wipe_token_too_short(
        self,
        client: AsyncClient,
    ) -> None:
        """Test POST /api/v1/admin/data-wipe/execute with short token."""
        response = await client.post(
            "/api/v1/admin/data-wipe/execute",
            json={"token": "short"},
        )

        # Pydantic validation should fail
        assert response.status_code == 422, (
            f"Expected 422 validation error, got {response.status_code}"
        )

    @pytest.mark.asyncio
    async def test_execute_data_wipe_expired_token(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
    ) -> None:
        """Test POST /api/v1/admin/data-wipe/execute with expired token."""
        # Create expired token directly in DB
        expired_token = ConfirmationToken(
            token="expired_token_12345678901234567890123456789012",
            scope="all",
            expires_at=datetime.now(UTC) - timedelta(minutes=10),
        )
        db_session.add(expired_token)
        await db_session.commit()

        response = await client.post(
            "/api/v1/admin/data-wipe/execute",
            json={"token": expired_token.token},
        )

        assert response.status_code == 400
        assert "invalid" in response.json()["detail"].lower() or "expired" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_execute_data_wipe_already_used_token(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        sample_data: dict[str, int],
    ) -> None:
        """Test POST /api/v1/admin/data-wipe/execute with already used token."""
        # Request token
        request_response = await client.post(
            "/api/v1/admin/data-wipe/request",
            json={"scope": "all"},
        )
        token = request_response.json()["token"]

        # First execution should succeed
        first_response = await client.post(
            "/api/v1/admin/data-wipe/execute",
            json={"token": token},
        )
        assert first_response.status_code == 200

        # Second execution should fail
        second_response = await client.post(
            "/api/v1/admin/data-wipe/execute",
            json={"token": token},
        )
        assert second_response.status_code == 400

    @pytest.mark.asyncio
    async def test_execute_data_wipe_preserves_sources(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        sample_source: Source,
        sample_data: dict[str, int],
    ) -> None:
        """Test that data wipe preserves sources."""
        # Request token
        request_response = await client.post(
            "/api/v1/admin/data-wipe/request",
            json={"scope": "all"},
        )
        token = request_response.json()["token"]

        # Execute wipe
        execute_response = await client.post(
            "/api/v1/admin/data-wipe/execute",
            json={"token": token},
        )
        assert execute_response.status_code == 200

        # Verify source is preserved
        result = await db_session.execute(
            select(Source).where(Source.id == sample_source.id)
        )
        source = result.scalar_one_or_none()
        assert source is not None, "Source should be preserved after wipe"

    @pytest.mark.asyncio
    async def test_execute_data_wipe_preserves_users(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        sample_user: User,
        sample_data: dict[str, int],
    ) -> None:
        """Test that data wipe preserves users."""
        # Request token
        request_response = await client.post(
            "/api/v1/admin/data-wipe/request",
            json={"scope": "all"},
        )
        token = request_response.json()["token"]

        # Execute wipe
        execute_response = await client.post(
            "/api/v1/admin/data-wipe/execute",
            json={"token": token},
        )
        assert execute_response.status_code == 200

        # Verify user is preserved
        result = await db_session.execute(
            select(User).where(User.id == sample_user.id)
        )
        user = result.scalar_one_or_none()
        assert user is not None, "User should be preserved after wipe"

    @pytest.mark.asyncio
    async def test_execute_data_wipe_messages_scope_preserves_atoms(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        sample_data: dict[str, int],
    ) -> None:
        """Test that messages scope preserves atoms and topics."""
        # Request token with messages scope
        request_response = await client.post(
            "/api/v1/admin/data-wipe/request",
            json={"scope": "messages"},
        )
        token = request_response.json()["token"]

        # Execute wipe
        execute_response = await client.post(
            "/api/v1/admin/data-wipe/execute",
            json={"token": token},
        )
        assert execute_response.status_code == 200

        # Verify atoms are preserved
        result = await db_session.execute(select(Atom))
        atoms = list(result.scalars().all())
        assert len(atoms) == sample_data["atoms"], (
            f"Expected {sample_data['atoms']} atoms, got {len(atoms)}"
        )

        # Verify topics are preserved
        result = await db_session.execute(select(Topic))
        topics = list(result.scalars().all())
        assert len(topics) == sample_data["topics"], (
            f"Expected {sample_data['topics']} topics, got {len(topics)}"
        )

        # Verify messages are deleted
        result = await db_session.execute(select(Message))
        messages = list(result.scalars().all())
        assert len(messages) == 0, "All messages should be deleted"
