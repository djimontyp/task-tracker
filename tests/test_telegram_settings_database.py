"""
Comprehensive tests for Settings database model and operations.

Tests cover:
- Settings model creation and updates
- Encryption/decryption in database context
- Singleton pattern enforcement (id=1)
- Database transactions and error handling
- Migration compatibility and field validation
- Concurrent access scenarios
"""
import pytest
from datetime import datetime, timezone
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlmodel import SQLModel, select

from core.crypto import encrypt_sensitive_data, decrypt_sensitive_data
from app.models import Settings, SettingsRequest, SettingsResponse


# Test database URL - uses in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def test_engine():
    """Create test database engine"""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    yield engine
    await engine.dispose()


@pytest.fixture
async def test_session(test_engine):
    """Create test database session"""
    async with AsyncSession(test_engine) as session:
        yield session


class TestSettingsModel:
    """Test suite for Settings SQLModel"""

    @pytest.mark.asyncio
    async def test_settings_model_creation(self, test_session):
        """Test basic Settings model creation"""
        # Create settings with encrypted token
        encrypted_token = encrypt_sensitive_data("1234567890:ABC-DEF1234ghIkl")

        settings = Settings(
            id=1,
            telegram_bot_token_encrypted=encrypted_token,
            telegram_webhook_base_url="https://example.com"
        )

        test_session.add(settings)
        await test_session.commit()
        await test_session.refresh(settings)

        assert settings.id == 1
        assert settings.telegram_bot_token_encrypted == encrypted_token
        assert settings.telegram_webhook_base_url == "https://example.com"
        assert settings.created_at is not None
        assert settings.updated_at is not None

    @pytest.mark.asyncio
    async def test_settings_encryption_decryption_in_db(self, test_session):
        """Test that encryption/decryption works correctly through database operations"""
        original_token = "1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
        encrypted_token = encrypt_sensitive_data(original_token)

        # Save to database
        settings = Settings(
            id=1,
            telegram_bot_token_encrypted=encrypted_token,
            telegram_webhook_base_url="https://myapp.com"
        )

        test_session.add(settings)
        await test_session.commit()

        # Retrieve from database
        statement = select(Settings).where(Settings.id == 1)
        result = await test_session.execute(statement)
        retrieved_settings = result.scalar_one()

        # Decrypt and verify
        decrypted_token = decrypt_sensitive_data(retrieved_settings.telegram_bot_token_encrypted)
        assert decrypted_token == original_token
        assert retrieved_settings.telegram_webhook_base_url == "https://myapp.com"

    @pytest.mark.asyncio
    async def test_settings_update(self, test_session):
        """Test updating existing settings"""
        # Create initial settings
        initial_token = encrypt_sensitive_data("initial_token")
        settings = Settings(
            id=1,
            telegram_bot_token_encrypted=initial_token,
            telegram_webhook_base_url="https://initial.com"
        )

        test_session.add(settings)
        await test_session.commit()
        initial_updated_at = settings.updated_at

        # Update settings
        new_token = encrypt_sensitive_data("new_token")
        settings.telegram_bot_token_encrypted = new_token
        settings.telegram_webhook_base_url = "https://updated.com"

        await test_session.commit()
        await test_session.refresh(settings)

        # Verify updates
        assert decrypt_sensitive_data(settings.telegram_bot_token_encrypted) == "new_token"
        assert settings.telegram_webhook_base_url == "https://updated.com"
        assert settings.updated_at > initial_updated_at

    @pytest.mark.asyncio
    async def test_settings_singleton_pattern_enforcement(self, test_session):
        """Test that only one settings record with id=1 should exist"""
        # Create first settings record
        settings1 = Settings(
            id=1,
            telegram_bot_token_encrypted=encrypt_sensitive_data("token1"),
            telegram_webhook_base_url="https://first.com"
        )
        test_session.add(settings1)
        await test_session.commit()

        # Try to create second settings record with same id
        settings2 = Settings(
            id=1,
            telegram_bot_token_encrypted=encrypt_sensitive_data("token2"),
            telegram_webhook_base_url="https://second.com"
        )
        test_session.add(settings2)

        # Should raise integrity constraint error
        with pytest.raises(Exception):  # Will be IntegrityError in practice
            await test_session.commit()

    @pytest.mark.asyncio
    async def test_settings_with_null_token(self, test_session):
        """Test settings creation with null encrypted token"""
        settings = Settings(
            id=1,
            telegram_bot_token_encrypted=None,
            telegram_webhook_base_url="https://example.com"
        )

        test_session.add(settings)
        await test_session.commit()
        await test_session.refresh(settings)

        assert settings.telegram_bot_token_encrypted is None
        assert settings.telegram_webhook_base_url == "https://example.com"

    @pytest.mark.asyncio
    async def test_settings_with_empty_encrypted_token(self, test_session):
        """Test settings with empty encrypted token (empty string handling)"""
        settings = Settings(
            id=1,
            telegram_bot_token_encrypted="",  # Empty encrypted token
            telegram_webhook_base_url="https://example.com"
        )

        test_session.add(settings)
        await test_session.commit()

        # Retrieve and verify
        statement = select(Settings).where(Settings.id == 1)
        result = await test_session.execute(statement)
        retrieved = result.scalar_one()

        assert retrieved.telegram_bot_token_encrypted == ""
        # Empty encrypted token should decrypt to empty string
        assert decrypt_sensitive_data(retrieved.telegram_bot_token_encrypted) == ""

    @pytest.mark.asyncio
    async def test_settings_webhook_url_length_limits(self, test_session):
        """Test webhook URL field length constraints"""
        # Test with maximum allowed URL length (500 chars as per model)
        long_url = "https://" + "a" * 485 + ".com"  # Total 500 chars

        settings = Settings(
            id=1,
            telegram_bot_token_encrypted=encrypt_sensitive_data("test_token"),
            telegram_webhook_base_url=long_url
        )

        test_session.add(settings)
        await test_session.commit()
        await test_session.refresh(settings)

        assert settings.telegram_webhook_base_url == long_url

    @pytest.mark.asyncio
    async def test_settings_timestamps(self, test_session):
        """Test that timestamps are properly managed"""
        settings = Settings(
            id=1,
            telegram_bot_token_encrypted=encrypt_sensitive_data("test_token"),
            telegram_webhook_base_url="https://example.com"
        )

        test_session.add(settings)
        await test_session.commit()
        await test_session.refresh(settings)

        # Check that timestamps were set
        assert settings.created_at is not None
        assert settings.updated_at is not None
        assert isinstance(settings.created_at, datetime)
        assert isinstance(settings.updated_at, datetime)

        # They should be very close to each other on creation
        time_diff = abs((settings.updated_at - settings.created_at).total_seconds())
        assert time_diff < 1.0  # Less than 1 second difference


class TestSettingsRequestResponseModels:
    """Test suite for Settings request/response models"""

    def test_settings_request_validation(self):
        """Test SettingsRequest model validation"""
        # Valid request
        valid_data = {
            "telegram": {
                "bot_token": "1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
                "webhook_base_url": "https://myapp.example.com"
            }
        }
        request = SettingsRequest(**valid_data)
        assert request.telegram["bot_token"] == valid_data["telegram"]["bot_token"]
        assert request.telegram["webhook_base_url"] == valid_data["telegram"]["webhook_base_url"]

    def test_settings_request_missing_telegram(self):
        """Test SettingsRequest validation with missing telegram config"""
        with pytest.raises(Exception):  # Pydantic ValidationError
            SettingsRequest()

    def test_settings_request_with_partial_telegram_config(self):
        """Test SettingsRequest with partial telegram configuration"""
        # Only bot token
        request = SettingsRequest(telegram={"bot_token": "test_token"})
        assert request.telegram["bot_token"] == "test_token"
        assert "webhook_base_url" not in request.telegram

        # Only webhook URL
        request = SettingsRequest(telegram={"webhook_base_url": "https://example.com"})
        assert request.telegram["webhook_base_url"] == "https://example.com"
        assert "bot_token" not in request.telegram

    def test_settings_response_creation(self):
        """Test SettingsResponse model creation"""
        response = SettingsResponse(
            telegram={
                "bot_token": "1234567890:ABC-DEF...[truncated]",
                "webhook_base_url": "https://example.com"
            },
            updated_at=datetime.now(timezone.utc)
        )

        assert response.telegram["bot_token"] == "1234567890:ABC-DEF...[truncated]"
        assert response.telegram["webhook_base_url"] == "https://example.com"
        assert isinstance(response.updated_at, datetime)

    def test_settings_response_with_none_updated_at(self):
        """Test SettingsResponse with None updated_at (no existing settings)"""
        response = SettingsResponse(
            telegram={
                "bot_token": "",
                "webhook_base_url": "https://default.com"
            },
            updated_at=None
        )

        assert response.updated_at is None


class TestSettingsDatabaseTransactions:
    """Test suite for database transaction handling"""

    @pytest.mark.asyncio
    async def test_settings_transaction_rollback(self, test_session):
        """Test that failed transactions properly rollback"""
        # Create initial settings
        settings = Settings(
            id=1,
            telegram_bot_token_encrypted=encrypt_sensitive_data("original_token"),
            telegram_webhook_base_url="https://original.com"
        )
        test_session.add(settings)
        await test_session.commit()

        # Start transaction that will fail
        try:
            settings.telegram_bot_token_encrypted = encrypt_sensitive_data("updated_token")
            settings.telegram_webhook_base_url = "https://updated.com"

            # Force an error (attempt to insert duplicate)
            duplicate_settings = Settings(
                id=1,
                telegram_bot_token_encrypted=encrypt_sensitive_data("duplicate"),
                telegram_webhook_base_url="https://duplicate.com"
            )
            test_session.add(duplicate_settings)
            await test_session.commit()
        except Exception:
            await test_session.rollback()

        # Verify original data is preserved
        await test_session.refresh(settings)
        assert decrypt_sensitive_data(settings.telegram_bot_token_encrypted) == "original_token"
        assert settings.telegram_webhook_base_url == "https://original.com"

    @pytest.mark.asyncio
    async def test_settings_concurrent_updates(self, test_engine):
        """Test handling of concurrent updates to settings"""
        # Create initial settings
        async with AsyncSession(test_engine) as session1:
            settings = Settings(
                id=1,
                telegram_bot_token_encrypted=encrypt_sensitive_data("initial_token"),
                telegram_webhook_base_url="https://initial.com"
            )
            session1.add(settings)
            await session1.commit()

        # Simulate concurrent updates
        async with AsyncSession(test_engine) as session2:
            async with AsyncSession(test_engine) as session3:
                # Both sessions load the same record
                stmt = select(Settings).where(Settings.id == 1)

                result2 = await session2.execute(stmt)
                settings2 = result2.scalar_one()

                result3 = await session3.execute(stmt)
                settings3 = result3.scalar_one()

                # Update in session2
                settings2.telegram_bot_token_encrypted = encrypt_sensitive_data("token_from_session2")
                await session2.commit()

                # Update in session3 (should work due to optimistic concurrency)
                settings3.telegram_webhook_base_url = "https://from-session3.com"
                await session3.commit()

                # Verify final state
                final_stmt = select(Settings).where(Settings.id == 1)
                async with AsyncSession(test_engine) as verify_session:
                    result = await verify_session.execute(final_stmt)
                    final_settings = result.scalar_one()

                    # Should have updates from both sessions
                    assert decrypt_sensitive_data(final_settings.telegram_bot_token_encrypted) == "token_from_session2"
                    assert final_settings.telegram_webhook_base_url == "https://from-session3.com"

    @pytest.mark.asyncio
    async def test_settings_query_performance(self, test_session):
        """Test that settings queries are performant (basic performance test)"""
        import time

        # Create settings
        settings = Settings(
            id=1,
            telegram_bot_token_encrypted=encrypt_sensitive_data("performance_test_token"),
            telegram_webhook_base_url="https://performance.test.com"
        )
        test_session.add(settings)
        await test_session.commit()

        # Measure query time
        start_time = time.time()
        for _ in range(100):
            statement = select(Settings).where(Settings.id == 1)
            result = await test_session.execute(statement)
            retrieved_settings = result.scalar_one()
            assert retrieved_settings is not None
        query_time = time.time() - start_time

        # Should complete 100 queries in reasonable time (< 1 second for in-memory SQLite)
        assert query_time < 1.0

    @pytest.mark.asyncio
    async def test_settings_with_large_encrypted_data(self, test_session):
        """Test settings with large encrypted token data"""
        # Create a very long token (simulating edge case)
        long_token = "x" * 1000  # 1000 character token
        encrypted_long_token = encrypt_sensitive_data(long_token)

        settings = Settings(
            id=1,
            telegram_bot_token_encrypted=encrypted_long_token,
            telegram_webhook_base_url="https://large-data.test"
        )

        test_session.add(settings)
        await test_session.commit()
        await test_session.refresh(settings)

        # Verify data integrity
        decrypted = decrypt_sensitive_data(settings.telegram_bot_token_encrypted)
        assert decrypted == long_token
        assert len(decrypted) == 1000


class TestSettingsDatabaseSchema:
    """Test suite for Settings database schema validation"""

    @pytest.mark.asyncio
    async def test_settings_table_exists(self, test_session):
        """Test that settings table is properly created"""
        # Check table existence by attempting to query
        statement = select(Settings)
        result = await test_session.execute(statement)
        # Should not raise exception
        assert result is not None

    @pytest.mark.asyncio
    async def test_settings_table_columns(self, test_session):
        """Test that all expected columns exist in settings table"""
        # Insert a complete record to validate all columns
        settings = Settings(
            id=1,
            telegram_bot_token_encrypted=encrypt_sensitive_data("test_token"),
            telegram_webhook_base_url="https://test-columns.com"
        )

        test_session.add(settings)
        await test_session.commit()
        await test_session.refresh(settings)

        # Verify all expected fields are accessible
        assert hasattr(settings, 'id')
        assert hasattr(settings, 'telegram_bot_token_encrypted')
        assert hasattr(settings, 'telegram_webhook_base_url')
        assert hasattr(settings, 'created_at')
        assert hasattr(settings, 'updated_at')

        # Verify field values and types
        assert isinstance(settings.id, int)
        assert isinstance(settings.telegram_bot_token_encrypted, str)
        assert isinstance(settings.telegram_webhook_base_url, str)
        assert isinstance(settings.created_at, datetime)
        assert isinstance(settings.updated_at, datetime)

    @pytest.mark.asyncio
    async def test_settings_field_constraints(self, test_session):
        """Test field constraints and validations"""
        # Test with None values where allowed
        settings = Settings(
            id=1,
            telegram_bot_token_encrypted=None,
            telegram_webhook_base_url=None
        )

        test_session.add(settings)
        await test_session.commit()

        # Should succeed - these fields allow None
        assert settings.telegram_bot_token_encrypted is None
        assert settings.telegram_webhook_base_url is None