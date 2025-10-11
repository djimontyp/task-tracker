"""Test configuration and fixtures."""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from sqlalchemy import JSON, event
from sqlalchemy.types import TypeDecorator
from sqlalchemy.dialects import postgresql

# Monkey patch JSONB BEFORE any imports from app
# This ensures SQLite compatibility for testing
class SQLiteJSON(TypeDecorator):
    """Use JSON for SQLite instead of JSONB."""
    impl = JSON
    cache_ok = True

# Replace JSONB with JSON for SQLite testing
postgresql.JSONB = SQLiteJSON

# Now safe to import app modules
from cryptography.fernet import Fernet
from core.config import settings

from app.main import app
from app.database import get_db_session

# Ensure test-safe ENCRYPTION_KEY for CredentialEncryption usage
if not settings.encryption_key:
    settings.encryption_key = Fernet.generate_key().decode()


# Test database URL (in-memory SQLite)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

# Enable foreign keys for SQLite
@event.listens_for(test_engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    """Configure SQLite for better testing."""
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

# Create test session factory
TestSessionLocal = sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def override_get_db_session():
    """Override database dependency for testing."""
    async with TestSessionLocal() as session:
        yield session


# Override the database dependency
app.dependency_overrides[get_db_session] = override_get_db_session


@pytest.fixture(scope="function")
async def db_session():
    """Create a fresh database for each test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest.fixture(scope="function")
async def client(db_session):
    """Create an async HTTP client for testing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
