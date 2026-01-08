
import asyncio
import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.tasks.scoring import score_unscored_messages_task
from app.database import get_db_session_context
from app.models import Message
from sqlalchemy import select, func

async def main():
    print("🚀 Starting manual scoring trigger...")
    
    # Check count before
    db_context = get_db_session_context()
    db = await anext(db_context)
    
    count_stmt = select(func.count(Message.id)).where(Message.importance_score.is_(None))
    result = await db.execute(count_stmt)
    unscored_count = result.scalar()
    print(f"📊 Found {unscored_count} unscored messages.")
    
    if unscored_count == 0:
        print("✅ Nothing to score.")
        return

    from app.tasks.scoring import score_unscored_messages_task
    from core.taskiq_config import nats_broker
    
    # Start broker
    await nats_broker.startup()
    
    try:
        if len(sys.argv) > 1 and sys.argv[1] == "--status":
             # Just checking status logic if needed, but for now just trigger
             pass

        print("⚡ Triggering score_unscored_messages_task (limit=1000)...")
        task = await score_unscored_messages_task.kiq(limit=1000)
        
        print(f"⏳ Task queued. Waiting for result (Task ID: {task.task_id})...")
        result = await task.wait_result()
        
        print(f"✅ Result: {result.return_value}")

    finally:
        await nats_broker.shutdown()

if __name__ == "__main__":
    asyncio.run(main())
