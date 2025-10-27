"""
Tests for critical data loss bug fix in webhook configuration.

Bug: When user updates Telegram webhook URL, ALL monitored groups are deleted from database.
Root Cause: Frontend doesn't pass 'groups' parameter when updating webhook.
            Backend defaults to None -> becomes [] -> overwrites existing groups.

Fix: Preserve existing groups when groups parameter is None.
"""

import pytest
from app.webhook_service import WebhookSettingsService
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_update_webhook_preserves_groups(db_session: AsyncSession):
    """
    CRITICAL TEST: Verify groups are preserved when updating webhook URL.

    Scenario:
    1. User configures webhook with 2 groups
    2. User updates webhook URL (without passing groups parameter)
    3. Groups should still exist after update

    Expected: Groups persist ✅
    Before fix: Groups deleted ❌
    """
    service = WebhookSettingsService()

    initial_groups = [
        {"id": -1002988379206, "name": "Test Group 1"},
        {"id": -1001234567890, "name": "Test Group 2"},
    ]

    config = await service.save_telegram_config(
        db=db_session,
        protocol="https",
        host="initial.example.com",
        is_active=False,
        groups=initial_groups,
    )

    assert config is not None
    assert len(config.groups) == 2
    assert config.groups[0].id == -1002988379206
    assert config.groups[1].id == -1001234567890

    updated_config = await service.save_telegram_config(
        db=db_session,
        protocol="https",
        host="updated.example.com",
        is_active=False,
        groups=None,
    )

    assert updated_config is not None
    assert len(updated_config.groups) == 2, "CRITICAL: Groups were deleted during webhook update!"
    assert updated_config.groups[0].id == -1002988379206
    assert updated_config.groups[0].name == "Test Group 1"
    assert updated_config.groups[1].id == -1001234567890
    assert updated_config.groups[1].name == "Test Group 2"


@pytest.mark.asyncio
async def test_update_webhook_with_explicit_empty_groups(db_session: AsyncSession):
    """
    Test that explicitly passing empty groups list actually clears groups.

    This ensures we can still clear groups when intentionally desired.
    """
    service = WebhookSettingsService()

    initial_groups = [
        {"id": -1002988379206, "name": "Test Group 1"},
    ]

    await service.save_telegram_config(
        db=db_session,
        protocol="https",
        host="example.com",
        is_active=False,
        groups=initial_groups,
    )

    updated_config = await service.save_telegram_config(
        db=db_session,
        protocol="https",
        host="example.com",
        is_active=False,
        groups=[],
    )

    assert updated_config is not None
    assert len(updated_config.groups) == 0, "Explicitly passing [] should clear groups"


@pytest.mark.asyncio
async def test_update_webhook_with_new_groups(db_session: AsyncSession):
    """
    Test that passing new groups list replaces old groups.
    """
    service = WebhookSettingsService()

    initial_groups = [
        {"id": -1002988379206, "name": "Old Group"},
    ]

    await service.save_telegram_config(
        db=db_session,
        protocol="https",
        host="example.com",
        is_active=False,
        groups=initial_groups,
    )

    new_groups = [
        {"id": -1001234567890, "name": "New Group 1"},
        {"id": -1009876543210, "name": "New Group 2"},
    ]

    updated_config = await service.save_telegram_config(
        db=db_session,
        protocol="https",
        host="example.com",
        is_active=False,
        groups=new_groups,
    )

    assert updated_config is not None
    assert len(updated_config.groups) == 2
    assert updated_config.groups[0].id == -1001234567890
    assert updated_config.groups[1].id == -1009876543210


@pytest.mark.asyncio
async def test_set_webhook_active_preserves_groups(db_session: AsyncSession):
    """
    Test that activating/deactivating webhook preserves groups.
    """
    service = WebhookSettingsService()

    initial_groups = [
        {"id": -1002988379206, "name": "Test Group"},
    ]

    await service.save_telegram_config(
        db=db_session,
        protocol="https",
        host="example.com",
        is_active=False,
        groups=initial_groups,
    )

    activated_config = await service.set_telegram_webhook_active(db_session, True)

    assert activated_config is not None
    assert activated_config.is_active is True
    assert len(activated_config.groups) == 1
    assert activated_config.groups[0].id == -1002988379206

    deactivated_config = await service.set_telegram_webhook_active(db_session, False)

    assert deactivated_config is not None
    assert deactivated_config.is_active is False
    assert len(deactivated_config.groups) == 1
    assert deactivated_config.groups[0].id == -1002988379206


@pytest.mark.asyncio
async def test_first_time_webhook_setup_with_no_groups(db_session: AsyncSession):
    """
    Test first-time webhook setup when no config exists yet.
    Should create new config with empty groups.
    """
    service = WebhookSettingsService()

    config = await service.save_telegram_config(
        db=db_session,
        protocol="https",
        host="example.com",
        is_active=False,
        groups=None,
    )

    assert config is not None
    assert len(config.groups) == 0
    assert config.host == "example.com"
    assert config.protocol == "https"


@pytest.mark.asyncio
async def test_multiple_webhook_updates_preserve_groups(db_session: AsyncSession):
    """
    Stress test: Multiple webhook updates should consistently preserve groups.
    """
    service = WebhookSettingsService()

    initial_groups = [
        {"id": -1002988379206, "name": "Persistent Group"},
    ]

    await service.save_telegram_config(
        db=db_session,
        protocol="https",
        host="host1.example.com",
        is_active=False,
        groups=initial_groups,
    )

    for i in range(2, 6):
        config = await service.save_telegram_config(
            db=db_session,
            protocol="https",
            host=f"host{i}.example.com",
            is_active=False,
            groups=None,
        )

        assert config is not None
        assert len(config.groups) == 1, f"Groups lost on update #{i}"
        assert config.groups[0].id == -1002988379206
        assert config.host == f"host{i}.example.com"
