#!/usr/bin/env python3
"""
Database seeding script for Topics, Atoms, Messages and their relationships.
Usage:
    python scripts/seed_topics_atoms.py --clear                              # Clear all data
    python scripts/seed_topics_atoms.py --seed                               # Seed test data
    python scripts/seed_topics_atoms.py --clear --seed                       # Clear and seed
    python scripts/seed_topics_atoms.py --seed --topics 10 --atoms 20       # Custom counts
"""

import argparse
import asyncio
import random
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.models import (
    Atom,
    AtomLink,
    AtomType,
    LinkType,
    Message,
    Source,
    SourceType,
    Topic,
    TopicAtom,
    User,
)
from core.config import settings
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

TOPIC_DATA = [
    {
        "name": "Mobile App Development",
        "description": "iOS and Android app development, UI/UX improvements, and mobile performance optimization",
        "icon": "CodeBracketIcon",
        "color": "#8B5CF6",
    },
    {
        "name": "Backend API",
        "description": "REST API development, WebSocket implementation, database optimization, and server-side logic",
        "icon": "CodeBracketIcon",
        "color": "#8B5CF6",
    },
    {
        "name": "DevOps & Infrastructure",
        "description": "CI/CD pipelines, Docker containerization, deployment automation, and cloud infrastructure",
        "icon": "BriefcaseIcon",
        "color": "#3B82F6",
    },
    {
        "name": "Product Design",
        "description": "User research, design systems, wireframes, prototypes, and UX improvements",
        "icon": "LightBulbIcon",
        "color": "#F59E0B",
    },
    {
        "name": "Team Planning",
        "description": "Sprint planning, roadmap discussions, retrospectives, and team coordination",
        "icon": "CalendarIcon",
        "color": "#F97316",
    },
]

ATOM_TEMPLATES = {
    "problem": [
        (
            "Authentication timeout issues",
            "Users experiencing session timeouts after 5 minutes of inactivity. Need to implement refresh token mechanism.",
        ),
        (
            "Database connection pooling exhausted",
            "Connection pool maxing out during peak hours causing 503 errors. Need to optimize query patterns or increase pool size.",
        ),
        (
            "Mobile app crashes on iOS 17",
            "App crashes when accessing camera permissions on latest iOS version. Suspect issue with permission handling.",
        ),
        (
            "Slow API response times",
            "API endpoints responding in 2-3 seconds during peak load. Database queries need optimization.",
        ),
        (
            "WebSocket disconnects randomly",
            "Real-time connections dropping every 5-10 minutes. Investigate server-side timeout settings.",
        ),
    ],
    "solution": [
        (
            "Implement JWT refresh token flow",
            "Add refresh token endpoint and update client-side token management. Tokens refreshed every 4 minutes.",
        ),
        (
            "Optimize database query patterns",
            "Refactor N+1 queries to use eager loading. Add database indexes on frequently queried columns.",
        ),
        (
            "Update camera permission handling",
            "Use new iOS 17 permission API. Add permission status check before camera access.",
        ),
        (
            "Add Redis caching layer",
            "Cache frequently accessed data in Redis with 5-minute TTL. Reduces database load by 70%.",
        ),
        (
            "Configure connection keep-alive",
            "Set WebSocket ping interval to 30 seconds. Implement automatic reconnection on client side.",
        ),
    ],
    "decision": [
        (
            "Use PostgreSQL over MongoDB",
            "Chose PostgreSQL for stronger consistency guarantees and better support for complex queries. Team has more expertise.",
        ),
        (
            "Adopt FastAPI for backend",
            "Selected FastAPI over Flask for built-in async support, automatic API documentation, and better type safety.",
        ),
        (
            "Implement feature flags system",
            "Add LaunchDarkly for gradual rollout and A/B testing. Allows safe deployment of experimental features.",
        ),
        (
            "Choose React Native for mobile",
            "Selected React Native over native development for faster iteration and code sharing between platforms.",
        ),
        (
            "Use Docker Compose for local dev",
            "Standardize local development environment with Docker Compose. Ensures consistency across team.",
        ),
    ],
    "question": [
        (
            "Should we implement server-side rendering?",
            "Considering SSR for better SEO and initial load performance. Need to evaluate trade-offs with development complexity.",
        ),
        (
            "How to handle file uploads larger than 100MB?",
            "Current implementation times out. Should we implement chunked uploads or use direct S3 upload?",
        ),
        (
            "Which WebSocket library to use?",
            "Comparing Socket.io vs native WebSocket. Need to decide based on browser support and feature requirements.",
        ),
        (
            "Migrate to microservices architecture?",
            "Current monolith becoming hard to maintain. When is the right time to split into services?",
        ),
        (
            "Should we use GraphQL instead of REST?",
            "Frontend team requesting GraphQL for flexible queries. Worth the migration effort?",
        ),
    ],
    "insight": [
        (
            "95% of users never use advanced filters",
            "Analytics show only 5% usage of complex filter options. Could simplify UI and reduce maintenance burden.",
        ),
        (
            "Mobile users prefer dark mode",
            "80% of mobile users switch to dark mode. Should consider making it default on mobile.",
        ),
        (
            "Most errors happen during deploy",
            "Error spike analysis shows 70% of production errors occur within 1 hour of deployment. Need better rollback strategy.",
        ),
        (
            "Users abandon long forms",
            "Form analytics show 60% abandonment rate on forms with more than 5 fields. Need progressive disclosure pattern.",
        ),
        (
            "API errors peak at 9 AM",
            "Traffic patterns show highest error rate at 9 AM. Likely due to overnight batch jobs still running.",
        ),
    ],
    "pattern": [
        (
            "Repository pattern for data access",
            "Implement repository layer to abstract database operations. Makes testing easier and allows swapping data sources.",
        ),
        (
            "Factory pattern for notification service",
            "Use factory to create appropriate notification handler (email, SMS, push) based on user preferences.",
        ),
        (
            "Observer pattern for real-time updates",
            "Implement pub/sub pattern for WebSocket event distribution. Allows multiple subscribers to react to same event.",
        ),
        (
            "Strategy pattern for pricing calculation",
            "Different pricing strategies (subscription, usage-based, tiered) encapsulated as interchangeable strategies.",
        ),
        (
            "Builder pattern for complex queries",
            "Fluent query builder for constructing complex SQL queries programmatically. Improves readability and type safety.",
        ),
    ],
}

MESSAGE_TEMPLATES = [
    "Just noticed {topic} having some issues with {detail}. Anyone else seeing this?",
    "Working on {topic} - {detail}. Should have a fix by end of day.",
    "Question about {topic}: {detail}. What's the best approach here?",
    "FYI: {topic} is now live. {detail}",
    "Need help with {topic}. Specifically {detail}.",
    "Great progress on {topic} today! {detail}",
    "Heads up: {topic} might need attention. {detail}",
    "Completed {topic} work. {detail}",
    "Can someone review {topic}? {detail}",
    "Brainstorming {topic} ideas. {detail}",
]


async def clear_data(session: AsyncSession):
    """Clear all topics, atoms, messages and related data."""
    print("🗑️  Clearing all data...")

    await session.execute(delete(TopicAtom))
    await session.execute(delete(AtomLink))
    await session.execute(delete(Message))
    await session.execute(delete(Atom))
    await session.execute(delete(Topic))

    result = await session.execute(select(User).where(User.is_bot == True))
    bot_users = result.scalars().all()
    if bot_users:
        for bot in bot_users:
            await session.delete(bot)

    result = await session.execute(select(Source).where(Source.name.like("Seed%")))
    seed_sources = result.scalars().all()
    if seed_sources:
        for source in seed_sources:
            await session.delete(source)

    await session.commit()
    print("✅ All data cleared")


async def seed_data(
    session: AsyncSession,
    num_topics: int = 5,
    num_atoms: int = 10,
    num_messages: int = 20,
):
    """Seed test data into database."""
    print(f"🌱 Seeding {num_topics} topics, {num_atoms} atoms per topic, {num_messages} messages per topic...")

    result = await session.execute(select(User).where(User.is_bot == True).limit(1))
    bot_user = result.scalar_one_or_none()

    if not bot_user:
        print("  Creating bot user...")
        bot_user = User(
            first_name="System",
            last_name="Bot",
            email="bot@tasktracker.local",
            is_bot=True,
            is_active=True,
        )
        session.add(bot_user)
        await session.flush()

    result = await session.execute(select(Source).where(Source.name == "Seed Source").limit(1))
    source = result.scalar_one_or_none()

    if not source:
        print("  Creating seed source...")
        source = Source(
            name="Seed Source",
            type=SourceType.api,
            config={},
            is_active=True,
        )
        session.add(source)
        await session.flush()

    topics_to_seed = TOPIC_DATA[:num_topics] if num_topics <= len(TOPIC_DATA) else TOPIC_DATA
    topics = []

    print("  Creating topics...")
    for topic_data in topics_to_seed:
        topic = Topic(**topic_data)
        session.add(topic)
        topics.append(topic)

    await session.flush()
    print(f"  ✓ Created {len(topics)} topics")

    all_atoms = []
    atom_links = []
    topic_atoms = []
    messages = []

    now = datetime.now(UTC)

    for topic_idx, topic in enumerate(topics):
        print(f"  Creating atoms for '{topic.name}'...")

        topic_atoms_list = []

        atom_type_distribution = [
            (AtomType.problem, 0.30),
            (AtomType.solution, 0.20),
            (AtomType.decision, 0.20),
            (AtomType.question, 0.15),
            (AtomType.insight, 0.10),
            (AtomType.pattern, 0.05),
        ]

        for atom_idx in range(num_atoms):
            rand = random.random()
            cumulative = 0.0
            atom_type = AtomType.problem

            for atype, probability in atom_type_distribution:
                cumulative += probability
                if rand <= cumulative:
                    atom_type = atype
                    break

            templates = ATOM_TEMPLATES[atom_type.value]
            title, content = random.choice(templates)

            confidence = random.uniform(0.6, 0.95) if random.random() < 0.8 else None
            user_approved = random.random() < 0.7

            atom = Atom(
                type=atom_type.value,
                title=title,
                content=content,
                confidence=confidence,
                user_approved=user_approved,
                meta={"topic_context": topic.name},
            )
            session.add(atom)
            topic_atoms_list.append(atom)
            all_atoms.append(atom)

        await session.flush()

        for position, atom in enumerate(topic_atoms_list):
            topic_atom = TopicAtom(
                topic_id=topic.id,
                atom_id=atom.id,
                position=position,
                note=f"Generated for {topic.name}",
            )
            session.add(topic_atom)
            topic_atoms.append(topic_atom)

        print(f"    ✓ Created {len(topic_atoms_list)} atoms")

        print(f"  Creating messages for '{topic.name}'...")
        for msg_idx in range(num_messages):
            topic_words = topic.name.lower().split()
            detail = random.choice([
                "the recent changes",
                "performance improvements",
                "the new feature",
                "current implementation",
                "team feedback",
                "latest updates",
                "proposed solution",
                "potential issues",
            ])

            template = random.choice(MESSAGE_TEMPLATES)
            content = template.format(topic=topic.name, detail=detail)

            days_ago = random.randint(0, 30)
            sent_at = now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
            sent_at_naive = sent_at.replace(tzinfo=None)

            message = Message(
                external_message_id=f"seed_{topic_idx}_{msg_idx}_{random.randint(1000, 9999)}",
                content=content,
                sent_at=sent_at_naive,
                source_id=source.id,
                author_id=bot_user.id,
                topic_id=topic.id,
                analyzed=random.random() < 0.6,
                confidence=random.uniform(0.5, 0.95) if random.random() < 0.7 else None,
            )
            session.add(message)
            messages.append(message)

        print(f"    ✓ Created {num_messages} messages")

    await session.flush()

    print("  Creating atom links...")

    problems = [a for a in all_atoms if a.type == AtomType.problem.value]
    solutions = [a for a in all_atoms if a.type == AtomType.solution.value]
    decisions = [a for a in all_atoms if a.type == AtomType.decision.value]
    questions = [a for a in all_atoms if a.type == AtomType.question.value]

    for solution in solutions[: min(len(solutions), len(problems))]:
        if problems:
            problem = random.choice(problems)
            link = AtomLink(
                from_atom_id=solution.id,
                to_atom_id=problem.id,
                link_type=LinkType.solves.value,
                strength=random.uniform(0.7, 1.0),
            )
            session.add(link)
            atom_links.append(link)

    for decision in decisions[: min(len(decisions), len(questions))]:
        if questions:
            question = random.choice(questions)
            link = AtomLink(
                from_atom_id=decision.id,
                to_atom_id=question.id,
                link_type=LinkType.continues.value,
                strength=random.uniform(0.6, 0.9),
            )
            session.add(link)
            atom_links.append(link)

    num_random_links = len(all_atoms) // 5
    for _ in range(num_random_links):
        if len(all_atoms) >= 2:
            from_atom, to_atom = random.sample(all_atoms, 2)

            existing = await session.execute(
                select(AtomLink).where(
                    AtomLink.from_atom_id == from_atom.id,
                    AtomLink.to_atom_id == to_atom.id,
                )
            )
            if existing.scalar_one_or_none():
                continue

            link = AtomLink(
                from_atom_id=from_atom.id,
                to_atom_id=to_atom.id,
                link_type=LinkType.relates_to.value,
                strength=random.uniform(0.4, 0.8),
            )
            session.add(link)
            atom_links.append(link)

    await session.commit()

    print()
    print("✅ Seeding complete!")
    print(f"   📁 Topics: {len(topics)}")
    print(f"   ⚛️  Atoms: {len(all_atoms)}")
    print(f"   💬 Messages: {len(messages)}")
    print(f"   🔗 Atom Links: {len(atom_links)}")
    print(f"   📌 Topic-Atom Relations: {len(topic_atoms)}")


async def main():
    parser = argparse.ArgumentParser(description="Seed topics, atoms, and messages")
    parser.add_argument("--clear", action="store_true", help="Clear all data")
    parser.add_argument("--seed", action="store_true", help="Seed test data")
    parser.add_argument("--topics", type=int, default=5, help="Number of topics (default: 5, max: 5)")
    parser.add_argument("--atoms", type=int, default=10, help="Number of atoms per topic (default: 10)")
    parser.add_argument("--messages", type=int, default=20, help="Number of messages per topic (default: 20)")
    args = parser.parse_args()

    if not args.clear and not args.seed:
        parser.print_help()
        return

    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        if args.clear:
            await clear_data(session)

        if args.seed:
            num_topics = min(args.topics, len(TOPIC_DATA))
            await seed_data(session, num_topics, args.atoms, args.messages)

    await engine.dispose()
    print("🎉 Done!")


if __name__ == "__main__":
    asyncio.run(main())
