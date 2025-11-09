"""API endpoints for dashboard metrics."""

from fastapi import APIRouter

from app.dependencies import DatabaseDep
from app.schemas.metrics import DashboardMetricsResponse
from app.services.metrics_broadcaster import metrics_broadcaster

router = APIRouter(tags=["metrics"])


@router.get(
    "/dashboard",
    response_model=DashboardMetricsResponse,
    summary="Get dashboard metrics",
    response_description="Key metrics for admin dashboard",
)
async def get_dashboard_metrics(
    db: DatabaseDep,
) -> DashboardMetricsResponse:
    """Get aggregated metrics for the admin dashboard.

    Returns key metrics including topic quality scores, noise filtering stats,
    classification accuracy, and active analysis runs.

    **Use Cases:**
    - Display system health on admin dashboard
    - Monitor key performance indicators
    - Track trends over time

    **Returns:**
    - Topic quality score (0-100)
    - Noise ratio (percentage)
    - Classification accuracy (percentage)
    - Active analysis runs count
    - Trend data for each metric

    **Example:**
    ```
    GET / api / v1 / metrics / dashboard
    ```
    """
    # Use the broadcaster's calculation method for consistency
    return await metrics_broadcaster._calculate_metrics(db)
