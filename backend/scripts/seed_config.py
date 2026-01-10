#!/usr/bin/env python3
"""
Config seed script - минімальні налаштування для роботи системи після nuclear reset.
Usage:
    python scripts/seed_config.py
"""

import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.models import (
    AgentConfig,
    AgentType,
    LLMProvider,
    ProjectConfig,
    Source,
    SourceType,
    Topic,
    User,
)
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Topics базові (7 штук)
CONFIG_TOPICS = [
    {
        "name": "Mobile",
        "description": "iOS and Android development, mobile UI/UX",
        "icon": "smartphone",
        "color": "#3B82F6",
    },
    {
        "name": "Backend",
        "description": "API development, database optimization, server logic",
        "icon": "server",
        "color": "#10B981",
    },
    {
        "name": "Frontend",
        "description": "React components, TypeScript, UI implementation",
        "icon": "layout",
        "color": "#8B5CF6",
    },
    {
        "name": "DevOps",
        "description": "CI/CD, Docker, deployment automation",
        "icon": "cloud",
        "color": "#F59E0B",
    },
    {
        "name": "Design",
        "description": "UX research, design systems, prototypes",
        "icon": "palette",
        "color": "#EC4899",
    },
    {
        "name": "Analytics",
        "description": "Metrics, monitoring, performance analysis",
        "icon": "bar-chart",
        "color": "#06B6D4",
    },
    {
        "name": "Security",
        "description": "Authentication, authorization, data protection",
        "icon": "shield",
        "color": "#EF4444",
    },
]


async def test_connection(engine) -> bool:
    """Test database connection before operations."""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        print("✅ Database connection successful")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


async def seed_config(session: AsyncSession):
    """Seed minimal config data for system operation."""
    print("🌱 Seeding config data...")

    # 1. Users (bot + pm) - check if exist
    print("  Creating users...")
    result = await session.execute(select(User).where(User.email == "bot@pulse-radar.local"))
    bot_user = result.scalar_one_or_none()

    if not bot_user:
        bot_user = User(
            first_name="System",
            last_name="Bot",
            email="bot@pulse-radar.local",
            is_bot=True,
            is_active=True,
        )
        session.add(bot_user)
        await session.flush()
    else:
        print("    ✓ Bot user already exists")

    result = await session.execute(select(User).where(User.email == "pm@pulse-radar.local"))
    pm_user = result.scalar_one_or_none()

    if not pm_user:
        pm_user = User(
            first_name="Project",
            last_name="Manager",
            email="pm@pulse-radar.local",
            is_bot=False,
            is_active=True,
        )
        session.add(pm_user)
        await session.flush()
    else:
        print("    ✓ PM user already exists")

    # 2. Source (Telegram) - check if exists
    print("  Creating Telegram source...")
    result = await session.execute(select(Source).where(Source.name == "Telegram Team Chat"))
    source = result.scalar_one_or_none()

    if not source:
        source = Source(
            name="Telegram Team Chat",
            type=SourceType.telegram,
            config={"chat_id": -1001234567890},
            is_active=True,
        )
        session.add(source)
        await session.flush()
    else:
        print("    ✓ Telegram source already exists")

    # 3. LLMProvider (Ollama) - check if exists
    print("  Creating LLM provider...")
    from app.models import ProviderType, ValidationStatus

    result = await session.execute(select(LLMProvider).where(LLMProvider.name == "Default Ollama"))
    provider = result.scalar_one_or_none()

    if not provider:
        provider = LLMProvider(
            name="Default Ollama",
            type=ProviderType.ollama,
            base_url="http://host.docker.internal:11434/v1",
            is_active=True,
            validation_status=ValidationStatus.pending,
        )
        session.add(provider)
        await session.flush()
    else:
        print("    ✓ LLM provider already exists")

    # 4. AgentConfig (knowledge_extractor) - system agent
    print("  Creating knowledge_extractor system agent...")
    from app.services.knowledge.llm_agents import KNOWLEDGE_EXTRACTION_PROMPT_UK
    from app.db.seed_default_agent import IMPORTANCE_SCORER_SYSTEM_PROMPT

    result = await session.execute(select(AgentConfig).where(AgentConfig.name == "knowledge_extractor"))
    agent = result.scalar_one_or_none()

    if not agent:
        agent = AgentConfig(
            name="knowledge_extractor",
            description="System agent for extracting topics and atoms from messages",
            provider_id=provider.id,
            model_name="llama3.2",
            system_prompt=KNOWLEDGE_EXTRACTION_PROMPT_UK,
            temperature=0.3,
            is_active=True,
            agent_type=AgentType.system,
            is_system_prompt_locked=True,
            is_output_schema_locked=True,
        )
        session.add(agent)
        await session.flush()
    else:
        # Upgrade existing agent to system type if needed
        if agent.agent_type != AgentType.system:
            agent.agent_type = AgentType.system
            agent.is_system_prompt_locked = True
            agent.is_output_schema_locked = True
            print("    ↑ Upgraded knowledge_extractor to system agent")
        else:
            print("    ✓ Agent config (knowledge_extractor) already exists")

    # 4.1 AgentConfig (importance_scorer) - system agent
    print("  Creating importance_scorer system agent...")
    result = await session.execute(select(AgentConfig).where(AgentConfig.name == "importance_scorer"))
    agent_scoring = result.scalar_one_or_none()

    if not agent_scoring:
        agent_scoring = AgentConfig(
            name="importance_scorer",
            description="System agent for scoring message importance and triage",
            provider_id=provider.id,
            model_name="qwen3:14b",  # Recommended default for scoring
            system_prompt=IMPORTANCE_SCORER_SYSTEM_PROMPT,
            temperature=0.0,
            is_active=True,
            agent_type=AgentType.system,
            is_system_prompt_locked=True,
            is_output_schema_locked=True,
        )
        session.add(agent_scoring)
        await session.flush()
    else:
        # Upgrade existing agent to system type if needed
        if agent_scoring.agent_type != AgentType.system:
            agent_scoring.agent_type = AgentType.system
            agent_scoring.is_system_prompt_locked = True
            agent_scoring.is_output_schema_locked = True
            print("    ↑ Upgraded importance_scorer to system agent")
        else:
            print("    ✓ Agent config (importance_scorer) already exists")

    # 5. ProjectConfig - використовуємо FeodalMe (вже є в базі)
    print("  Checking project config...")
    result = await session.execute(select(ProjectConfig).where(ProjectConfig.name == "FeodalMe"))
    project = result.scalar_one_or_none()

    if project:
        print("    ✓ FeodalMe project already exists")
    else:
        print("    ⚠️  FeodalMe project not found! Run 'just db-seed-feudalme' first")
        # Для demo можна створити базовий проєкт
        result = await session.execute(select(ProjectConfig).limit(1))
        project = result.scalar_one_or_none()
        if not project:
            print("    Creating fallback project...")
            project = ProjectConfig(
                name="Demo Project",
                description="Demo project for seed data",
                pm_user_id=pm_user.id,
                is_active=True,
            )
            session.add(project)
            await session.flush()

    # 6. Topics (7 базових) - check if exist
    print(f"  Creating {len(CONFIG_TOPICS)} topics...")
    topics_created = 0
    for topic_data in CONFIG_TOPICS:
        result = await session.execute(select(Topic).where(Topic.name == topic_data["name"]))
        existing_topic = result.scalar_one_or_none()

        if not existing_topic:
            topic = Topic(
                name=topic_data["name"],
                description=topic_data["description"],
                icon=topic_data["icon"],
                color=topic_data["color"],
            )
            session.add(topic)
            topics_created += 1

    if topics_created > 0:
        print(f"    + Created {topics_created} new topics")
    print(f"    ✓ {len(CONFIG_TOPICS) - topics_created} topics already existed")

    await session.commit()
    print(f"✅ Config data verified/seeded successfully!")
    print(f"   ✓ Users, Source, LLM Providers, Agents verified")
    print(f"   ✓ Project config (FeodalMe) verified")
    if topics_created > 0:
        print(f"   + {topics_created} new topics created")
    print(f"   ✓ Total {len(CONFIG_TOPICS)} base topics available")


async def main():
    """Main entry point."""
    database_url = os.getenv(
        "DATABASE_URL",
        os.getenv(
            "DATABASE_URL_LOCAL",
            "postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker",
        )
    )

    print(f"🔌 Connecting to database: {database_url}")
    engine = create_async_engine(database_url, echo=False)

    if not await test_connection(engine):
        return 1

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        await seed_config(session)

    await engine.dispose()
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
