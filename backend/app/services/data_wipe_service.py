"""Service for secure data wipe operations.

Provides two-step confirmation process for destructive admin operations:
1. Request phase: Generate token + show affected counts
2. Execute phase: Validate token + perform deletion

IMPORTANT: This service KEEPS sources and user data intact.
Only knowledge data (messages, atoms, topics) is wiped.
"""

import json
import logging
from datetime import UTC, datetime

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.atom import Atom, AtomLink, TopicAtom
from app.models.atom_version import AtomVersion
from app.models.confirmation_token import (
    ConfirmationToken,
    DataWipeConfirmation,
    DataWipeResult,
    DataWipeScope,
)
from app.models.message import Message
from app.models.message_history import MessageHistory
from app.models.topic import Topic
from app.models.topic_version import TopicVersion

logger = logging.getLogger(__name__)


class DataWipeService:
    """Service for managing data wipe operations with confirmation tokens."""

    async def get_affected_counts(
        self,
        session: AsyncSession,
        scope: DataWipeScope,
    ) -> dict[str, int]:
        """Get counts of entities that will be affected by wipe.

        Args:
            session: Database session
            scope: Scope of the wipe operation

        Returns:
            Dictionary with entity names and their counts
        """
        counts: dict[str, int] = {}

        if scope in (DataWipeScope.messages, DataWipeScope.all):
            result = await session.execute(select(func.count()).select_from(Message))
            counts["messages"] = result.scalar_one()

            result = await session.execute(select(func.count()).select_from(MessageHistory))
            counts["message_history"] = result.scalar_one()

        if scope in (DataWipeScope.atoms, DataWipeScope.all):
            result = await session.execute(select(func.count()).select_from(Atom))
            counts["atoms"] = result.scalar_one()

            result = await session.execute(select(func.count()).select_from(AtomLink))
            counts["atom_links"] = result.scalar_one()

            result = await session.execute(select(func.count()).select_from(AtomVersion))
            counts["atom_versions"] = result.scalar_one()

            result = await session.execute(select(func.count()).select_from(TopicAtom))
            counts["topic_atoms"] = result.scalar_one()

        if scope in (DataWipeScope.topics, DataWipeScope.all):
            result = await session.execute(select(func.count()).select_from(Topic))
            counts["topics"] = result.scalar_one()

            result = await session.execute(select(func.count()).select_from(TopicVersion))
            counts["topic_versions"] = result.scalar_one()

        return counts

    async def generate_confirmation_token(
        self,
        session: AsyncSession,
        scope: DataWipeScope,
    ) -> DataWipeConfirmation:
        """Generate a confirmation token for data wipe operation.

        Args:
            session: Database session
            scope: Scope of the wipe operation

        Returns:
            DataWipeConfirmation with token and affected counts
        """
        affected_counts = await self.get_affected_counts(session, scope)

        token_str = ConfirmationToken.generate_token()
        expires_at = ConfirmationToken.calculate_expiry()

        token = ConfirmationToken(
            token=token_str,
            scope=scope.value,
            expires_at=expires_at,
            metadata_json=json.dumps(affected_counts),
        )

        session.add(token)
        await session.commit()
        await session.refresh(token)

        total_affected = sum(affected_counts.values())

        logger.warning(
            "Data wipe token generated: scope=%s, affected=%d entities, expires=%s",
            scope.value,
            total_affected,
            expires_at.isoformat(),
        )

        return DataWipeConfirmation(
            token=token_str,
            scope=scope.value,
            expires_at=expires_at.isoformat(),
            affected_counts=affected_counts,
            warning=f"This will permanently delete {total_affected} records. "
            "Sources, users, and telegram profiles will NOT be affected. "
            f"Token expires in {ConfirmationToken.TTL_MINUTES} minutes.",
        )

    async def validate_token(
        self,
        session: AsyncSession,
        token_str: str,
    ) -> ConfirmationToken | None:
        """Validate a confirmation token.

        Args:
            session: Database session
            token_str: Token string to validate

        Returns:
            ConfirmationToken if valid, None otherwise
        """
        result = await session.execute(
            select(ConfirmationToken).where(ConfirmationToken.token == token_str)  # type: ignore[arg-type]
        )
        token = result.scalar_one_or_none()

        if not token:
            logger.warning("Data wipe token not found: %s...", token_str[:8])
            return None

        if not token.is_valid():
            if token.used:
                logger.warning("Data wipe token already used: %s...", token_str[:8])
            else:
                logger.warning("Data wipe token expired: %s...", token_str[:8])
            return None

        return token

    async def execute_wipe(
        self,
        session: AsyncSession,
        token_str: str,
    ) -> DataWipeResult:
        """Execute data wipe with valid confirmation token.

        Args:
            session: Database session
            token_str: Confirmation token

        Returns:
            DataWipeResult with deletion counts

        Raises:
            ValueError: If token is invalid or expired
        """
        token = await self.validate_token(session, token_str)
        if not token:
            raise ValueError("Invalid or expired confirmation token")

        scope = DataWipeScope(token.scope)
        deleted_counts: dict[str, int] = {}

        logger.warning(
            "Executing data wipe: scope=%s, token=%s...",
            scope.value,
            token_str[:8],
        )

        # Delete in correct order to respect foreign key constraints
        # Order: versions -> links -> join tables -> main tables

        # Get counts before deletion for accurate reporting
        pre_counts = await self.get_affected_counts(session, scope)

        if scope in (DataWipeScope.atoms, DataWipeScope.all):
            # Delete atom versions first
            await session.execute(delete(AtomVersion))
            deleted_counts["atom_versions"] = pre_counts.get("atom_versions", 0)

            # Delete atom links
            await session.execute(delete(AtomLink))
            deleted_counts["atom_links"] = pre_counts.get("atom_links", 0)

            # Delete topic-atom associations
            await session.execute(delete(TopicAtom))
            deleted_counts["topic_atoms"] = pre_counts.get("topic_atoms", 0)

        if scope in (DataWipeScope.messages, DataWipeScope.all):
            # Delete message history
            await session.execute(delete(MessageHistory))
            deleted_counts["message_history"] = pre_counts.get("message_history", 0)

            # Delete messages (must be before topics due to FK)
            await session.execute(delete(Message))
            deleted_counts["messages"] = pre_counts.get("messages", 0)

        if scope in (DataWipeScope.atoms, DataWipeScope.all):
            # Delete atoms (after topic_atoms cleared)
            await session.execute(delete(Atom))
            deleted_counts["atoms"] = pre_counts.get("atoms", 0)

        if scope in (DataWipeScope.topics, DataWipeScope.all):
            # Delete topic versions
            await session.execute(delete(TopicVersion))
            deleted_counts["topic_versions"] = pre_counts.get("topic_versions", 0)

            # Delete topics last
            await session.execute(delete(Topic))
            deleted_counts["topics"] = pre_counts.get("topics", 0)

        # Mark token as used
        token.used = True
        token.used_at = datetime.now(UTC)
        await session.commit()

        total_deleted = sum(deleted_counts.values())

        logger.warning(
            "Data wipe completed: scope=%s, deleted=%d records",
            scope.value,
            total_deleted,
        )

        return DataWipeResult(
            success=True,
            deleted_counts=deleted_counts,
            message=f"Successfully deleted {total_deleted} records. "
            "Sources and user data preserved.",
        )

    async def cleanup_expired_tokens(
        self,
        session: AsyncSession,
    ) -> int:
        """Remove expired and used tokens from database.

        Args:
            session: Database session

        Returns:
            Number of tokens cleaned up
        """
        now = datetime.now(UTC)

        # Count tokens to be deleted before deletion
        count_result = await session.execute(
            select(func.count()).select_from(ConfirmationToken).where(
                (ConfirmationToken.expires_at < now) | (ConfirmationToken.used == True)  # type: ignore[arg-type]  # noqa: E712
            )
        )
        count = count_result.scalar_one()

        if count > 0:
            await session.execute(
                delete(ConfirmationToken).where(
                    (ConfirmationToken.expires_at < now) | (ConfirmationToken.used == True)  # type: ignore[arg-type]  # noqa: E712
                )
            )
            await session.commit()
            logger.info("Cleaned up %d expired/used confirmation tokens", count)

        return count
