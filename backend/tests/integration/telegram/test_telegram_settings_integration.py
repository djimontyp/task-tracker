"""
Comprehensive integration tests for Telegram settings system.

Tests cover:
- Full workflow: save settings → validate token → setup webhook → retrieve settings
- Error cascade scenarios and recovery
- Environment variable integration across all components
- Database transaction handling in full workflow
- Performance testing for complete operations
- Security validation across the entire system
- Real-world scenario simulation
"""

import asyncio
import os
import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.main import app
from app.models import Settings
from core.crypto import SettingsCrypto, decrypt_sensitive_data, encrypt_sensitive_data
from core.telegram import TelegramWebhookManager
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlmodel import SQLModel, select

# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def test_engine():
    """Create test database engine for integration tests"""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture
async def test_session(test_engine):
    """Create test database session for integration tests"""
    async with AsyncSession(test_engine) as session:
        yield session


class TestTelegramSettingsFullIntegration:
    """Full integration tests for the complete Telegram settings workflow"""

    @pytest.mark.asyncio
    async def test_complete_settings_workflow_success(self, test_session):
        """Test complete successful workflow from API request to final storage"""
        # Step 1: Mock successful Telegram API responses
        with patch("core.telegram.httpx.AsyncClient") as mock_client:
            # Mock bot validation response
            validation_response = AsyncMock()
            validation_response.json.return_value = {
                "ok": True,
                "result": {
                    "id": 123456789,
                    "is_bot": True,
                    "first_name": "IntegrationTestBot",
                    "username": "integration_test_bot",
                    "can_join_groups": True,
                },
            }
            validation_response.raise_for_status.return_value = None

            # Mock webhook setup response
            webhook_response = AsyncMock()
            webhook_response.json.return_value = {"ok": True, "result": True, "description": "Webhook was set"}
            webhook_response.raise_for_status.return_value = None

            # Configure mock client to return appropriate responses
            def mock_request(*args, **kwargs):
                if "/getMe" in args[0]:
                    return validation_response
                elif "/setWebhook" in args[0]:
                    return webhook_response
                return AsyncMock()

            mock_async_client = mock_client.return_value.__aenter__.return_value
            mock_async_client.get.side_effect = mock_request
            mock_async_client.post.side_effect = mock_request

            # Step 2: Test the complete API workflow
            mock_settings = MagicMock()
            mock_settings.webhook_base_url = "https://integration-test.com"

            with patch("app.routers.get_settings", return_value=mock_settings):
                with patch("app.routers.get_db_session", return_value=test_session):
                    async with AsyncClient(app=app, base_url="http://test") as client:
                        # Step 2a: Initial GET should return empty settings
                        get_response = await client.get("/api/settings")
                        assert get_response.status_code == 200
                        initial_data = get_response.json()
                        assert initial_data["updated_at"] is None

                        # Step 2b: POST new settings
                        request_data = {
                            "telegram": {
                                "bot_token": "1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
                                "webhook_base_url": "https://integration-test.com",
                            }
                        }

                        post_response = await client.post("/api/settings", json=request_data)
                        assert post_response.status_code == 200
                        post_data = post_response.json()

                        # Verify response data
                        assert post_data["telegram"]["bot_token"] == "1234567890...[truncated]"
                        assert post_data["telegram"]["webhook_base_url"] == "https://integration-test.com"
                        assert post_data["updated_at"] is not None

            # Step 3: Verify data persistence in database
            statement = select(Settings).where(Settings.id == 1)
            result = await test_session.execute(statement)
            saved_settings = result.scalar_one()

            assert saved_settings is not None
            assert saved_settings.telegram_webhook_base_url == "https://integration-test.com"

            # Step 4: Verify encryption/decryption works
            decrypted_token = decrypt_sensitive_data(saved_settings.telegram_bot_token_encrypted)
            assert decrypted_token == "1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"

    @pytest.mark.asyncio
    async def test_settings_update_workflow(self, test_session):
        """Test updating existing settings preserves data integrity"""
        # Step 1: Create initial settings
        initial_token = "initial_1234567890:ABC-DEF-INITIAL"
        encrypted_initial = encrypt_sensitive_data(initial_token)

        initial_settings = Settings(
            id=1,
            telegram_bot_token_encrypted=encrypted_initial,
            telegram_webhook_base_url="https://initial-webhook.com",
        )
        test_session.add(initial_settings)
        await test_session.commit()

        # Step 2: Update via API
        with patch("core.telegram.httpx.AsyncClient") as mock_client:
            # Mock successful responses for update
            validation_response = AsyncMock()
            validation_response.json.return_value = {
                "ok": True,
                "result": {"id": 987654321, "is_bot": True, "first_name": "UpdatedBot", "username": "updated_bot"},
            }
            validation_response.raise_for_status.return_value = None

            webhook_response = AsyncMock()
            webhook_response.json.return_value = {"ok": True, "result": True}
            webhook_response.raise_for_status.return_value = None

            mock_async_client = mock_client.return_value.__aenter__.return_value
            mock_async_client.get.return_value = validation_response
            mock_async_client.post.return_value = webhook_response

            mock_settings = MagicMock()
            mock_settings.webhook_base_url = "https://fallback.com"

            with patch("app.routers.get_settings", return_value=mock_settings):
                with patch("app.routers.get_db_session", return_value=test_session):
                    async with AsyncClient(app=app, base_url="http://test") as client:
                        # Update with new data
                        update_data = {
                            "telegram": {
                                "bot_token": "updated_9876543210:XYZ-NEW-TOKEN",
                                "webhook_base_url": "https://updated-webhook.com",
                            }
                        }

                        response = await client.post("/api/settings", json=update_data)
                        assert response.status_code == 200

        # Step 3: Verify update in database
        await test_session.refresh(initial_settings)
        decrypted_updated = decrypt_sensitive_data(initial_settings.telegram_bot_token_encrypted)
        assert decrypted_updated == "updated_9876543210:XYZ-NEW-TOKEN"
        assert initial_settings.telegram_webhook_base_url == "https://updated-webhook.com"

    @pytest.mark.asyncio
    async def test_error_cascade_and_recovery(self, test_session):
        """Test system behavior when different components fail"""
        mock_settings = MagicMock()
        mock_settings.webhook_base_url = "https://fallback-test.com"

        # Scenario 1: Telegram API validation fails
        with patch("core.telegram.httpx.AsyncClient") as mock_client:
            mock_async_client = mock_client.return_value.__aenter__.return_value
            mock_async_client.get.side_effect = Exception("Telegram API unavailable")

            with patch("app.routers.get_settings", return_value=mock_settings):
                with patch("app.routers.get_db_session", return_value=test_session):
                    async with AsyncClient(app=app, base_url="http://test") as client:
                        request_data = {"telegram": {"bot_token": "test_token", "webhook_base_url": "https://test.com"}}

                        response = await client.post("/api/settings", json=request_data)

                        # Should fail with 400 due to token validation failure
                        assert response.status_code == 400
                        assert "Token validation failed" in response.json()["detail"]

        # Scenario 2: Token validation passes, webhook setup fails
        with patch("core.telegram.httpx.AsyncClient") as mock_client:
            validation_response = AsyncMock()
            validation_response.json.return_value = {
                "ok": True,
                "result": {"id": 123, "is_bot": True, "first_name": "TestBot"},
            }
            validation_response.raise_for_status.return_value = None

            mock_async_client = mock_client.return_value.__aenter__.return_value

            def mock_request(*args, **kwargs):
                if "/getMe" in args[0]:
                    return validation_response
                elif "/setWebhook" in args[0]:
                    raise Exception("Webhook setup failed")
                return AsyncMock()

            mock_async_client.get.side_effect = mock_request
            mock_async_client.post.side_effect = mock_request

            with patch("app.routers.get_settings", return_value=mock_settings):
                with patch("app.routers.get_db_session", return_value=test_session):
                    async with AsyncClient(app=app, base_url="http://test") as client:
                        request_data = {
                            "telegram": {"bot_token": "valid_token_123:ABC", "webhook_base_url": "https://test.com"}
                        }

                        response = await client.post("/api/settings", json=request_data)

                        # Should succeed (200) even though webhook setup failed
                        assert response.status_code == 200
                        # Settings should still be saved to database
                        statement = select(Settings).where(Settings.id == 1)
                        result = await test_session.execute(statement)
                        saved_settings = result.scalar_one()
                        assert (
                            decrypt_sensitive_data(saved_settings.telegram_bot_token_encrypted) == "valid_token_123:ABC"
                        )

    @pytest.mark.asyncio
    async def test_concurrent_settings_operations(self, test_engine):
        """Test concurrent access to settings doesn't cause data corruption"""

        async def create_settings_operation(session_id: int, token_suffix: str):
            """Simulate concurrent settings creation/update"""
            async with AsyncSession(test_engine) as session:
                try:
                    # Try to create or update settings
                    statement = select(Settings).where(Settings.id == 1)
                    result = await session.execute(statement)
                    existing = result.scalar_one_or_none()

                    token = f"concurrent_token_{session_id}:{token_suffix}"
                    encrypted_token = encrypt_sensitive_data(token)

                    if existing:
                        existing.telegram_bot_token_encrypted = encrypted_token
                        existing.telegram_webhook_base_url = f"https://concurrent-{session_id}.com"
                    else:
                        new_settings = Settings(
                            id=1,
                            telegram_bot_token_encrypted=encrypted_token,
                            telegram_webhook_base_url=f"https://concurrent-{session_id}.com",
                        )
                        session.add(new_settings)

                    await session.commit()
                    return f"session_{session_id}_success"
                except Exception as e:
                    await session.rollback()
                    return f"session_{session_id}_failed: {e}"

        # Run concurrent operations
        tasks = [create_settings_operation(i, f"TOKEN{i:03d}") for i in range(5)]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # At least one should succeed
        successful_operations = [r for r in results if "success" in str(r)]
        assert len(successful_operations) >= 1

        # Verify final state is consistent
        async with AsyncSession(test_engine) as final_session:
            statement = select(Settings).where(Settings.id == 1)
            result = await final_session.execute(statement)
            final_settings = result.scalar_one_or_none()

            if final_settings:
                # Should be able to decrypt whatever token ended up being saved
                decrypted = decrypt_sensitive_data(final_settings.telegram_bot_token_encrypted)
                assert "concurrent_token_" in decrypted
                assert final_settings.telegram_webhook_base_url.startswith("https://concurrent-")

    @pytest.mark.asyncio
    async def test_performance_full_workflow(self, test_session):
        """Test performance of complete settings workflow"""
        with patch("core.telegram.httpx.AsyncClient") as mock_client:
            # Setup fast mock responses
            fast_response = AsyncMock()
            fast_response.json.return_value = {
                "ok": True,
                "result": {"id": 123, "is_bot": True, "first_name": "FastBot"},
            }
            fast_response.raise_for_status.return_value = None

            mock_async_client = mock_client.return_value.__aenter__.return_value
            mock_async_client.get.return_value = fast_response
            mock_async_client.post.return_value = fast_response

            mock_settings = MagicMock()
            mock_settings.webhook_base_url = "https://performance-test.com"

            # Measure complete workflow time
            start_time = time.time()

            with patch("app.routers.get_settings", return_value=mock_settings):
                with patch("app.routers.get_db_session", return_value=test_session):
                    async with AsyncClient(app=app, base_url="http://test") as client:
                        for i in range(10):
                            request_data = {
                                "telegram": {
                                    "bot_token": f"perf_test_{i}:TOKEN",
                                    "webhook_base_url": "https://performance-test.com",
                                }
                            }

                            response = await client.post("/api/settings", json=request_data)
                            assert response.status_code == 200

            workflow_time = time.time() - start_time

            # Should complete 10 full workflows in reasonable time
            assert workflow_time < 5.0  # 5 seconds for 10 operations
            print(f"Performance test: 10 complete workflows in {workflow_time:.2f} seconds")

    @pytest.mark.asyncio
    async def test_security_validation_integration(self, test_session):
        """Test security aspects across the complete system"""
        # Test 1: Ensure tokens are never exposed in logs or responses
        with patch("core.telegram.httpx.AsyncClient") as mock_client:
            validation_response = AsyncMock()
            validation_response.json.return_value = {
                "ok": True,
                "result": {"id": 123, "is_bot": True, "first_name": "SecurityBot"},
            }
            validation_response.raise_for_status.return_value = None

            webhook_response = AsyncMock()
            webhook_response.json.return_value = {"ok": True, "result": True}
            webhook_response.raise_for_status.return_value = None

            mock_async_client = mock_client.return_value.__aenter__.return_value
            mock_async_client.get.return_value = validation_response
            mock_async_client.post.return_value = webhook_response

            mock_settings = MagicMock()
            mock_settings.webhook_base_url = "https://security-test.com"

            sensitive_token = "SENSITIVE_1234567890:VERY-SECRET-TOKEN-DATA"

            with patch("app.routers.get_settings", return_value=mock_settings):
                with patch("app.routers.get_db_session", return_value=test_session):
                    async with AsyncClient(app=app, base_url="http://test") as client:
                        request_data = {
                            "telegram": {"bot_token": sensitive_token, "webhook_base_url": "https://security-test.com"}
                        }

                        response = await client.post("/api/settings", json=request_data)
                        assert response.status_code == 200

                        # Check response doesn't contain full token
                        response_text = response.text
                        assert sensitive_token not in response_text
                        assert "VERY-SECRET-TOKEN-DATA" not in response_text

                        # Verify token is properly truncated in response
                        data = response.json()
                        assert data["telegram"]["bot_token"].endswith("...[truncated]")

        # Test 2: Verify database storage is encrypted
        statement = select(Settings).where(Settings.id == 1)
        result = await test_session.execute(statement)
        settings = result.scalar_one()

        # Raw encrypted data should not contain the original token
        assert sensitive_token not in settings.telegram_bot_token_encrypted
        assert "VERY-SECRET-TOKEN-DATA" not in settings.telegram_bot_token_encrypted

        # But decryption should work
        decrypted = decrypt_sensitive_data(settings.telegram_bot_token_encrypted)
        assert decrypted == sensitive_token

    @pytest.mark.asyncio
    async def test_environment_variable_integration_complete(self, test_session):
        """Test complete integration with various environment variable scenarios"""
        # Test with custom environment settings
        custom_env = {
            "TELEGRAM_BOT_TOKEN": "env_1234567890:ENV-FALLBACK-TOKEN",
            "WEBHOOK_BASE_URL": "https://env-fallback-webhook.com",
            "SETTINGS_ENCRYPTION_KEY": "custom-encryption-key-for-testing",
        }

        with patch.dict(os.environ, custom_env):
            # Create new crypto instance to use custom encryption key
            custom_crypto = SettingsCrypto()

            mock_settings = MagicMock()
            mock_settings.telegram_bot_token = custom_env["TELEGRAM_BOT_TOKEN"]
            mock_settings.webhook_base_url = custom_env["WEBHOOK_BASE_URL"]

            # Test GET with environment fallback
            mock_result = AsyncMock()
            mock_result.scalar_one_or_none.return_value = None  # No DB data
            test_session.execute.return_value = mock_result

            with patch("app.routers.get_settings", return_value=mock_settings):
                with patch("app.routers.get_db_session", return_value=test_session):
                    async with AsyncClient(app=app, base_url="http://test") as client:
                        response = await client.get("/api/settings")
                        assert response.status_code == 200

                        data = response.json()
                        assert data["telegram"]["bot_token"] == "env_123456...[truncated]"
                        assert data["telegram"]["webhook_base_url"] == "https://env-fallback-webhook.com"

            # Test that custom encryption key works
            test_token = "test_encryption_with_custom_key"
            encrypted = custom_crypto.encrypt(test_token)
            decrypted = custom_crypto.decrypt(encrypted)
            assert decrypted == test_token

            # Ensure different encryption key produces different results
            default_crypto = SettingsCrypto()
            default_encrypted = default_crypto.encrypt(test_token)
            assert encrypted != default_encrypted  # Different encryption keys produce different results

    @pytest.mark.asyncio
    async def test_telegram_webhook_manager_integration(self):
        """Test TelegramWebhookManager integration with real timeout scenarios"""
        # Test with very short timeout to simulate slow network
        manager = TelegramWebhookManager(timeout=0.001)  # 1ms timeout

        with patch("core.telegram.httpx.AsyncClient") as mock_client:
            # Simulate slow response
            mock_async_client = mock_client.return_value.__aenter__.return_value
            mock_async_client.get.side_effect = asyncio.sleep(0.1)  # 100ms delay > 1ms timeout

            # Should handle timeout gracefully
            result = await manager.validate_bot_token("timeout_test_token")
            assert result["valid"] is False
            assert "Token validation failed" in result["error"]

        # Test successful integration
        manager_normal = TelegramWebhookManager(timeout=5)

        with patch("core.telegram.httpx.AsyncClient") as mock_client:
            success_response = AsyncMock()
            success_response.json.return_value = {
                "ok": True,
                "result": {"id": 123, "is_bot": True, "first_name": "IntegrationBot"},
            }
            success_response.raise_for_status.return_value = None

            mock_async_client = mock_client.return_value.__aenter__.return_value
            mock_async_client.get.return_value = success_response

            result = await manager_normal.validate_bot_token("integration_test_token")
            assert result["valid"] is True
            assert result["bot_info"]["id"] == 123


class TestTelegramSettingsRealWorldScenarios:
    """Test real-world scenarios and edge cases"""

    @pytest.mark.asyncio
    async def test_system_restart_data_persistence(self, test_session):
        """Simulate system restart and verify data persistence"""
        # Step 1: Save settings
        original_token = "restart_test_1234567890:ABC-DEF-RESTART-TEST"
        encrypted_token = encrypt_sensitive_data(original_token)

        settings = Settings(
            id=1, telegram_bot_token_encrypted=encrypted_token, telegram_webhook_base_url="https://restart-test.com"
        )
        test_session.add(settings)
        await test_session.commit()

        # Step 2: Simulate restart by creating new crypto instance
        new_crypto = SettingsCrypto()

        # Step 3: Retrieve and decrypt data with new instance
        statement = select(Settings).where(Settings.id == 1)
        result = await test_session.execute(statement)
        retrieved_settings = result.scalar_one()

        decrypted_token = new_crypto.decrypt(retrieved_settings.telegram_bot_token_encrypted)
        assert decrypted_token == original_token

    @pytest.mark.asyncio
    async def test_partial_system_failure_recovery(self, test_session):
        """Test recovery from partial system failures"""
        # Scenario: Database saves successfully but webhook setup fails
        with patch("core.telegram.httpx.AsyncClient") as mock_client:
            # Mock successful validation
            validation_response = AsyncMock()
            validation_response.json.return_value = {
                "ok": True,
                "result": {"id": 123, "is_bot": True, "first_name": "RecoveryBot"},
            }
            validation_response.raise_for_status.return_value = None

            # Mock webhook failure
            webhook_response = AsyncMock()
            webhook_response.json.return_value = {"ok": False, "description": "Bad Request: invalid webhook URL"}
            webhook_response.raise_for_status.return_value = None

            mock_async_client = mock_client.return_value.__aenter__.return_value
            mock_async_client.get.return_value = validation_response
            mock_async_client.post.return_value = webhook_response

            mock_settings = MagicMock()
            mock_settings.webhook_base_url = "https://recovery-test.com"

            with patch("app.routers.get_settings", return_value=mock_settings):
                with patch("app.routers.get_db_session", return_value=test_session):
                    async with AsyncClient(app=app, base_url="http://test") as client:
                        request_data = {
                            "telegram": {
                                "bot_token": "recovery_test_token",
                                "webhook_base_url": "https://invalid-webhook-url",
                            }
                        }

                        response = await client.post("/api/settings", json=request_data)

                        # Should succeed despite webhook failure
                        assert response.status_code == 200

                        # Verify data was saved to database
                        statement = select(Settings).where(Settings.id == 1)
                        result = await test_session.execute(statement)
                        saved_settings = result.scalar_one()

                        decrypted_token = decrypt_sensitive_data(saved_settings.telegram_bot_token_encrypted)
                        assert decrypted_token == "recovery_test_token"

    @pytest.mark.asyncio
    async def test_large_scale_token_rotation(self, test_session):
        """Test token rotation scenario with multiple updates"""
        tokens = [f"rotation_test_{i}:TOKEN-{i:03d}-ABCDEFGHIJKLMNOP" for i in range(20)]

        with patch("core.telegram.httpx.AsyncClient") as mock_client:
            # Mock successful responses for all operations
            success_response = AsyncMock()
            success_response.json.return_value = {
                "ok": True,
                "result": {"id": 123, "is_bot": True, "first_name": "RotationBot"},
            }
            success_response.raise_for_status.return_value = None

            mock_async_client = mock_client.return_value.__aenter__.return_value
            mock_async_client.get.return_value = success_response
            mock_async_client.post.return_value = success_response

            mock_settings = MagicMock()
            mock_settings.webhook_base_url = "https://rotation-test.com"

            # Rotate through all tokens
            with patch("app.routers.get_settings", return_value=mock_settings):
                with patch("app.routers.get_db_session", return_value=test_session):
                    async with AsyncClient(app=app, base_url="http://test") as client:
                        for i, token in enumerate(tokens):
                            request_data = {
                                "telegram": {"bot_token": token, "webhook_base_url": f"https://rotation-test-{i}.com"}
                            }

                            response = await client.post("/api/settings", json=request_data)
                            assert response.status_code == 200

            # Verify final state
            statement = select(Settings).where(Settings.id == 1)
            result = await test_session.execute(statement)
            final_settings = result.scalar_one()

            final_token = decrypt_sensitive_data(final_settings.telegram_bot_token_encrypted)
            assert final_token == tokens[-1]  # Should be the last token
            assert final_settings.telegram_webhook_base_url == "https://rotation-test-19.com"
