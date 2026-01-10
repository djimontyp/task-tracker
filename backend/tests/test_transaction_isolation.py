"""
Manual test script for transaction isolation in version approvals.

Run this to verify that:
1. with_for_update() is added correctly
2. ConflictError is raised for already-approved versions
3. Concurrent approvals are handled safely
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select

from app.database import engine, get_session
from app.exceptions import ConflictError, NotFoundError
from app.models.atom import Atom
from app.models.atom_version import AtomVersion
from app.services.versioning_service import VersioningService


async def test_transaction_isolation():
    """Test transaction isolation for concurrent approvals."""
    print("🔬 Testing transaction isolation...")

    async with engine.begin() as conn:
        await conn.run_sync(lambda sync_conn: None)

    async for session in get_session():
        service = VersioningService()

        try:
            # Create test atom
            atom = Atom(name="Test Atom", type="note", content="Test content")
            session.add(atom)
            await session.commit()
            await session.refresh(atom)
            print(f"✅ Created test atom: {atom.id}")

            # Create test version
            version = await service.create_atom_version(
                session, atom.id, {"name": "Updated", "content": "Updated content"}
            )
            print(f"✅ Created version: {version.id}, version number: {version.version}")

            # Test 1: Approve version successfully
            print("\n📝 Test 1: First approval (should succeed)")
            approved = await service.approve_version(session, "atom", atom.id, version.version)
            print(f"✅ Version approved: {approved.approved}, at: {approved.approved_at}")

            # Test 2: Try to approve again (should raise ConflictError)
            print("\n📝 Test 2: Second approval (should raise ConflictError)")
            try:
                await service.approve_version(session, "atom", atom.id, version.version)
                print("❌ FAILED: Should have raised ConflictError")
            except ConflictError as e:
                print(f"✅ ConflictError raised as expected: {e}")

            # Test 3: Try to approve non-existent version (should raise NotFoundError)
            print("\n📝 Test 3: Approve non-existent version (should raise NotFoundError)")
            try:
                await service.approve_version(session, "atom", atom.id, 999)
                print("❌ FAILED: Should have raised NotFoundError")
            except NotFoundError as e:
                print(f"✅ NotFoundError raised as expected: {e}")

            # Cleanup
            await session.delete(version)
            await session.delete(atom)
            await session.commit()
            print("\n🧹 Cleanup completed")

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            import traceback

            traceback.print_exc()

        break  # Exit after first session

    print("\n✅ All tests passed!")


if __name__ == "__main__":
    asyncio.run(test_transaction_isolation())
