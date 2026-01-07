"""Test extraction with sample Telegram chat messages.

Parses Telegram export format and loads into DB for extraction testing.

Usage:
    cd backend && uv run python scripts/test_extraction_messages.py

Features:
    - Parses Telegram export format: "Author, [DD.MM.YYYY HH:MM]\\nContent"
    - Extracts @mentions for threading hints
    - Groups messages by conversation (time gaps)
    - Triggers knowledge extraction
"""

import asyncio
import re
import sys
import uuid
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

# Add parent directory to path for app imports
sys.path.insert(0, str(Path(__file__).parent.parent))


@dataclass
class ParsedMessage:
    """Parsed message from Telegram export."""

    author: str
    sent_at: datetime
    content: str
    mentions: list[str]


def parse_telegram_export(file_path: str) -> list[ParsedMessage]:
    """Parse Telegram export file format.

    Format:
        Author Name, [DD.MM.YYYY HH:MM]
        Message content (can be multiline)

        Author Name, [DD.MM.YYYY HH:MM]
        Another message
    """
    content = Path(file_path).read_text(encoding="utf-8")

    # Pattern to match message header: "Author, [DD.MM.YYYY HH:MM]"
    header_pattern = re.compile(r"^(.+?), \[(\d{2}\.\d{2}\.\d{4}) (\d{2}:\d{2})\]$", re.MULTILINE)

    messages: list[ParsedMessage] = []
    lines = content.split("\n")

    current_author: str | None = None
    current_time: datetime | None = None
    current_content_lines: list[str] = []

    def save_current_message() -> None:
        if current_author and current_time and current_content_lines:
            content_text = "\n".join(current_content_lines).strip()
            if content_text:  # Skip empty messages (media-only)
                mentions = re.findall(r"@(\w+)", content_text)
                messages.append(
                    ParsedMessage(
                        author=current_author,
                        sent_at=current_time,
                        content=content_text,
                        mentions=mentions,
                    )
                )

    for line in lines:
        match = header_pattern.match(line)
        if match:
            # Save previous message
            save_current_message()

            # Start new message
            current_author = match.group(1)
            date_str = match.group(2)
            time_str = match.group(3)
            current_time = datetime.strptime(f"{date_str} {time_str}", "%d.%m.%Y %H:%M")
            current_content_lines = []
        elif current_author:
            # Continuation of current message
            current_content_lines.append(line)

    # Save last message
    save_current_message()

    return messages


def analyze_conversations(messages: list[ParsedMessage]) -> dict[str, int]:
    """Analyze message patterns for reporting."""
    authors = set(m.author for m in messages)
    mentions = set()
    for m in messages:
        mentions.update(m.mentions)

    # Time gaps
    time_gaps: list[float] = []
    for i in range(1, len(messages)):
        gap = (messages[i].sent_at - messages[i - 1].sent_at).total_seconds() / 60
        time_gaps.append(gap)

    return {
        "total_messages": len(messages),
        "unique_authors": len(authors),
        "unique_mentions": len(mentions),
        "avg_gap_minutes": sum(time_gaps) / len(time_gaps) if time_gaps else 0,
        "max_gap_minutes": max(time_gaps) if time_gaps else 0,
    }


async def load_messages_to_db(messages: list[ParsedMessage], source_name: str = "moye_chat_test") -> list[uuid.UUID]:
    """Load parsed messages into database."""
    import os

    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
    from sqlalchemy.orm import sessionmaker

    from app.models import Message, Source, User

    # Connect to local PostgreSQL (not docker)
    database_url = os.getenv("DATABASE_URL_LOCAL", "postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker")
    engine = create_async_engine(database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        # Get or create test source
        result = await db.execute(select(Source).where(Source.name == source_name))
        source = result.scalar_one_or_none()

        if not source:
            source = Source(name=source_name, type="telegram", is_active=True)
            db.add(source)
            await db.flush()
            print(f"  Created source '{source_name}' (id={source.id})")
        else:
            print(f"  Using existing source '{source_name}' (id={source.id})")

        # Get or create authors by first_name
        author_cache: dict[str, int] = {}
        for msg in messages:
            if msg.author not in author_cache:
                # Parse author name (handle emojis and special chars)
                clean_name = msg.author.replace("👨🏻‍💻", "").strip()
                name_parts = clean_name.split(maxsplit=1)
                first_name = name_parts[0][:100] if name_parts else "Unknown"
                last_name = name_parts[1][:100] if len(name_parts) > 1 else None

                # Check if user exists by first_name (use first to handle duplicates)
                result = await db.execute(select(User).where(User.first_name == first_name).limit(1))
                user = result.scalar_one_or_none()

                if not user:
                    user = User(first_name=first_name, last_name=last_name, is_active=True)
                    db.add(user)
                    await db.flush()

                author_cache[msg.author] = user.id

        # Create messages
        channel_id = f"moye-chat-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        created_ids: list[uuid.UUID] = []

        for msg in messages:
            db_msg = Message(
                external_message_id=f"moye-{uuid.uuid4().hex[:8]}",
                content=msg.content,
                sent_at=msg.sent_at,
                source_id=source.id,
                author_id=author_cache[msg.author],
                source_channel_id=channel_id,
                source_thread_id=None,  # Will be grouped by batching service
                analyzed=False,
            )
            db.add(db_msg)
            created_ids.append(db_msg.id)

        await db.commit()
        print(f"  Created {len(created_ids)} messages in channel '{channel_id}'")
        return created_ids


async def test_batching(message_ids: list[uuid.UUID]) -> None:
    """Test batching service on loaded messages."""
    import os

    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
    from sqlalchemy.orm import sessionmaker

    from app.models import Message
    from app.services.batching_service import group_messages_by_conversation

    database_url = os.getenv("DATABASE_URL_LOCAL", "postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker")
    engine = create_async_engine(database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        result = await db.execute(select(Message).where(Message.id.in_(message_ids)).order_by(Message.sent_at))
        messages = list(result.scalars().all())

        grouped = group_messages_by_conversation(messages)

        print(f"\n📊 Batching results:")
        print(f"   Total groups: {len(grouped)}")
        for key, msgs in list(grouped.items())[:5]:  # Show first 5
            print(f"   {key}: {len(msgs)} messages")
            if msgs:
                first = msgs[0]
                print(f"      First: [{first.sent_at.strftime('%H:%M')}] {first.content[:50]}...")
        if len(grouped) > 5:
            print(f"   ... and {len(grouped) - 5} more groups")


async def trigger_extraction(message_ids: list[uuid.UUID]) -> None:
    """Trigger knowledge extraction task."""
    from app.tasks.knowledge import extract_knowledge_from_messages_task

    print("\n🚀 Triggering extraction...")

    # Queue the task
    str_ids = [str(mid) for mid in message_ids]
    try:
        await extract_knowledge_from_messages_task.kiq(str_ids)
        print(f"   Queued extraction for {len(message_ids)} messages")
        print("   Check worker logs for results")
    except Exception as e:
        print(f"   ⚠️  Could not queue task (worker may not be running): {e}")
        import json

        sample_ids = json.dumps(str_ids[:10])
        print(f"\n💡 To trigger manually via API:")
        print(f'   curl -X POST http://localhost:8000/api/v1/knowledge/extract \\')
        print(f'     -H "Content-Type: application/json" \\')
        print(f"     -d '{{\"message_ids\": {sample_ids}}}'")
        print(f"\n   Or trigger for ALL {len(str_ids)} messages:")
        print(f'   curl -X POST http://localhost:8000/api/v1/knowledge/extract/trigger')


async def main() -> None:
    """Main entry point."""
    # Support CLI argument for file path
    if len(sys.argv) > 1:
        file_path = Path(sys.argv[1])
    else:
        file_path = Path(__file__).parent / "sample_chat_messages.txt"

    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return

    print(f"📂 Parsing: {file_path}")
    messages = parse_telegram_export(str(file_path))

    if not messages:
        print("❌ No messages parsed")
        return

    # Analysis
    stats = analyze_conversations(messages)
    print(f"\n📊 Analysis:")
    print(f"   Messages: {stats['total_messages']}")
    print(f"   Authors: {stats['unique_authors']}")
    print(f"   @mentions: {stats['unique_mentions']}")
    print(f"   Avg gap: {stats['avg_gap_minutes']:.1f} min")
    print(f"   Max gap: {stats['max_gap_minutes']:.1f} min")

    # Sample messages
    print(f"\n📝 Sample messages:")
    for msg in messages[:3]:
        print(f"   [{msg.sent_at.strftime('%H:%M')}] {msg.author}: {msg.content[:60]}...")

    # Load to DB
    print(f"\n💾 Loading to database...")
    message_ids = await load_messages_to_db(messages)

    # Test batching
    await test_batching(message_ids)

    # Trigger extraction
    await trigger_extraction(message_ids)

    print("\n✅ Done!")


if __name__ == "__main__":
    asyncio.run(main())
