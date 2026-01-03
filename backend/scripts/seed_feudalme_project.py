#!/usr/bin/env python3
"""
Seed FeodalMe project into Pulse Radar database.

Creates ProjectConfig with FeodalMe domain knowledge, keywords, glossary.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.models.project_config import ProjectConfig
from app.models.user import User


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


async def seed_feudalme_project(session: AsyncSession):
    """Seed FeodalMe project configuration"""
    # Check if project exists
    result = await session.execute(
        select(ProjectConfig).where(ProjectConfig.name == "FeodalMe")
    )
    existing = result.scalars().first()

    if existing:
        print("⚠️  FeodalMe project already exists. Skipping.")
        return

    # Get first user as PM (fallback)
    result = await session.execute(select(User).limit(1))
    pm_user = result.scalars().first()

    if not pm_user:
        print("❌ No users found. Create a user first!")
        return

    # FeodalMe project configuration
    feudalme_config = ProjectConfig(
        name="FeodalMe",
        description="Land assets management platform for Ukraine — connecting landowners, rent companies, investors, and agencies",
        keywords=[
            "feudalme", "земельні ділянки", "land plots", "кадастр", "cadastral",
            "орендарі", "rent companies", "агрокомпанії",
            "інвестиції в землю", "land investments",
            "рейтинг орендарів", "tenant rating",
            "ІПН", "ЄДРПОУ", "НАІС", "Держгеокадастр", "IMSMA",
            "мінні забруднення", "Diia", "Дія",
        ],
        glossary={
            "Кадастровий номер": "Унікальний ID ділянки (формат: XXXXXXXXXXXX:XX:XXX:XXXX)",
            "ОНМ": "Об'єктний номер моніторингу в НАІС",
            "НГО": "Нормативна грошова оцінка — база для податків",
            "МПЗ": "Мінімальне податкове зобов'язання для с/г земель",
            "ІПН": "Ідентифікаційний податковий номер (10 цифр)",
            "ЄДРПОУ": "Код юридичної особи (8 цифр)",
            "Право власності": "Повне володіння, користування, розпорядження",
            "Оренда": "Платне користування на визначений строк",
            "Землевласник": "Фізична особа, яка володіє земельними ділянками",
            "Орендар": "Агрокомпанія, що орендує землю",
            "ROI": "Return on Investment для земельних інвестицій",
            "НАІС": "Національна автоматизована інформаційна система",
            "IMSMA": "Information Management System for Mine Action",
            "Diia": "Державна система цифрової ідентифікації",
        },
        components=[
            {"name": "Land Plots Management", "keywords": ["ділянка", "кадастр", "площа", "полігон"]},
            {"name": "Tenant Rating System", "keywords": ["відгук", "рейтинг", "оцінка", "модерація"]},
            {"name": "Investment Tracking", "keywords": ["інвестиція", "ROI", "WAROI", "портфель"]},
            {"name": "Trade Marketplace", "keywords": ["продаж", "лот", "купівля", "торгівля"]},
            {"name": "User Registration", "keywords": ["реєстрація", "верифікація", "Diia", "SMS"]},
            {"name": "Data Synchronization", "keywords": ["синхронізація", "FAMI", "LOOF", "Monitor"]},
            {"name": "IMSMA Integration", "keywords": ["мінні забруднення", "IMSMA", "PostGIS"]},
            {"name": "Agency Access Control", "keywords": ["агенція", "доступ", "дозвіл"]},
        ],
        default_assignee_ids=[pm_user.id],
        pm_user_id=pm_user.id,
        is_active=True,
        priority_rules={
            "critical_keywords": ["втрата даних", "security", "мінні забруднення помилка"],
            "high_keywords": ["баг", "помилка", "не працює"],
        },
        version="0.1.0",
        language="uk",
    )

    session.add(feudalme_config)
    await session.commit()
    await session.refresh(feudalme_config)

    print("✅ FeodalMe project created!")
    print(f"   ID: {feudalme_config.id}")
    print(f"   Keywords: {len(feudalme_config.keywords)}")
    print(f"   Glossary terms: {len(feudalme_config.glossary)}")
    print(f"   Components: {len(feudalme_config.components)}")


async def delete_feudalme_project(session: AsyncSession):
    """Delete FeodalMe project (for cleanup)"""
    result = await session.execute(
        select(ProjectConfig).where(ProjectConfig.name == "FeodalMe")
    )
    project = result.scalars().first()

    if not project:
        print("⚠️  FeodalMe project not found.")
        return

    await session.delete(project)
    await session.commit()

    print("🗑️  FeodalMe project deleted!")


async def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="Seed FeodalMe project")
    parser.add_argument("--delete", action="store_true", help="Delete FeodalMe project")
    args = parser.parse_args()

    database_url = os.getenv("DATABASE_URL_LOCAL", "postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker")
    print(f"📊 Connecting to database: {database_url.replace('postgres:postgres@', 'postgres:***@')}")

    engine = create_async_engine(database_url, echo=False)

    if not await test_connection(engine):
        print("\n❌ Cannot connect to database. Make sure PostgreSQL is running.")
        await engine.dispose()
        return

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        if args.delete:
            await delete_feudalme_project(session)
        else:
            await seed_feudalme_project(session)

    await engine.dispose()
    print("🎉 Done!")


if __name__ == "__main__":
    asyncio.run(main())
