"""Batching service for grouping messages by conversation context.

Groups messages by channel and thread for better LLM extraction quality.
Uses time-gap fallback when explicit threading is unavailable.
"""

import uuid
from collections import defaultdict
from datetime import datetime
from typing import Sequence

from loguru import logger

from app.config.ai_config import ai_config
from app.models import Message


def group_messages_by_conversation(messages: Sequence[Message]) -> dict[str, list[Message]]:
    """Group messages by channel+thread with time-gap fallback.

    Strategy:
    1. If message has explicit source_thread_id → use it
    2. Else if message has source_channel_id → group by channel + time gaps
    3. Else → put in "ungrouped" bucket

    Args:
        messages: Sequence of Message objects to group

    Returns:
        Dictionary mapping conversation keys to message lists.
        Keys are formatted as "{channel_id}:{thread_id}" or "{channel_id}:timegap_{n}"
    """
    if not messages:
        return {}

    groups: dict[str, list[Message]] = defaultdict(list)

    # Track last message time per channel for time-gap detection
    channel_last_time: dict[str, datetime] = {}
    channel_gap_counter: dict[str, int] = {}

    gap_seconds = ai_config.analysis.time_gap_seconds

    for msg in sorted(messages, key=lambda m: m.sent_at):
        channel_id = msg.source_channel_id or "default"

        # Case 1: Explicit thread
        if msg.source_thread_id:
            key = f"{channel_id}:{msg.source_thread_id}"

        # Case 2: Channel only - use time gaps
        elif msg.source_channel_id:
            last_time = channel_last_time.get(channel_id)

            if last_time is None:
                # First message in this channel
                channel_gap_counter[channel_id] = 0
            elif (msg.sent_at - last_time).total_seconds() > gap_seconds:
                # Time gap exceeded - start new conversation
                channel_gap_counter[channel_id] = channel_gap_counter.get(channel_id, 0) + 1
                logger.debug(
                    f"Time gap detected in channel {channel_id}: "
                    f"{(msg.sent_at - last_time).total_seconds():.0f}s > {gap_seconds}s"
                )

            gap_num = channel_gap_counter.get(channel_id, 0)
            key = f"{channel_id}:timegap_{gap_num}"
            channel_last_time[channel_id] = msg.sent_at

        # Case 3: No channel info
        else:
            key = "ungrouped"

        groups[key].append(msg)

    logger.info(
        f"Grouped {len(messages)} messages into {len(groups)} conversations: "
        f"{', '.join(f'{k}({len(v)})' for k, v in sorted(groups.items(), key=lambda x: -len(x[1]))[:5])}"
    )

    return dict(groups)


def select_conversations_for_batch(
    grouped: dict[str, list[Message]],
    max_size: int,
) -> list[uuid.UUID]:
    """Select complete conversations for batch processing.

    Prioritizes conversations by newest message timestamp.
    Keeps conversations together (doesn't split threads).

    Args:
        grouped: Dictionary from group_messages_by_conversation()
        max_size: Maximum number of messages in batch

    Returns:
        List of message UUIDs to include in batch
    """
    if not grouped:
        return []

    # Sort groups by newest message (most recent first)
    sorted_groups = sorted(
        grouped.items(),
        key=lambda x: max(m.sent_at for m in x[1]),
        reverse=True,
    )

    batch_ids: list[uuid.UUID] = []

    for group_key, messages in sorted_groups:
        if len(batch_ids) + len(messages) <= max_size:
            # Whole conversation fits
            batch_ids.extend(m.id for m in messages)
            logger.debug(f"Added conversation '{group_key}' ({len(messages)} messages) to batch")

        elif len(batch_ids) == 0:
            # First group is too large - take time-ordered subset
            sorted_msgs = sorted(messages, key=lambda m: m.sent_at)
            batch_ids.extend(m.id for m in sorted_msgs[:max_size])
            logger.warning(
                f"Conversation '{group_key}' too large ({len(messages)}>{max_size}), "
                f"taking first {max_size} messages"
            )
            break

        else:
            # Can't fit more conversations
            logger.debug(
                f"Batch full ({len(batch_ids)}/{max_size}), "
                f"skipping conversation '{group_key}' ({len(messages)} messages)"
            )

    logger.info(f"Selected {len(batch_ids)} messages for batch from {len(grouped)} conversations")
    return batch_ids


def get_thread_statistics(messages: Sequence[Message]) -> dict[str, int]:
    """Get statistics about threading in a message set.

    Useful for monitoring and debugging batching quality.

    Args:
        messages: Sequence of messages to analyze

    Returns:
        Dictionary with counts:
        - with_thread_id: Messages with explicit thread
        - with_channel_id: Messages with channel but no thread
        - with_parent_id: Messages that are replies
        - ungrouped: Messages with no threading info
    """
    stats = {
        "with_thread_id": 0,
        "with_channel_id": 0,
        "with_parent_id": 0,
        "ungrouped": 0,
    }

    for msg in messages:
        if msg.source_thread_id:
            stats["with_thread_id"] += 1
        elif msg.source_channel_id:
            stats["with_channel_id"] += 1
        else:
            stats["ungrouped"] += 1

        if msg.source_parent_id:
            stats["with_parent_id"] += 1

    return stats
