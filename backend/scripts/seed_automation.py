"""Seed automation data: scheduler jobs, automation rules, notification preferences."""

import argparse
import asyncio

from app.core.config import settings
from app.models import (
    AutomationRule,
    NotificationPreference,
    ScheduledJob,
)
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

async_engine = create_async_engine(str(settings.SQLALCHEMY_DATABASE_URI), echo=False)
async_session_maker = sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)


async def clear_automation_data(session: AsyncSession):
    """Clear all automation data."""
    print("🗑️  Clearing automation data...")

    await session.execute(delete(ScheduledJob))
    await session.execute(delete(AutomationRule))
    await session.execute(delete(NotificationPreference))

    await session.commit()
    print("✅ Automation data cleared")


async def seed_scheduler_jobs(session: AsyncSession):
    """Seed scheduler jobs."""
    print("📅 Seeding scheduler jobs...")

    jobs = [
        ScheduledJob(
            name="Daily Knowledge Extraction",
            schedule_cron="0 9 * * *",  # Every day at 9 AM UTC
            enabled=True,
            status="idle",
            run_count=0,
            success_count=0,
        ),
        ScheduledJob(
            name="Hourly Auto-Approval Check",
            schedule_cron="0 */1 * * *",  # Every hour
            enabled=True,
            status="idle",
            run_count=0,
            success_count=0,
        ),
        ScheduledJob(
            name="Weekly Performance Report",
            schedule_cron="0 9 * * 1",  # Every Monday at 9 AM UTC
            enabled=False,
            status="idle",
            run_count=0,
            success_count=0,
        ),
    ]

    for job in jobs:
        session.add(job)

    await session.commit()
    print(f"✅ Created {len(jobs)} scheduler jobs")


async def seed_automation_rules(session: AsyncSession):
    """Seed automation rules."""
    print("🎯 Seeding automation rules...")

    import json

    rules = [
        AutomationRule(
            name="High Confidence Auto-Approve",
            description="Automatically approve versions with high confidence and similarity",
            enabled=True,
            priority=90,
            action="approve",
            conditions=json.dumps([
                {"field": "confidence", "operator": "gte", "value": 90},
                {"field": "similarity", "operator": "gte", "value": 85},
            ]),
            logic_operator="AND",
            triggered_count=0,
            success_count=0,
        ),
        AutomationRule(
            name="Low Confidence Reject",
            description="Automatically reject low quality versions",
            enabled=True,
            priority=80,
            action="reject",
            conditions=json.dumps([
                {"field": "confidence", "operator": "lt", "value": 50},
            ]),
            logic_operator="AND",
            triggered_count=0,
            success_count=0,
        ),
        AutomationRule(
            name="Medium Quality Manual Review",
            description="Flag medium quality versions for manual review",
            enabled=True,
            priority=50,
            action="notify",
            conditions=json.dumps([
                {"field": "confidence", "operator": "gte", "value": 60},
                {"field": "confidence", "operator": "lt", "value": 85},
            ]),
            logic_operator="AND",
            triggered_count=0,
            success_count=0,
        ),
        AutomationRule(
            name="Urgent Topic Escalate",
            description="Escalate urgent topics for immediate attention",
            enabled=False,
            priority=95,
            action="escalate",
            conditions=json.dumps([
                {"field": "topic.name", "operator": "contains", "value": "urgent"},
            ]),
            logic_operator="AND",
            triggered_count=0,
            success_count=0,
        ),
    ]

    for rule in rules:
        session.add(rule)

    await session.commit()
    print(f"✅ Created {len(rules)} automation rules")


async def seed_notification_preferences(session: AsyncSession):
    """Seed notification preferences."""
    print("🔔 Seeding notification preferences...")

    # Check if preferences already exist
    result = await session.execute(select(NotificationPreference))
    existing = result.scalars().first()

    if existing:
        print("⏭️  Notification preferences already exist, skipping")
        return

    prefs = NotificationPreference(
        email_enabled=False,  # Disabled by default (no SMTP in dev)
        email_address="admin@tasktracker.local",
        telegram_enabled=True,
        telegram_chat_id="YOUR_CHAT_ID",  # User needs to configure
        pending_threshold=20,
        digest_enabled=False,
        digest_frequency="daily",
        digest_time="09:00",
    )

    session.add(prefs)
    await session.commit()
    print("✅ Created notification preferences")


async def seed_automation(clear: bool = False):
    """Seed all automation data."""
    async with async_session_maker() as session:
        if clear:
            await clear_automation_data(session)

        await seed_scheduler_jobs(session)
        await seed_automation_rules(session)
        await seed_notification_preferences(session)

    print("\n🎉 Automation seeding complete!")
    print("\n📊 Summary:")
    print("  - Scheduler Jobs: 3 (2 enabled, 1 disabled)")
    print("  - Automation Rules: 4 (3 enabled, 1 disabled)")
    print("  - Notification Preferences: 1 (email disabled, Telegram enabled)")
    print("\n🚀 Next steps:")
    print("  1. Start services: just services")
    print("  2. Access dashboard: http://localhost/automation/dashboard")
    print("  3. Configure Telegram chat ID: http://localhost/automation/notifications")


def main():
    parser = argparse.ArgumentParser(description="Seed automation data")
    parser.add_argument("--clear", action="store_true", help="Clear existing automation data")
    args = parser.parse_args()

    asyncio.run(seed_automation(clear=args.clear))


if __name__ == "__main__":
    main()
