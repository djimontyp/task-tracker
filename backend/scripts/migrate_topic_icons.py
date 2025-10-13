#!/usr/bin/env python3
"""Data migration script to populate icon field for existing topics."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import AsyncSessionLocal
from app.models.topic import Topic, auto_select_icon
from sqlalchemy import select


async def migrate_icons() -> None:
    """Migrate existing topics to add auto-selected icons."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Topic))
        topics = result.scalars().all()

        if not topics:
            print("No topics found in database.")
            return

        print(f"Found {len(topics)} topics. Updating icons...")

        for topic in topics:
            if not topic.icon:
                topic.icon = auto_select_icon(topic.name, topic.description)
                print(f"  - {topic.name}: {topic.icon}")

        await session.commit()
        print(f"\nSuccessfully updated {len(topics)} topics.")


async def verify_migration() -> None:
    """Verify that all topics have icons."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Topic))
        topics = result.scalars().all()

        print("\n" + "=" * 60)
        print("VERIFICATION: Current topics and their icons")
        print("=" * 60)

        if not topics:
            print("No topics found.")
            return

        for topic in topics:
            print(f"ID: {topic.id:2d} | Name: {topic.name:20s} | Icon: {topic.icon}")

        topics_without_icons = [t for t in topics if not t.icon]
        if topics_without_icons:
            print(f"\n⚠️  WARNING: {len(topics_without_icons)} topics still missing icons!")
        else:
            print(f"\n✅ All {len(topics)} topics have icons assigned.")


async def main() -> None:
    """Run the migration and verification."""
    print("=" * 60)
    print("Data Migration: Adding icons to existing topics")
    print("=" * 60)

    await migrate_icons()
    await verify_migration()


if __name__ == "__main__":
    asyncio.run(main())
