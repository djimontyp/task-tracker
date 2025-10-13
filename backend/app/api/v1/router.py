from fastapi import APIRouter

from . import (
    agents,
    analysis,
    analysis_runs,
    assignments,
    atoms,
    health,
    ingestion,
    messages,
    projects,
    proposals,
    providers,
    stats,
    task_configs,
    tasks,
    topics,
    users,
    webhooks,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router)
api_router.include_router(users.router)
api_router.include_router(messages.router)
api_router.include_router(tasks.router)
api_router.include_router(stats.router)
api_router.include_router(webhooks.router)
api_router.include_router(ingestion.router)
# Phase 1 API endpoints (registered before analysis.router to take precedence)
api_router.include_router(analysis_runs.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(proposals.router, prefix="/analysis")
api_router.include_router(projects.router, tags=["projects"])
# Old mock analysis endpoints (will be deprecated after Phase 2)
api_router.include_router(analysis.router)
api_router.include_router(providers.router)
api_router.include_router(agents.router)
api_router.include_router(task_configs.router)
api_router.include_router(assignments.router)
api_router.include_router(topics.router)
api_router.include_router(atoms.router)
