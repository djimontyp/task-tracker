"""Tests for batching_service conversation grouping."""

import uuid
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest

from app.services.batching_service import (
    get_thread_statistics,
    group_messages_by_conversation,
    select_conversations_for_batch,
)


def create_mock_message(
    id: uuid.UUID | None = None,
    source_channel_id: str | None = None,
    source_thread_id: str | None = None,
    source_parent_id: str | None = None,
    sent_at: datetime | None = None,
) -> MagicMock:
    """Create a mock Message object for testing."""
    msg = MagicMock()
    msg.id = id or uuid.uuid4()
    msg.source_channel_id = source_channel_id
    msg.source_thread_id = source_thread_id
    msg.source_parent_id = source_parent_id
    msg.sent_at = sent_at or datetime.now()
    return msg


class TestGroupMessagesByConversation:
    """Tests for group_messages_by_conversation function."""

    def test_empty_messages(self) -> None:
        """Empty list returns empty dict."""
        result = group_messages_by_conversation([])
        assert result == {}

    def test_explicit_thread_grouping(self) -> None:
        """Messages with same source_thread_id are grouped together."""
        msg1 = create_mock_message(
            source_channel_id="channel-1",
            source_thread_id="thread-123",
            sent_at=datetime(2024, 1, 1, 10, 0),
        )
        msg2 = create_mock_message(
            source_channel_id="channel-1",
            source_thread_id="thread-123",
            sent_at=datetime(2024, 1, 1, 10, 5),
        )
        msg3 = create_mock_message(
            source_channel_id="channel-1",
            source_thread_id="thread-456",
            sent_at=datetime(2024, 1, 1, 10, 2),
        )

        result = group_messages_by_conversation([msg1, msg2, msg3])

        assert len(result) == 2, f"Expected 2 groups, got {len(result)}"
        assert "channel-1:thread-123" in result
        assert "channel-1:thread-456" in result
        assert len(result["channel-1:thread-123"]) == 2
        assert len(result["channel-1:thread-456"]) == 1

    @patch("app.services.batching_service.ai_config")
    def test_time_gap_grouping(self, mock_config: MagicMock) -> None:
        """Messages without thread_id are grouped by time gaps."""
        mock_config.analysis.time_gap_seconds = 600  # 10 minutes

        base_time = datetime(2024, 1, 1, 10, 0)
        msg1 = create_mock_message(
            source_channel_id="channel-1",
            sent_at=base_time,
        )
        msg2 = create_mock_message(
            source_channel_id="channel-1",
            sent_at=base_time + timedelta(minutes=5),  # within gap
        )
        msg3 = create_mock_message(
            source_channel_id="channel-1",
            sent_at=base_time + timedelta(minutes=20),  # exceeds gap
        )

        result = group_messages_by_conversation([msg1, msg2, msg3])

        assert len(result) == 2, f"Expected 2 groups (time gap detected), got {len(result)}: {result.keys()}"
        assert "channel-1:timegap_0" in result
        assert "channel-1:timegap_1" in result
        assert len(result["channel-1:timegap_0"]) == 2
        assert len(result["channel-1:timegap_1"]) == 1

    def test_ungrouped_messages(self) -> None:
        """Messages without channel or thread go to 'ungrouped'."""
        msg1 = create_mock_message(sent_at=datetime(2024, 1, 1, 10, 0))
        msg2 = create_mock_message(sent_at=datetime(2024, 1, 1, 10, 5))

        result = group_messages_by_conversation([msg1, msg2])

        assert len(result) == 1
        assert "ungrouped" in result
        assert len(result["ungrouped"]) == 2

    def test_mixed_grouping(self) -> None:
        """Mixed messages with threads, channels, and ungrouped."""
        msg_thread = create_mock_message(
            source_channel_id="ch-1",
            source_thread_id="thr-1",
            sent_at=datetime(2024, 1, 1, 10, 0),
        )
        msg_channel = create_mock_message(
            source_channel_id="ch-2",
            sent_at=datetime(2024, 1, 1, 10, 0),
        )
        msg_ungrouped = create_mock_message(
            sent_at=datetime(2024, 1, 1, 10, 0),
        )

        result = group_messages_by_conversation([msg_thread, msg_channel, msg_ungrouped])

        assert len(result) == 3
        assert "ch-1:thr-1" in result
        assert "ch-2:timegap_0" in result
        assert "ungrouped" in result


class TestSelectConversationsForBatch:
    """Tests for select_conversations_for_batch function."""

    def test_empty_groups(self) -> None:
        """Empty groups returns empty list."""
        result = select_conversations_for_batch({}, max_size=50)
        assert result == []

    def test_single_group_fits(self) -> None:
        """Single group that fits in batch."""
        msg1 = create_mock_message(sent_at=datetime(2024, 1, 1, 10, 0))
        msg2 = create_mock_message(sent_at=datetime(2024, 1, 1, 10, 5))

        groups = {"group-1": [msg1, msg2]}
        result = select_conversations_for_batch(groups, max_size=50)

        assert len(result) == 2
        assert msg1.id in result
        assert msg2.id in result

    def test_multiple_groups_fit(self) -> None:
        """Multiple groups that fit in batch."""
        msg1 = create_mock_message(sent_at=datetime(2024, 1, 1, 10, 0))
        msg2 = create_mock_message(sent_at=datetime(2024, 1, 1, 11, 0))  # Newer

        groups = {
            "old-group": [msg1],
            "new-group": [msg2],
        }
        result = select_conversations_for_batch(groups, max_size=50)

        assert len(result) == 2, f"Expected 2 messages, got {len(result)}"
        # Newer group should be prioritized (comes first)
        assert result[0] == msg2.id

    def test_group_too_large(self) -> None:
        """Single group larger than max_size is truncated."""
        messages = [
            create_mock_message(sent_at=datetime(2024, 1, 1, 10, i))
            for i in range(10)
        ]

        groups = {"big-group": messages}
        result = select_conversations_for_batch(groups, max_size=5)

        assert len(result) == 5, f"Expected 5 messages (truncated), got {len(result)}"
        # First 5 by time order
        expected_ids = [m.id for m in sorted(messages, key=lambda m: m.sent_at)[:5]]
        assert result == expected_ids

    def test_respects_max_size(self) -> None:
        """Doesn't exceed max_size even with multiple groups."""
        msg1 = create_mock_message(sent_at=datetime(2024, 1, 1, 12, 0))  # Newest
        msg2 = create_mock_message(sent_at=datetime(2024, 1, 1, 11, 0))
        msg3 = create_mock_message(sent_at=datetime(2024, 1, 1, 10, 0))  # Oldest

        groups = {
            "group-1": [msg1],  # Will be picked first (newest)
            "group-2": [msg2],
            "group-3": [msg3],
        }
        result = select_conversations_for_batch(groups, max_size=2)

        assert len(result) == 2
        assert msg1.id in result
        assert msg2.id in result
        assert msg3.id not in result  # Didn't fit


class TestGetThreadStatistics:
    """Tests for get_thread_statistics function."""

    def test_empty_messages(self) -> None:
        """Empty list returns all zeros."""
        result = get_thread_statistics([])
        assert result == {
            "with_thread_id": 0,
            "with_channel_id": 0,
            "with_parent_id": 0,
            "ungrouped": 0,
        }

    def test_counts_threading_types(self) -> None:
        """Correctly counts different threading types."""
        msg_thread = create_mock_message(source_thread_id="t1", source_parent_id="p1")
        msg_channel = create_mock_message(source_channel_id="c1")
        msg_ungrouped = create_mock_message()
        msg_reply = create_mock_message(source_channel_id="c2", source_parent_id="p2")

        result = get_thread_statistics([msg_thread, msg_channel, msg_ungrouped, msg_reply])

        assert result["with_thread_id"] == 1, f"Expected 1 with_thread_id, got {result}"
        assert result["with_channel_id"] == 2, f"Expected 2 with_channel_id, got {result}"
        assert result["ungrouped"] == 1, f"Expected 1 ungrouped, got {result}"
        assert result["with_parent_id"] == 2, f"Expected 2 with_parent_id (replies), got {result}"
