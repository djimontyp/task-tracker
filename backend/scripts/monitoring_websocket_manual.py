"""Test script to trigger background tasks and monitor WebSocket events."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from core.taskiq_config import nats_broker


@nats_broker.task
async def test_task_success() -> str:
    """Test task that succeeds."""
    await asyncio.sleep(2)
    return "Success!"


@nats_broker.task
async def test_task_failure() -> None:
    """Test task that fails."""
    await asyncio.sleep(1)
    raise ValueError("Intentional test failure")


@nats_broker.task
async def test_task_long_running() -> str:
    """Test long-running task."""
    await asyncio.sleep(5)
    return "Long task completed"


async def main() -> None:
    """Run test tasks to generate monitoring events."""
    print("🚀 Starting test tasks...")
    print("📊 Open MonitoringPage at http://localhost/dashboard/monitoring")
    print()

    # Test success
    print("✅ Queuing test_task_success...")
    await test_task_success.kiq()
    await asyncio.sleep(0.5)

    # Test failure
    print("❌ Queuing test_task_failure...")
    await test_task_failure.kiq()
    await asyncio.sleep(0.5)

    # Test long running
    print("⏳ Queuing test_task_long_running...")
    await test_task_long_running.kiq()
    await asyncio.sleep(0.5)

    # Multiple tasks
    print("📦 Queuing batch of tasks...")
    for i in range(5):
        await test_task_success.kiq()
        await asyncio.sleep(0.2)

    print()
    print("✅ All test tasks queued!")
    print("Check the MonitoringPage for real-time events")
    print("Tasks will complete in the next 10 seconds")


if __name__ == "__main__":
    asyncio.run(main())
