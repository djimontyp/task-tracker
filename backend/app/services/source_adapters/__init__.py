"""Source adapters for fetching messages from various platforms.

Provides unified interface for:
- Telegram (via Telethon MTProto)
- Future: Slack, Discord, Email, etc.
"""

from .base import SourceAdapter, MessageCountResult, ConnectionTestResult
from .telegram import TelegramSourceAdapter

__all__ = [
    "SourceAdapter",
    "MessageCountResult",
    "ConnectionTestResult",
    "TelegramSourceAdapter",
]
