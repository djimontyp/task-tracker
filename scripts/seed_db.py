#!/usr/bin/env python3
"""
Database seeding script for test data.
Usage:
    python scripts/seed_db.py --clear          # Clear all data
    python scripts/seed_db.py --seed           # Seed test data
    python scripts/seed_db.py --clear --seed   # Clear and seed
"""

import argparse
import asyncio
import random
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.models.legacy import Task, Source
from app.models.enums import SourceType
from core.config import settings


# Task templates
TASK_TEMPLATES = [
    # Bugs
    {
        "category": "bug",
        "title": "Fix login authentication timeout",
        "description": "Users are experiencing timeout errors when logging in during peak hours. Need to investigate session management and database connection pooling.",
        "priority": "high",
    },
    {
        "category": "bug",
        "title": "WebSocket connection drops randomly",
        "description": "Real-time updates stop working after ~5 minutes. Connection closes with code 1006. Investigate server-side connection handling.",
        "priority": "critical",
    },
    {
        "category": "bug",
        "title": "Dashboard stats showing incorrect counts",
        "description": "Task completion rate displays 0% even when tasks are marked as completed. Check aggregation queries.",
        "priority": "medium",
    },
    {
        "category": "bug",
        "title": "Memory leak in message processing",
        "description": "API container memory usage grows continuously. Suspected issue in WebSocket manager or message handlers.",
        "priority": "critical",
    },
    {
        "category": "bug",
        "title": "Telegram webhook returns 500 errors",
        "description": "Webhook endpoint fails intermittently with internal server error. Check error logs and exception handling.",
        "priority": "high",
    },
    # Features
    {
        "category": "feature",
        "title": "Add task assignment to team members",
        "description": "Implement ability to assign tasks to specific users. Include notification system and assignment history.",
        "priority": "medium",
    },
    {
        "category": "feature",
        "title": "Export tasks to CSV/Excel",
        "description": "Add export functionality for tasks with filters. Support multiple formats and custom column selection.",
        "priority": "low",
    },
    {
        "category": "feature",
        "title": "Dark mode for dashboard",
        "description": "Implement theme switcher with dark/light modes. Persist user preference in localStorage.",
        "priority": "low",
    },
    {
        "category": "feature",
        "title": "Task templates and automation",
        "description": "Create reusable task templates with pre-filled fields. Add automation rules for recurring tasks.",
        "priority": "medium",
    },
    {
        "category": "feature",
        "title": "Advanced search and filtering",
        "description": "Implement full-text search across tasks. Add multi-criteria filters with saved filter presets.",
        "priority": "high",
    },
    # Documentation
    {
        "category": "chore",
        "title": "API documentation for webhook endpoints",
        "description": "Document all webhook endpoints with request/response examples. Include authentication and error handling.",
        "priority": "medium",
    },
    {
        "category": "chore",
        "title": "Setup guide for local development",
        "description": "Create comprehensive guide for setting up development environment. Include Docker, dependencies, and troubleshooting.",
        "priority": "low",
    },
    {
        "category": "chore",
        "title": "Architecture decision records",
        "description": "Document key architectural decisions and rationale. Include WebSocket implementation and database schema choices.",
        "priority": "low",
    },
    {
        "category": "chore",
        "title": "User guide for task management",
        "description": "Write end-user documentation for creating, updating, and tracking tasks. Include screenshots and examples.",
        "priority": "medium",
    },
    # Tasks
    {
        "category": "chore",
        "title": "Update dependencies to latest versions",
        "description": "Review and update all npm and Python dependencies. Test for breaking changes and update lockfiles.",
        "priority": "medium",
    },
    {
        "category": "chore",
        "title": "Database migration for new schema",
        "description": "Create Alembic migration for agent_task_assignments table. Test migration rollback procedure.",
        "priority": "high",
    },
    {
        "category": "chore",
        "title": "Code review for WebSocket implementation",
        "description": "Review recent WebSocket changes for performance and security. Check connection management and error handling.",
        "priority": "medium",
    },
    {
        "category": "chore",
        "title": "Performance testing for API endpoints",
        "description": "Run load tests on critical endpoints. Identify bottlenecks and optimize slow queries.",
        "priority": "high",
    },
    {
        "category": "chore",
        "title": "Security audit of authentication flow",
        "description": "Review authentication and authorization logic. Check for common vulnerabilities and implement fixes.",
        "priority": "critical",
    },
]

CATEGORIES = ["bug", "feature", "improvement", "question", "chore"]
PRIORITIES = ["low", "medium", "high", "critical"]
STATUSES = ["open", "in_progress", "completed", "closed"]


async def clear_data(session: AsyncSession):
    """Clear all tasks from database."""
    print("🗑️  Clearing all tasks...")
    await session.execute(delete(Task))
    await session.commit()
    print("✅ All tasks cleared")


async def seed_data(session: AsyncSession, count: int = 50):
    """Seed test data into database."""
    print(f"🌱 Seeding {count} tasks...")

    # Get or create sources
    result = await session.execute(select(Source))
    sources = list(result.scalars().all())

    if not sources:
        print("  Creating default sources...")
        default_sources = [
            Source(name="Legacy Tasks", type=SourceType.api, is_active=True),
            Source(name="Manual Entry", type=SourceType.api, is_active=True),
        ]
        session.add_all(default_sources)
        await session.flush()
        sources = default_sources
        print(f"    ✓ Created {len(sources)} sources")

    tasks = []
    now = datetime.now(UTC)

    for i in range(count):
        # Use template or generate generic task
        if i < len(TASK_TEMPLATES):
            template = TASK_TEMPLATES[i]
            title = template["title"]
            description = template["description"]
            category = template["category"]
            priority = template["priority"]
        else:
            actions = ["Implement", "Fix", "Update", "Refactor", "Optimize"]
            subjects = ["user interface", "API endpoint", "database query", "error handling", "test coverage"]
            title = f"Task #{i + 1}: {random.choice(actions)} {random.choice(subjects)}"
            description = f"Generated task {i + 1} for testing dashboard features. {random.choice(['High priority item.', 'Needs investigation.', 'Quick fix required.', 'Long-term improvement.'])}"
            category = random.choice(CATEGORIES)
            priority = random.choice(PRIORITIES)
        
        # Random status distribution
        pick = random.random()
        if pick < 0.45:
            status = "open"
        elif pick < 0.65:
            status = "in_progress"
        elif pick < 0.85:
            status = "completed"
        else:
            status = "closed"
        
        # Random created_at in last 30 days
        days_ago = random.randint(0, 30)
        created_at = now - timedelta(days=days_ago, hours=random.randint(0, 23))
        
        task = Task(
            title=title,
            description=description,
            category=category,
            priority=priority,
            status=status,
            source_id=random.choice(sources).id,
            created_at=created_at,
        )
        tasks.append(task)
        
        if (i + 1) % 10 == 0:
            print(f"  Created {i + 1} tasks...")
    
    session.add_all(tasks)
    await session.commit()
    print(f"✅ Successfully seeded {count} tasks")


async def main():
    parser = argparse.ArgumentParser(description="Database seeding script")
    parser.add_argument("--clear", action="store_true", help="Clear all data")
    parser.add_argument("--seed", action="store_true", help="Seed test data")
    parser.add_argument("--count", type=int, default=50, help="Number of tasks to seed (default: 50)")
    args = parser.parse_args()
    
    if not args.clear and not args.seed:
        parser.print_help()
        return
    
    # Create async engine
    engine = create_async_engine(settings.database.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        if args.clear:
            await clear_data(session)
        
        if args.seed:
            await seed_data(session, args.count)
    
    await engine.dispose()
    print("🎉 Done!")


if __name__ == "__main__":
    asyncio.run(main())
