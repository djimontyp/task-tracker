#!/usr/bin/env python3
"""
Demo seed script - реалістичні українські дані з анонімізацією.
Usage:
    python scripts/seed_demo_uk.py
"""

import asyncio
import json
import os
import random
import re
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.models import (
    Atom,
    AtomType,
    Message,
    Source,
    Topic,
    TopicAtom,
    User,
)
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Анонімізація імен
NAME_MAPPING = {
    "Olga Zaritska": "QA-1",
    "Olha": "QA-2",
    "elya": "Designer-1",
    "Софія Пецюх": "Designer-2",
    "Mykhailo Mykytiuk": "Dev-1",
    "Максим Науменко 👨🏻‍💻": "Dev-2",
    "Анатолій": "Dev-3",
    "Valeriya Shvets": "PM-1",
    "Микита": "Dev-4",
}

# Анонімізація URL
def anonymize_url(text: str) -> str:
    """Anonymize URLs in text."""
    text = re.sub(r"https://feodal\.atlassian\.net/browse/([A-Z]+-\d+)", r"https://tracker.example.com/\1", text)
    text = re.sub(r"https://www\.figma\.com/[^\s]+", "https://design.example.com/...", text)
    return text


def anonymize_message(text: str) -> str:
    """Anonymize names and URLs in message."""
    for original, replacement in NAME_MAPPING.items():
        text = text.replace(original, replacement)

    # Anonymize @mentions
    for original, replacement in NAME_MAPPING.items():
        text = text.replace(f"@{original.split()[0]}", f"@{replacement}")

    # Anonymize specific mentions
    text = re.sub(r"@OlyaBusol", "@QA-2", text)
    text = re.sub(r"@mishik182", "@Dev-1", text)
    text = re.sub(r"@sofipet", "@Designer-2", text)
    text = re.sub(r"@olgazaritska", "@QA-1", text)
    text = re.sub(r"@Maks_Naumenko", "@Dev-2", text)
    text = re.sub(r"@senechyn_a", "@Dev-3", text)
    text = re.sub(r"@elliefei", "@Designer-1", text)

    # Anonymize URLs
    text = anonymize_url(text)

    # Anonymize IPN and cadastral numbers
    text = re.sub(r"\d{10}", "1234567890", text)  # IPN-like numbers
    text = re.sub(r"\d{10}:\d{2}:\d{3}:\d{4}", "6100000000:01:001:0001", text)  # Cadastral

    # Anonymize project names
    text = text.replace("моЄ", "LandApp")
    text = text.replace("MOYE", "LAND")
    text = text.replace("Феодал", "Platform")

    return text


# Demo Topics (на базі реальних обговорень)
DEMO_TOPICS = [
    {
        "name": "Модерація контенту",
        "description": "AI фільтрація відгуків, блокування образливого контенту",
        "icon": "shield-check",
        "color": "#EF4444",
    },
    {
        "name": "Чат та повідомлення",
        "description": "Система чатів, блокування користувачів, архівація",
        "icon": "message-circle",
        "color": "#3B82F6",
    },
    {
        "name": "Управління даними",
        "description": "Зміна власника, управління ділянками, синхронізація",
        "icon": "database",
        "color": "#10B981",
    },
    {
        "name": "UI/UX дизайн",
        "description": "Компоненти інтерфейсу, дизайн-система, Figma",
        "icon": "palette",
        "color": "#EC4899",
    },
    {
        "name": "QA та тестування",
        "description": "Тестування функціональності, баги, dev/staging",
        "icon": "bug",
        "color": "#F59E0B",
    },
    {
        "name": "Backend API",
        "description": "Endpoints, бізнес-логіка, інтеграції",
        "icon": "server",
        "color": "#8B5CF6",
    },
    {
        "name": "Продуктові рішення",
        "description": "Фічі, бізнес-вімоги, UX flows",
        "icon": "lightbulb",
        "color": "#06B6D4",
    },
    # Additional topics for comprehensive coverage
    {
        "name": "Analytics",
        "description": "Метрики, дашборди, звіти та аналітика даних",
        "icon": "chart-bar",
        "color": "#A855F7",
    },
    {
        "name": "Backend",
        "description": "Серверна логіка, оптимізація, кешування",
        "icon": "cpu",
        "color": "#14B8A6",
    },
    {
        "name": "Design",
        "description": "UI компоненти, візуальна мова, accessibility",
        "icon": "brush",
        "color": "#F472B6",
    },
    {
        "name": "DevOps",
        "description": "CI/CD, деплойменти, моніторинг інфраструктури",
        "icon": "git-branch",
        "color": "#F97316",
    },
    {
        "name": "Frontend",
        "description": "React компоненти, state management, UX",
        "icon": "layout",
        "color": "#3B82F6",
    },
    {
        "name": "Mobile",
        "description": "iOS/Android додатки, нативні функції",
        "icon": "smartphone",
        "color": "#22C55E",
    },
    {
        "name": "Security",
        "description": "Безпека, аутентифікація, шифрування",
        "icon": "shield",
        "color": "#DC2626",
    },
]

# Demo Atoms (витягнуті з реальних обговорень)
DEMO_ATOMS = [
    # DECISION (5)
    {
        "title": "AI фільтр блокує пряму вульгарщину та погрози",
        "summary": "Модель блокує прямі образи, матюки та погрози. Завуальовані формулювання проходять фільтр.",
        "type": AtomType.decision,
        "topic": "Модерація контенту",
    },
    {
        "title": "Архівований відгук не впливає на загальну оцінку",
        "summary": "Відгук переходить в архів при зміні власника. На нього не можна ставити реакції, він не впливає на рейтинг.",
        "type": AtomType.decision,
        "topic": "Модерація контенту",
    },
    {
        "title": "Заблокований чат переноситься в кінець списку",
        "summary": "При блокуванні чат стає read-only і автоматично переміщується вниз списку чатів.",
        "type": AtomType.decision,
        "topic": "Чат та повідомлення",
    },
    {
        "title": "Відгук з подякою блокується як офтопік",
        "summary": "Відгук без змістовної інформації про орендаря, лише з подякою, блокується AI фільтром.",
        "type": AtomType.decision,
        "topic": "Модерація контенту",
    },
    {
        "title": "Архівовані відгуки відображаються в обох апках",
        "summary": "Архів доступний і в мобільному додатку, і в CRM для повноти історії та пошуку.",
        "type": AtomType.decision,
        "topic": "Продуктові рішення",
    },

    # INSIGHT (5)
    {
        "title": "Завуальовані погрози проходять AI фільтр",
        "summary": "Модель не розпізнає непрямі загрози. Приклад: 'сподіваюсь з вами нічого не трапиться' проходить.",
        "type": AtomType.insight,
        "topic": "Модерація контенту",
    },
    {
        "title": "Фільтр блокує контент не про оренду",
        "summary": "AI перевіряє релевантність відгуку темі оренди землі. Офтопік автоматично відхиляється.",
        "type": AtomType.insight,
        "topic": "Модерація контенту",
    },
    {
        "title": "Критика орендаря пропускається фільтром",
        "summary": "Негативні відгуки з конструктивною критикою проходять модерацію без проблем.",
        "type": AtomType.insight,
        "topic": "Модерація контенту",
    },
    {
        "title": "Зміна власника не блокує старі коменти автоматично",
        "summary": "Коментар старого власника залишається активним навіть після передачі ділянки іншому користувачу.",
        "type": AtomType.insight,
        "topic": "Управління даними",
    },
    {
        "title": "AI може бути занадто строгим до подяк",
        "summary": "Фільтр іноді блокує навіть нормальні відповіді з подякою, потрібне налаштування.",
        "type": AtomType.insight,
        "topic": "Модерація контенту",
    },

    # PROBLEM (5)
    {
        "title": "Елементи в чаті не відцентровані",
        "summary": "Елементи в списку чатів не відцентровані по вертикалі. Потрібно поправити CSS.",
        "type": AtomType.problem,
        "topic": "UI/UX дизайн",
    },
    {
        "title": "Відсутня помітка про зміну власника",
        "summary": "Коли власник ділянки змінюється, це не відображається в інтерфейсі CRM.",
        "type": AtomType.problem,
        "topic": "Управління даними",
    },
    {
        "title": "Довгі повідомлення розтягують список",
        "summary": "В списку чатів повідомлення не обрізаються, розтягують UI.",
        "type": AtomType.problem,
        "topic": "UI/UX дизайн",
    },
    {
        "title": "Немає відступу між іменем та текстом",
        "summary": "Погана читабельність через відсутність spacing між елементами чату.",
        "type": AtomType.problem,
        "topic": "UI/UX дизайн",
    },
    {
        "title": "AI фільтр занадто строгий до подяк",
        "summary": "Подяка від орендаря блокується як офтопік, хоча це легітимна відповідь.",
        "type": AtomType.problem,
        "topic": "Модерація контенту",
    },

    # QUESTION (5)
    {
        "title": "Що робити з коментарем старого власника після передачі?",
        "summary": "Коментар залишається, але кнопка 'Чат' веде до нового власника. Чи треба щось міняти?",
        "type": AtomType.question,
        "topic": "Управління даними",
    },
    {
        "title": "Чи відображати архівні відгуки в CRM?",
        "summary": "Архів видно в мобілці. Чи потрібен він працівникам CRM для історії?",
        "type": AtomType.question,
        "topic": "Продуктові рішення",
    },
    {
        "title": "Як обробляти кнопку перейти в CRM для старого власника?",
        "summary": "Кадастровий номер вказаний, але ділянка вже не належить користувачу. Disable кнопку?",
        "type": AtomType.question,
        "topic": "Управління даними",
    },
    {
        "title": "Чи може покупець пропонувати ціну кілька разів?",
        "summary": "Функціонал договірної ціни: чи є обмеження на кількість пропозицій від одного покупця?",
        "type": AtomType.question,
        "topic": "Продуктові рішення",
    },
    {
        "title": "Чи треба відміняти іконку зміни власника?",
        "summary": "Якщо архівація вже позначає неактивність, можливо іконка зайва?",
        "type": AtomType.question,
        "topic": "UI/UX дизайн",
    },

    # IDEA (5)
    {
        "title": "Автоматична архівація чатів при блокуванні",
        "summary": "Заблокований чат можна одразу архівувати, щоб не засмічував активний список.",
        "type": AtomType.idea,
        "topic": "Чат та повідомлення",
    },
    {
        "title": "Тонке налаштування AI фільтра через граничні кейси",
        "summary": "Зібрати edge cases і підналаштувати модель для кращої точності без false positives.",
        "type": AtomType.idea,
        "topic": "Модерація контенту",
    },
    {
        "title": "Зірочка біля кадастрового номера при зміні власника",
        "summary": "Модальне вікно з інфо 'У цієї ділянки змінився власник' при кліку на зірочку.",
        "type": AtomType.idea,
        "topic": "UI/UX дизайн",
    },
    {
        "title": "Пошук по автору відповіді на відгук",
        "summary": "Дозволити працівникам CRM шукати відповіді конкретного орендодавця.",
        "type": AtomType.idea,
        "topic": "Продуктові рішення",
    },
    {
        "title": "Статус 'Кабінет користувача видалено' для чатів",
        "summary": "Окремий block_reason коли юзер видаляє свій кабінет, щоб працівник розумів контекст.",
        "type": AtomType.idea,
        "topic": "Чат та повідомлення",
    },

    # --- Additional atoms for empty topics ---

    # ANALYTICS (3)
    {
        "title": "Метрики активності користувачів по регіонах",
        "summary": "Dashboard показує розподіл активності власників землі та орендарів по областях України.",
        "type": AtomType.insight,
        "topic": "Analytics",
    },
    {
        "title": "Конверсія реєстрації через соцмережі низька",
        "summary": "Тільки 12% користувачів завершують реєстрацію через Facebook. Google показує 34%.",
        "type": AtomType.problem,
        "topic": "Analytics",
    },
    {
        "title": "Як рахувати активність: логін чи дії?",
        "summary": "Чи вважати користувача активним при логіні без дій, чи тільки при створенні контенту?",
        "type": AtomType.question,
        "topic": "Analytics",
    },

    # BACKEND (4)
    {
        "title": "API rate limiting через Redis",
        "summary": "Реалізовано обмеження 100 requests/min на користувача через Redis Sliding Window.",
        "type": AtomType.decision,
        "topic": "Backend",
    },
    {
        "title": "N+1 queries в ендпоінті списку ділянок",
        "summary": "Кожна ділянка робить окремий запит за власником. Потрібно eager loading.",
        "type": AtomType.problem,
        "topic": "Backend",
    },
    {
        "title": "Кешувати геокодінг адрес",
        "summary": "Google Maps API коштує дорого. Кешувати результати геокодінгу в Redis на 30 днів.",
        "type": AtomType.idea,
        "topic": "Backend",
    },
    {
        "title": "Pagination limit: 50 чи 100?",
        "summary": "Яку максимальну кількість записів віддавати на сторінці для списків ділянок?",
        "type": AtomType.question,
        "topic": "Backend",
    },

    # BACKEND API (3)
    {
        "title": "POST /reviews відхиляє валідний JSON",
        "summary": "API повертає 422 навіть для правильного payload. Помилка в Pydantic схемі валідації.",
        "type": AtomType.problem,
        "topic": "Backend API",
    },
    {
        "title": "Versioning API: /v2/ чи /api/v2/?",
        "summary": "Обрати стратегію версіонування для breaking changes в endpoints.",
        "type": AtomType.question,
        "topic": "Backend API",
    },
    {
        "title": "Swagger документація автоматично генерується",
        "summary": "OpenAPI схема створюється FastAPI з docstrings та type hints.",
        "type": AtomType.insight,
        "topic": "Backend API",
    },

    # DESIGN (3)
    {
        "title": "Кольорова схема не проходить WCAG AA",
        "summary": "Контраст між фоном та текстом 3.2:1 замість мінімум 4.5:1 для читабельності.",
        "type": AtomType.problem,
        "topic": "Design",
    },
    {
        "title": "Єдина іконка для кнопок без підпису",
        "summary": "Кнопки містять тільки іконку без тексту, що погіршує UX для незнайомих користувачів.",
        "type": AtomType.insight,
        "topic": "Design",
    },
    {
        "title": "Додати dark mode для мобільного додатку",
        "summary": "Темна тема знижує навантаження на очі при використанні вночі.",
        "type": AtomType.idea,
        "topic": "Design",
    },

    # DEVOPS (3)
    {
        "title": "CI/CD pipeline виконується 18 хвилин",
        "summary": "Збірка та тести займають занадто багато часу. Потрібна оптимізація кешування.",
        "type": AtomType.problem,
        "topic": "DevOps",
    },
    {
        "title": "Staging середовище оновлюється автоматично з main",
        "summary": "Кожен merge до main автоматично деплоїться на staging для QA тестування.",
        "type": AtomType.decision,
        "topic": "DevOps",
    },
    {
        "title": "Blue-green deployment для zero downtime",
        "summary": "Розгортати нову версію паралельно зі старою, потім перемкнути traffic без простою.",
        "type": AtomType.idea,
        "topic": "DevOps",
    },

    # FRONTEND (4)
    {
        "title": "React 18 concurrent rendering ламає form state",
        "summary": "useTransition викликає непередбачувану поведінку в формах оренди.",
        "type": AtomType.problem,
        "topic": "Frontend",
    },
    {
        "title": "Zustand замість Redux для state management",
        "summary": "Вибрано Zustand через простоту та менший boilerplate. Redux занадто складний для нашого кейсу.",
        "type": AtomType.decision,
        "topic": "Frontend",
    },
    {
        "title": "Як кешувати список ділянок: SWR чи React Query?",
        "summary": "Обрати library для кешування та синхронізації серверного стану.",
        "type": AtomType.question,
        "topic": "Frontend",
    },
    {
        "title": "Lazy loading компонентів знижує bundle на 40%",
        "summary": "React.lazy() та Suspense дозволили зменшити initial bundle з 2.1MB до 1.2MB.",
        "type": AtomType.insight,
        "topic": "Frontend",
    },

    # MOBILE (3)
    {
        "title": "iOS build fails на CI через Xcode 15",
        "summary": "Нова версія Xcode не сумісна з React Native 0.72. Потрібен upgrade.",
        "type": AtomType.problem,
        "topic": "Mobile",
    },
    {
        "title": "Push notifications через Firebase Cloud Messaging",
        "summary": "FCM обрано для нотифікацій на iOS та Android через кросплатформність.",
        "type": AtomType.decision,
        "topic": "Mobile",
    },
    {
        "title": "Offline-first режим для перегляду ділянок",
        "summary": "Кешувати останні 50 переглянутих ділянок локально для роботи без інтернету.",
        "type": AtomType.idea,
        "topic": "Mobile",
    },

    # QA та тестування (3)
    {
        "title": "E2E тести падають на CI через timing issues",
        "summary": "Playwright тести нестабільні через race conditions. Потрібні явні waitFor.",
        "type": AtomType.problem,
        "topic": "QA та тестування",
    },
    {
        "title": "Code coverage мінімум 80% для нових PR",
        "summary": "Встановлено порог покриття тестами. PR без тестів блокується автоматично.",
        "type": AtomType.decision,
        "topic": "QA та тестування",
    },
    {
        "title": "Автоматизувати регресійне тестування критичних flows",
        "summary": "Реєстрація, створення оголошення, оренда — запускати E2E щоночі.",
        "type": AtomType.idea,
        "topic": "QA та тестування",
    },

    # SECURITY (3)
    {
        "title": "XSS вразливість в коментарях до відгуків",
        "summary": "User input не санітизується перед рендерингом. Можливе виконання JS коду.",
        "type": AtomType.problem,
        "topic": "Security",
    },
    {
        "title": "JWT tokens зберігаються в httpOnly cookies",
        "summary": "Токени не доступні для JavaScript, що захищає від XSS атак.",
        "type": AtomType.decision,
        "topic": "Security",
    },
    {
        "title": "2FA через SMS чи authenticator app?",
        "summary": "Вибрати метод двофакторної автентифікації для підвищення безпеки облікових записів.",
        "type": AtomType.question,
        "topic": "Security",
    },
]


def load_scenarios_from_fixtures(fixtures_dir: Path) -> list[dict]:
    """Load all scenario JSON files from fixtures directory."""
    scenarios = []

    try:
        for json_file in sorted(fixtures_dir.glob("*.json")):
            try:
                data = json.loads(json_file.read_text(encoding="utf-8"))
                if "messages" in data:
                    scenarios.append({
                        "name": json_file.stem,
                        "description": data.get("description", ""),
                        "language": data.get("language", "uk"),
                        "messages": data["messages"],
                        "expected_extraction": data.get("expected_extraction", {}),
                    })
            except Exception as e:
                print(f"⚠️  Could not load {json_file}: {e}")

        print(f"  Loaded {len(scenarios)} scenarios from fixtures")
        return scenarios

    except Exception as e:
        print(f"⚠️  Could not load fixtures: {e}")
        return []


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


async def seed_demo_data(session: AsyncSession):
    """Seed demo data with anonymized messages."""
    print("🌱 Seeding demo data...")

    # Get bot user and source from config seed
    result = await session.execute(select(User).where(User.is_bot == True).limit(1))
    bot_user = result.scalar_one_or_none()

    if not bot_user:
        print("❌ Bot user not found! Run seed_config.py first.")
        return

    result = await session.execute(select(Source).where(Source.name == "Telegram Team Chat").limit(1))
    source = result.scalar_one_or_none()

    if not source:
        print("❌ Telegram source not found! Run seed_config.py first.")
        return

    # Check if config topics exist
    result = await session.execute(select(Topic))
    existing_topics = {t.name: t for t in result.scalars().all()}

    # Create demo topics if needed
    topics_map = {}
    for topic_data in DEMO_TOPICS:
        if topic_data["name"] in existing_topics:
            topics_map[topic_data["name"]] = existing_topics[topic_data["name"]]
            print(f"  ✓ Topic '{topic_data['name']}' already exists")
        else:
            topic = Topic(
                name=topic_data["name"],
                description=topic_data["description"],
                icon=topic_data["icon"],
                color=topic_data["color"],
            )
            session.add(topic)
            await session.flush()
            topics_map[topic_data["name"]] = topic
            print(f"  + Created topic '{topic_data['name']}'")

    # Create atoms
    print(f"  Creating {len(DEMO_ATOMS)} atoms...")
    atoms = []
    for atom_data in DEMO_ATOMS:
        atom = Atom(
            title=atom_data["title"],
            content=atom_data["summary"],  # Atom має content, не summary
            type=atom_data["type"],
            user_approved=True,  # Approved by default for demo
            created_by_id=bot_user.id,
        )
        session.add(atom)
        await session.flush()

        # Link atom to topic
        topic = topics_map[atom_data["topic"]]
        link = TopicAtom(topic_id=topic.id, atom_id=atom.id, position=len(atoms))
        session.add(link)

        atoms.append(atom)

    # Load scenarios from fixtures
    fixtures_dir = Path(__file__).parent.parent / "tests" / "fixtures" / "scenarios"
    scenarios = load_scenarios_from_fixtures(fixtures_dir)

    if not scenarios:
        print("⚠️  No scenarios loaded, using fallback...")
        scenarios = [{"name": "fallback", "messages": [{"text": "Demo message - fixtures не знайдено"}]}]

    # Extract unique message templates from scenarios
    message_templates = []
    for scenario in scenarios:
        for msg_data in scenario["messages"]:
            message_templates.append({
                "text": msg_data.get("text", ""),
                "scenario": scenario["name"],
                "language": scenario.get("language", "uk"),
            })

    # Generate realistic volume: 40-55 messages per workday
    # Over 30 workdays = 1200-1650 messages
    now = datetime.now(UTC)

    # Generate workday timestamps over last 30 workdays
    workdays = []
    for days_ago in range(45, 0, -1):  # Look back 45 days to get ~30 workdays
        day = now - timedelta(days=days_ago)
        # Skip weekends (Saturday=5, Sunday=6)
        if day.weekday() >= 5:
            continue
        workdays.append(day)

    workdays = workdays[-30:]  # Keep last 30 workdays

    all_messages = []
    for workday in workdays:
        # Realistic variation: sometimes less, sometimes more
        # 20% chance of quiet day (20-35 messages)
        # 60% chance of normal day (40-55 messages)
        # 20% chance of busy day (60-80 messages)
        roll = random.random()
        if roll < 0.2:
            messages_today = random.randint(20, 35)  # Quiet day
        elif roll < 0.8:
            messages_today = random.randint(40, 55)  # Normal day
        else:
            messages_today = random.randint(60, 80)  # Busy day

        for _ in range(messages_today):
            # Random template
            template = random.choice(message_templates)

            # Random time during work hours (9:00-18:00)
            hour = random.randint(9, 17)
            minute = random.randint(0, 59)
            timestamp = workday.replace(hour=hour, minute=minute, second=random.randint(0, 59))

            # Noise-to-signal: 10-15 signals/day, 30-40 noise/day
            # Signal: ~25%, Noise: ~72%, Low quality: ~3%
            classification_roll = random.random()
            if classification_roll < 0.25:  # 25% signal (~12/day)
                noise_classification = "signal"
            elif classification_roll < 0.97:  # 72% noise (~36/day)
                noise_classification = "noise"
            else:  # 3% low_quality
                noise_classification = "low_quality"

            all_messages.append({
                "text": template["text"],
                "timestamp": timestamp,
                "classification": noise_classification,
                "topic": random.choice(list(topics_map.values())),
            })

    # Sort by timestamp
    all_messages.sort(key=lambda x: x["timestamp"])

    print(f"  Creating {len(all_messages)} messages over {len(workdays)} workdays...")

    for i, msg_data in enumerate(all_messages):
        # Remove timezone for PostgreSQL
        sent_at = msg_data["timestamp"].replace(tzinfo=None)

        message = Message(
            external_message_id=f"msg_{i}_{random.randint(1000, 9999)}",
            content=msg_data["text"],
            sent_at=sent_at,
            source_id=source.id,
            author_id=bot_user.id,
            topic_id=msg_data["topic"].id,
            analyzed=True,
            confidence=random.uniform(0.6, 0.9),
            noise_classification=msg_data["classification"],
        )
        session.add(message)

    await session.commit()
    print(f"✅ Demo data seeded successfully!")
    print(f"   - {len(DEMO_TOPICS)} topics")
    print(f"   - {len(DEMO_ATOMS)} atoms")
    print(f"   - {len(all_messages)} messages over {len(workdays)} workdays")

    # Calculate signal/noise stats
    signal_count = sum(1 for m in all_messages if m["classification"] == "signal")
    noise_count = sum(1 for m in all_messages if m["classification"] == "noise")
    low_quality_count = sum(1 for m in all_messages if m["classification"] == "low_quality")
    avg_per_day = len(all_messages) / len(workdays)
    avg_signal_per_day = signal_count / len(workdays)
    avg_noise_per_day = noise_count / len(workdays)

    print(f"   - Avg {avg_per_day:.1f} msg/day ({avg_signal_per_day:.1f} signal, {avg_noise_per_day:.1f} noise)")
    print(f"   - Total: {signal_count} signal, {noise_count} noise, {low_quality_count} low_quality")


async def main():
    """Main entry point."""
    database_url = os.getenv(
        "DATABASE_URL_LOCAL",
        "postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker",
    )

    print(f"🔌 Connecting to database: {database_url}")
    engine = create_async_engine(database_url, echo=False)

    if not await test_connection(engine):
        return 1

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        await seed_demo_data(session)

    await engine.dispose()
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
