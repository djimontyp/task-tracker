#!/usr/bin/env python3
"""
Clean ALL data from database (preserving schema).
Usage:
    python scripts/db_clean_all.py
"""

import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker


async def clean_demo_data(session: AsyncSession):
    """Clean only demo data (topics, atoms, messages) - preserving config."""
    print("🗑️  Cleaning demo data (topics, atoms, messages)...")

    # Delete in correct order (respecting foreign keys)
    tables = [
        "topic_atoms",       # M2M links first
        "atom_links",        # Atom relationships
        "atom_versions",     # Atom history
        "message_history",   # Message history
        "messages",          # Messages
        "atoms",             # Atoms
        "topics",            # Topics
    ]

    for table in tables:
        try:
            result = await session.execute(text(f"DELETE FROM {table}"))
            count = result.rowcount
            if count > 0:
                print(f"  ✓ Deleted {count} rows from {table}")
        except Exception as e:
            print(f"  ⚠️  Could not delete from {table}: {e}")

    await session.commit()
    print("✅ Demo data cleaned!")
    print("ℹ️  Preserved: Users, Projects, Providers, Agents, Sources")


async def main():
    """Main entry point."""
    database_url = os.getenv(
        "DATABASE_URL_LOCAL",
        "postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker",
    )

    print(f"🔌 Connecting to database...")
    engine = create_async_engine(database_url, echo=False)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        await clean_demo_data(session)

    await engine.dispose()
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
