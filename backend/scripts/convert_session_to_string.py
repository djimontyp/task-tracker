"""
Convert existing SQLite session to StringSession.

This script reads your existing session file and outputs a string
that you can put in .env file.

Usage:
    python scripts/convert_session_to_string.py
"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from telethon.sessions import StringSession, SQLiteSession
from core.config import settings


def main():
    """Convert session file to string."""
    print("=" * 60)
    print("Session File to String Converter")
    print("=" * 60)
    print()
    
    # Find session file
    session_paths = [
        "telegram_sessions/task_tracker.session",
        "task_tracker.session",
        "/app/sessions/task_tracker.session",
    ]
    
    session_file = None
    for path in session_paths:
        if Path(path).exists():
            session_file = path.replace(".session", "")
            break
    
    if not session_file:
        print("❌ ERROR: No session file found!")
        print()
        print("Searched in:")
        for path in session_paths:
            print(f"  - {path}")
        print()
        print("Please run telegram_auth.py first to create a session.")
        return
    
    print(f"✅ Found session: {session_file}.session")
    print()
    
    try:
        # Load SQLite session
        sqlite_session = SQLiteSession(session_file)
        
        # Convert to StringSession
        string_session = StringSession.save(sqlite_session)
        
        print("=" * 60)
        print("✅ SUCCESS! Session converted to string")
        print("=" * 60)
        print()
        print("Add this to your .env file:")
        print()
        print(f"TELEGRAM_SESSION_STRING={string_session}")
        print()
        print("=" * 60)
        print()
        print("After adding to .env:")
        print("1. Restart worker: docker compose restart worker")
        print("2. Try message ingestion!")
        print()
        
    except Exception as e:
        print()
        print("=" * 60)
        print(f"❌ ERROR: {e}")
        print("=" * 60)
        print()


if __name__ == "__main__":
    main()
