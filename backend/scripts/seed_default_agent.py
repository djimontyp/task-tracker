#!/usr/bin/env python3
"""
Standalone script to seed default knowledge_extractor agent.

This script can be run manually to ensure the default agent exists.
Normally, this is handled automatically by the app startup hook.

Usage:
    python scripts/seed_default_agent.py
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.db.seed_default_agent import seed_default_knowledge_extractor


async def main() -> None:
    """Run the seed script."""
    print("Seeding default knowledge_extractor agent...")

    engine = create_async_engine(
        settings.database.database_url,
        echo=False,
        pool_pre_ping=True,
    )
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        agent = await seed_default_knowledge_extractor(session)
        if agent:
            print(f"Created agent: {agent.name} (id={agent.id})")
        else:
            print("Agent already exists or creation skipped")

    await engine.dispose()
    print("Done!")


if __name__ == "__main__":
    asyncio.run(main())
