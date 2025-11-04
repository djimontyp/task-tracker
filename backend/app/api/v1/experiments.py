"""API endpoints for classification experiments."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import (
    ClassificationExperiment,
    ExperimentCreate,
    ExperimentDetailPublic,
    ExperimentListResponse,
    ExperimentPublic,
    ExperimentStatus,
)
from app.services.topic_classification_service import TopicClassificationService

# TODO: Re-implement execute_classification_experiment task
# from app.tasks import execute_classification_experiment

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/experiments/topic-classification",
    tags=["experiments"],
)


@router.post(
    "",
    response_model=ExperimentPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create classification experiment",
    description="""
    Create a new topic classification experiment to evaluate LLM accuracy.

    The experiment will classify a specified number of messages using the provided
    LLM provider and model, then calculate accuracy metrics and confusion matrix.

    The experiment is executed asynchronously in the background. Use WebSocket
    topic 'experiments' to receive real-time progress updates.

    **WebSocket Events:**
    - `experiment_started`: Experiment begins processing
    - `experiment_progress`: Classification progress (every 10 messages)
    - `experiment_completed`: Experiment finished successfully
    - `experiment_failed`: Experiment failed with error

    **Requirements:**
    - Provider must exist and be active
    - At least `message_count` messages with assigned topics must exist in the database
    """,
)
async def create_experiment(
    experiment_data: ExperimentCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ExperimentPublic:
    """Create and trigger a new classification experiment.

    Args:
        experiment_data: Experiment configuration (provider_id, model_name, message_count)
        session: Database session

    Returns:
        Created experiment record (status=pending)

    Raises:
        404: Provider not found
        400: Provider not active or insufficient messages
        500: Unexpected error during creation
    """
    try:
        service = TopicClassificationService(session)
        experiment = await service.run_experiment(
            provider_id=experiment_data.provider_id,
            model_name=experiment_data.model_name,
            message_count=experiment_data.message_count,
        )

        # TODO: Re-implement execute_classification_experiment task after nuclear cleanup
        # await execute_classification_experiment.kiq(experiment.id)
        logger.warning(f"Created experiment {experiment.id} but NOT executed (task removed in nuclear cleanup)")

        return ExperimentPublic.model_validate(experiment)

    except ValueError as e:
        logger.warning(f"Invalid experiment request: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to create experiment: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create experiment: {str(e)}",
        )


@router.get(
    "",
    response_model=ExperimentListResponse,
    summary="List classification experiments",
    description="""
    Retrieve paginated list of classification experiments with optional filtering.

    Results are sorted by creation date (newest first).

    **Filters:**
    - `status`: Filter by experiment status (pending/running/completed/failed)

    **Pagination:**
    - Default: 50 experiments per page
    - Maximum: 100 experiments per page
    """,
)
async def list_experiments(
    session: Annotated[AsyncSession, Depends(get_session)],
    skip: Annotated[int, Query(ge=0, description="Number of experiments to skip")] = 0,
    limit: Annotated[int, Query(ge=1, le=100, description="Max experiments to return")] = 50,
    status_filter: Annotated[
        ExperimentStatus | None,
        Query(alias="status", description="Filter by experiment status"),
    ] = None,
) -> ExperimentListResponse:
    """List experiments with pagination and optional status filter.

    Args:
        session: Database session
        skip: Number of experiments to skip (offset)
        limit: Maximum number of experiments to return
        status_filter: Optional experiment status filter

    Returns:
        Paginated list of experiments
    """
    try:
        query = select(ClassificationExperiment).order_by(ClassificationExperiment.created_at.desc())

        if status_filter:
            query = query.where(ClassificationExperiment.status == status_filter)

        total_result = await session.execute(select(func.count()).select_from(query.subquery()))
        total = total_result.scalar_one()

        result = await session.execute(query.offset(skip).limit(limit))
        experiments = result.scalars().all()

        return ExperimentListResponse(
            items=[ExperimentPublic.model_validate(exp) for exp in experiments],
            total=total,
            page=skip // limit + 1,
            page_size=limit,
        )

    except Exception as e:
        logger.error(f"Failed to list experiments: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve experiments: {str(e)}",
        )


@router.get(
    "/{experiment_id}",
    response_model=ExperimentDetailPublic,
    summary="Get experiment details",
    description="""
    Retrieve detailed information about a specific classification experiment.

    Includes:
    - Experiment configuration and metrics
    - Confusion matrix showing actual vs predicted topics
    - Detailed per-message classification results

    Use this endpoint to analyze experiment results and identify classification patterns.
    """,
)
async def get_experiment(
    experiment_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ExperimentDetailPublic:
    """Get detailed experiment results including confusion matrix.

    Args:
        experiment_id: Experiment ID
        session: Database session

    Returns:
        Detailed experiment data with classification results

    Raises:
        404: Experiment not found
        500: Unexpected error during retrieval
    """
    try:
        experiment = await session.get(ClassificationExperiment, experiment_id)

        if not experiment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Experiment {experiment_id} not found",
            )

        return ExperimentDetailPublic.model_validate(experiment)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get experiment {experiment_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve experiment: {str(e)}",
        )


@router.delete(
    "/{experiment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete experiment",
    description="""
    Delete a classification experiment and all associated results.

    This operation is irreversible. Experiment data including classification
    results and confusion matrix will be permanently removed.

    **Note:** Cannot delete experiments that are currently running (status=running).
    """,
)
async def delete_experiment(
    experiment_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> None:
    """Delete an experiment.

    Args:
        experiment_id: Experiment ID to delete
        session: Database session

    Raises:
        404: Experiment not found
        400: Cannot delete running experiment
        500: Unexpected error during deletion
    """
    try:
        experiment = await session.get(ClassificationExperiment, experiment_id)

        if not experiment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Experiment {experiment_id} not found",
            )

        if experiment.status == ExperimentStatus.running:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete experiment that is currently running",
            )

        await session.delete(experiment)
        await session.commit()

        logger.info(f"Deleted experiment {experiment_id}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete experiment {experiment_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete experiment: {str(e)}",
        )
