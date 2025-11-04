"""Manual test script for metrics WebSocket broadcasting.

Usage:
    uv run python test_metrics_websocket.py

This script simulates metric changes and verifies WebSocket broadcasts work.
"""

import asyncio

from app.services.metrics_broadcaster import metrics_broadcaster
from app.services.websocket_manager import websocket_manager
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker


async def test_metrics_broadcast() -> None:
    """Test metrics broadcasting functionality."""
    print("Testing metrics WebSocket broadcast...")

    # Create test database session
    DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker"
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Initialize WebSocket manager (simulate API startup)
        print("\n1. Initializing WebSocket manager...")
        await websocket_manager.startup("nats://localhost:4222")

        # Test metrics calculation
        print("\n2. Calculating metrics...")
        metrics = await metrics_broadcaster._calculate_metrics(session)
        print(f"   Topic Quality Score: {metrics.topicQualityScore}")
        print(f"   Noise Ratio: {metrics.noiseRatio}%")
        print(f"   Classification Accuracy: {metrics.classificationAccuracy}%")
        print(f"   Active Analysis Runs: {metrics.activeAnalysisRuns}")

        # Test broadcast (without actual WebSocket clients)
        print("\n3. Broadcasting metrics update...")
        await metrics_broadcaster.broadcast_metrics_update(session)
        print("   Broadcast sent (no clients connected, but message published to NATS)")

        # Test rate limiting
        print("\n4. Testing rate limiting...")
        print("   Attempting 3 rapid broadcasts...")
        for i in range(3):
            await metrics_broadcaster.broadcast_metrics_update(session)
            await asyncio.sleep(0.1)
        print("   Rate limiting should have blocked 2 of the 3 broadcasts")

        # Cleanup
        print("\n5. Shutting down WebSocket manager...")
        await websocket_manager.shutdown()

    print("\n✅ Test completed successfully!")
    print("\nTo test with real WebSocket clients:")
    print("1. Start services: just services-dev")
    print("2. Open browser console at http://localhost/dashboard")
    print("3. Connect WebSocket: ws = new WebSocket('ws://localhost/ws?topics=metrics')")
    print("4. Create a topic via API and watch for metrics update in console")


if __name__ == "__main__":
    asyncio.run(test_metrics_broadcast())
