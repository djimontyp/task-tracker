#!/usr/bin/env python3
"""Verification script to check topic icons are properly set."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import AsyncSessionLocal
from app.models.topic import Topic, auto_select_icon
from sqlalchemy import select


async def verify_icons() -> None:
    """Verify all topics have appropriate icons."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Topic))
        topics = result.scalars().all()

        print("=" * 70)
        print("Topic Icon Verification Report")
        print("=" * 70)

        if not topics:
            print("\n⚠️  No topics found in database.")
            return

        print(f"\nTotal Topics: {len(topics)}")
        print("-" * 70)

        missing_icons = []
        correct_icons = []

        for topic in topics:
            expected_icon = auto_select_icon(topic.name, topic.description)
            status = "✅" if topic.icon else "❌"
            match = "✓" if topic.icon == expected_icon else "✗"

            print(
                f"{status} ID: {topic.id:2d} | {topic.name:20s} | Current: {topic.icon or 'None':20s} | Expected: {expected_icon:20s} [{match}]"
            )

            if not topic.icon:
                missing_icons.append(topic.name)
            elif topic.icon == expected_icon:
                correct_icons.append(topic.name)

        print("-" * 70)
        print(f"\n📊 Summary:")
        print(f"  - Topics with icons: {len(topics) - len(missing_icons)}/{len(topics)}")
        print(f"  - Icons matching auto-selection: {len(correct_icons)}/{len(topics) - len(missing_icons)}")

        if missing_icons:
            print(f"\n⚠️  Topics missing icons: {', '.join(missing_icons)}")
        else:
            print("\n✅ All topics have icons assigned!")


if __name__ == "__main__":
    asyncio.run(verify_icons())
