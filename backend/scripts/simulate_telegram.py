#!/usr/bin/env python3
"""Simulate Telegram messages from exported chat file."""

import argparse
import hashlib
import re
import sys
import time
from datetime import datetime

import httpx


def parse_telegram_export(file_path: str) -> list[dict]:
    """Parse Telegram chat export format.

    Format:
    Username, [DD.MM.YYYY HH:MM]
    Message text
    """
    messages = []

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Pattern for message header: "Name, [DD.MM.YYYY HH:MM]"
    pattern = r'^([^,\n]+), \[(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})\]$'

    lines = content.split('\n')
    current_author = None
    current_timestamp = None
    current_text_lines = []

    for i, line in enumerate(lines):
        line = line.strip('→').strip()  # Remove line number prefix

        # Check if this is a header line
        match = re.match(pattern, line)

        if match:
            # Save previous message if exists
            if current_author and current_text_lines:
                text = '\n'.join(current_text_lines).strip()
                if text:  # Only add non-empty messages
                    messages.append({
                        "author": current_author,
                        "timestamp": current_timestamp,
                        "text": text,
                    })

            # Parse new message header
            author = match.group(1).strip()
            day = int(match.group(2))
            month = int(match.group(3))
            year = int(match.group(4))
            hour = int(match.group(5))
            minute = int(match.group(6))

            current_author = author
            current_timestamp = datetime(year, month, day, hour, minute)
            current_text_lines = []
        else:
            # This is message content
            if current_author and line:
                current_text_lines.append(line)

    # Don't forget last message
    if current_author and current_text_lines:
        text = '\n'.join(current_text_lines).strip()
        if text:
            messages.append({
                "author": current_author,
                "timestamp": current_timestamp,
                "text": text,
            })

    return messages


def generate_user_id(username: str) -> int:
    """Generate consistent user ID from username."""
    return int(hashlib.md5(username.encode()).hexdigest()[:8], 16)


def create_telegram_update(msg: dict, message_id: int) -> dict:
    """Create Telegram webhook update format."""
    user_id = generate_user_id(msg["author"])

    # Parse name parts
    name_parts = msg["author"].split()
    first_name = name_parts[0] if name_parts else msg["author"]
    last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else None

    # Generate username from author name
    username = msg["author"].lower().replace(" ", "_").replace("👨🏻‍💻", "").strip("_")

    return {
        "update_id": 100000000 + message_id,
        "message": {
            "message_id": message_id,
            "from": {
                "id": user_id,
                "is_bot": False,
                "first_name": first_name,
                "last_name": last_name,
                "username": username[:32] if username else None,
                "language_code": "uk",
            },
            "chat": {
                "id": -1002988379206,  # Example chat ID
                "title": "Feodal Dev Team",
                "type": "supergroup",
            },
            "date": int(msg["timestamp"].timestamp()),
            "text": msg["text"],
        },
    }


def send_to_webhook(update: dict, webhook_url: str) -> bool:
    """Send update to webhook."""
    try:
        response = httpx.post(webhook_url, json=update, timeout=10.0)
        return response.status_code == 200
    except Exception as e:
        print(f"Error sending to webhook: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Simulate Telegram messages")
    parser.add_argument("file", help="Path to exported chat file")
    parser.add_argument("--webhook", default="http://localhost/webhook/telegram",
                        help="Webhook URL")
    parser.add_argument("--delay", type=float, default=0.1,
                        help="Delay between messages (seconds)")
    parser.add_argument("--limit", type=int, default=0,
                        help="Limit number of messages (0 = all)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Parse only, don't send")

    args = parser.parse_args()

    print(f"📖 Parsing {args.file}...")
    messages = parse_telegram_export(args.file)
    print(f"✅ Found {len(messages)} messages")

    if args.limit > 0:
        messages = messages[:args.limit]
        print(f"📊 Limited to {len(messages)} messages")

    if args.dry_run:
        print("\n🔍 Dry run - showing first 5 messages:")
        for i, msg in enumerate(messages[:5]):
            print(f"\n--- Message {i+1} ---")
            print(f"Author: {msg['author']}")
            print(f"Time: {msg['timestamp']}")
            print(f"Text: {msg['text'][:100]}...")
        return

    print(f"\n📤 Sending to {args.webhook}...")

    success = 0
    failed = 0

    for i, msg in enumerate(messages):
        update = create_telegram_update(msg, message_id=10000 + i)

        if send_to_webhook(update, args.webhook):
            success += 1
            print(f"✓ [{i+1}/{len(messages)}] {msg['author'][:20]}: {msg['text'][:40]}...")
        else:
            failed += 1
            print(f"✗ [{i+1}/{len(messages)}] Failed to send message")

        if args.delay > 0 and i < len(messages) - 1:
            time.sleep(args.delay)

    print(f"\n📊 Done! Success: {success}, Failed: {failed}")


if __name__ == "__main__":
    main()
