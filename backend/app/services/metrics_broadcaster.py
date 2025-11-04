"""Service for broadcasting metrics updates via WebSocket."""

import asyncio
from datetime import UTC, datetime

from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AnalysisRun
from app.schemas.metrics import DashboardMetricsResponse, MetricTrend
from app.services.websocket_manager import websocket_manager


class MetricsBroadcaster:
    """Service for calculating and broadcasting dashboard metrics.

    This service computes real-time metrics and broadcasts updates to connected
    WebSocket clients subscribed to the 'metrics' topic.
    """

    def __init__(self) -> None:
        """Initialize metrics broadcaster."""
        self._last_broadcast_time: float = 0
        self._min_broadcast_interval: float = 1.0  # Rate limiting: max 1 update per second
        self._broadcast_lock = asyncio.Lock()

    async def _should_broadcast(self) -> bool:
        """Check if enough time has passed since last broadcast (rate limiting).

        Returns:
            True if broadcast is allowed, False otherwise
        """
        current_time = asyncio.get_event_loop().time()
        time_since_last = current_time - self._last_broadcast_time
        return time_since_last >= self._min_broadcast_interval

    async def _calculate_metrics(self, db: AsyncSession) -> DashboardMetricsResponse:
        """Calculate current dashboard metrics from database.

        Args:
            db: Database session

        Returns:
            Calculated metrics response
        """
        # Topic quality score (average across approved topics)
        # Note: Quality score calculation would need to be implemented when Topic model has quality_score field
        avg_quality = 85.0  # Placeholder - implement when Topic.quality_score exists

        # Noise ratio (percentage of low-importance messages)
        # Note: Message importance scoring would need to be implemented
        noise_ratio = 18.5  # Placeholder - implement when message scoring exists

        # Active analysis runs
        active_runs_result = await db.execute(
            select(func.count()).select_from(AnalysisRun).where(AnalysisRun.status.in_(["pending", "processing"]))  # type: ignore[attr-defined]
        )
        active_runs = active_runs_result.scalar() or 0

        # Classification accuracy (mock for now - would come from experiments)
        classification_accuracy = 92.3

        # Trend calculations (simplified - would need historical data)
        trends = {
            "topicQualityScore": MetricTrend(direction="stable", change=0.0),
            "noiseRatio": MetricTrend(direction="stable", change=0.0),
            "classificationAccuracy": MetricTrend(direction="stable", change=0.0),
            "activeAnalysisRuns": MetricTrend(direction="stable", change=0.0),
        }

        return DashboardMetricsResponse(
            topicQualityScore=round(avg_quality, 1),
            noiseRatio=round(noise_ratio, 1),
            classificationAccuracy=classification_accuracy,
            activeAnalysisRuns=active_runs,
            trends=trends,
        )

    async def broadcast_metrics_update(self, db: AsyncSession, event_type: str = "metrics:update") -> None:
        """Calculate and broadcast metrics update to WebSocket clients.

        Rate-limited to max 1 update per second to prevent spam.

        Args:
            db: Database session for metrics calculation
            event_type: Event type identifier (default: "metrics:update")
        """
        async with self._broadcast_lock:
            # Rate limiting check
            if not await self._should_broadcast():
                logger.debug("⏭️  Metrics broadcast skipped (rate limited)")
                return

            try:
                # Calculate current metrics
                metrics = await self._calculate_metrics(db)

                # Prepare WebSocket message
                message = {
                    "type": event_type,
                    "data": metrics.model_dump(),
                    "timestamp": datetime.now(UTC).isoformat(),
                }

                # Broadcast to all clients subscribed to 'metrics' topic
                await websocket_manager.broadcast("metrics", message)

                # Update last broadcast time
                self._last_broadcast_time = asyncio.get_event_loop().time()

                logger.debug(
                    f"📊 Broadcasted metrics update: quality={metrics.topicQualityScore}, "
                    f"noise={metrics.noiseRatio}%, runs={metrics.activeAnalysisRuns}"
                )

            except Exception as e:
                logger.error(f"❌ Failed to broadcast metrics update: {e}")

    async def broadcast_on_topic_change(self, db: AsyncSession) -> None:
        """Broadcast metrics update when topics are created/updated.

        Args:
            db: Database session
        """
        await self.broadcast_metrics_update(db, event_type="metrics:update")

    async def broadcast_on_message_classified(self, db: AsyncSession) -> None:
        """Broadcast metrics update when messages are classified.

        Args:
            db: Database session
        """
        await self.broadcast_metrics_update(db, event_type="metrics:update")

    async def broadcast_on_analysis_run_change(self, db: AsyncSession) -> None:
        """Broadcast metrics update when analysis runs change state.

        Args:
            db: Database session
        """
        await self.broadcast_metrics_update(db, event_type="metrics:update")


# Global metrics broadcaster instance
metrics_broadcaster = MetricsBroadcaster()
