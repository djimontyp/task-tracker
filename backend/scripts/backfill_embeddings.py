#!/usr/bin/env python3
"""
Backfill embeddings for existing Atoms and Messages.

This script processes all entities with NULL embeddings and queues them
for embedding generation via TaskIQ background tasks.

Usage:
    python scripts/backfill_embeddings.py                    # Process all NULL embeddings
    python scripts/backfill_embeddings.py --dry-run          # Show counts without processing
    python scripts/backfill_embeddings.py --batch-size 50    # Custom batch size
"""

import argparse
import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.models import Atom, LLMProvider, Message
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker


async def get_null_embedding_counts(db) -> dict[str, int]:
    """Get counts of entities with NULL embeddings."""
    messages_stmt = select(func.count(Message.id)).where(Message.embedding.is_(None))
    atoms_stmt = select(func.count(Atom.id)).where(Atom.embedding.is_(None))

    messages_result = await db.execute(messages_stmt)
    atoms_result = await db.execute(atoms_stmt)

    return {
        "messages": messages_result.scalar_one(),
        "atoms": atoms_result.scalar_one(),
    }


async def get_null_embedding_ids(db) -> dict[str, list[int]]:
    """Get IDs of entities with NULL embeddings."""
    messages_stmt = select(Message.id).where(Message.embedding.is_(None))
    atoms_stmt = select(Atom.id).where(Atom.embedding.is_(None))

    messages_result = await db.execute(messages_stmt)
    atoms_result = await db.execute(atoms_stmt)

    return {
        "messages": [int(row[0]) for row in messages_result.all()],
        "atoms": [int(row[0]) for row in atoms_result.all()],
    }


async def get_default_provider(db) -> LLMProvider | None:
    """Get the default LLM provider for embeddings."""
    from app.models.llm_provider import ProviderType

    stmt = select(LLMProvider).where(LLMProvider.type == ProviderType.openai).limit(1)
    result = await db.execute(stmt)
    provider = result.scalar_one_or_none()

    if not provider:
        stmt_ollama = select(LLMProvider).where(LLMProvider.type == ProviderType.ollama).limit(1)
        result_ollama = await db.execute(stmt_ollama)
        provider = result_ollama.scalar_one_or_none()

    return provider


async def test_connection(engine) -> bool:
    """Test database connection."""
    try:
        async with engine.begin() as conn:
            await conn.execute(select(1))
        return True
    except Exception as e:
        print(f"Connection error: {e}")
        return False


async def backfill_embeddings(dry_run: bool = False, batch_size: int = 100):
    """Backfill embeddings for entities with NULL values."""
    print("=" * 80)
    print("EMBEDDING BACKFILL SCRIPT")
    print("=" * 80)

    database_url = os.getenv("DATABASE_URL_LOCAL", "postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker")
    print(f"\n📊 Connecting to database: {database_url.replace('postgres:postgres@', 'postgres:***@')}")

    engine = create_async_engine(database_url, echo=False)

    if not await test_connection(engine):
        print("\n❌ Cannot connect to database. Make sure PostgreSQL is running:")
        print("   docker ps | grep postgres")
        print("   Expected: task-tracker-postgres on port 5555")
        await engine.dispose()
        return

    async_session_factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session_factory() as db:
        try:
            counts = await get_null_embedding_counts(db)
            print(f"\nEntities with NULL embeddings:")
            print(f"  Messages: {counts['messages']}")
            print(f"  Atoms:    {counts['atoms']}")
            print(f"  Total:    {counts['messages'] + counts['atoms']}")

            if counts["messages"] == 0 and counts["atoms"] == 0:
                print("\n✅ No entities need embeddings. All done!")
                await engine.dispose()
                return

            if dry_run:
                print("\n🔍 DRY RUN - No processing will occur")
                await engine.dispose()
                return

            provider = await get_default_provider(db)
            if not provider:
                print("\n❌ ERROR: No LLM provider found. Cannot generate embeddings.")
                print("Please create an LLM provider (OpenAI or Ollama) first.")
                await engine.dispose()
                return

            print(f"\n🔧 Using provider: {provider.name} ({provider.type})")
            print(f"📦 Batch size: {batch_size}")

            ids = await get_null_embedding_ids(db)

            from app.services.embedding_service import EmbeddingService

            service = EmbeddingService(provider)

            total_success = 0
            total_failed = 0
            total_skipped = 0

            if ids["atoms"]:
                print(f"\n🚀 Generating embeddings for {len(ids['atoms'])} atoms...")
                stats = await service.embed_atoms_batch(db, ids["atoms"], batch_size=batch_size)
                total_success += stats["success"]
                total_failed += stats["failed"]
                total_skipped += stats["skipped"]
                print(
                    f"✅ Atoms processed: {stats['success']} success, "
                    f"{stats['failed']} failed, {stats['skipped']} skipped"
                )

            if ids["messages"]:
                print(f"\n🚀 Generating embeddings for {len(ids['messages'])} messages...")
                stats = await service.embed_messages_batch(db, ids["messages"], batch_size=batch_size)
                total_success += stats["success"]
                total_failed += stats["failed"]
                total_skipped += stats["skipped"]
                print(
                    f"✅ Messages processed: {stats['success']} success, "
                    f"{stats['failed']} failed, {stats['skipped']} skipped"
                )

            print("\n" + "=" * 80)
            print("✅ BACKFILL COMPLETE")
            print("=" * 80)
            print(f"\n📊 Final Statistics:")
            print(f"   Total Success: {total_success}")
            print(f"   Total Failed:  {total_failed}")
            print(f"   Total Skipped: {total_skipped}")
            print("\nVerify completion by checking NULL counts:")
            print("  SELECT COUNT(*) FROM messages WHERE embedding IS NULL;")
            print("  SELECT COUNT(*) FROM atoms WHERE embedding IS NULL;")

        except Exception as e:
            print(f"\n❌ ERROR: {e!r}")
            raise

        finally:
            await db.close()
            await engine.dispose()


def main():
    parser = argparse.ArgumentParser(description="Backfill embeddings for NULL entities")
    parser.add_argument("--dry-run", action="store_true", help="Show counts without processing")
    parser.add_argument(
        "--batch-size",
        type=int,
        default=100,
        help="Batch size for embedding generation (default: 100)",
    )

    args = parser.parse_args()

    asyncio.run(backfill_embeddings(dry_run=args.dry_run, batch_size=args.batch_size))


if __name__ == "__main__":
    main()
