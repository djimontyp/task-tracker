from fastapi import APIRouter

from . import (
    agents,
    analysis,
    analysis_runs,
    assignments,
    atoms,
    embeddings,
    experiments,
    health,
    ingestion,
    knowledge,
    messages,
    noise,
    projects,
    proposals,
    providers,
    semantic_search,
    stats,
    task_configs,
    tasks,
    topics,
    users,
    versions,
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
api_router.include_router(experiments.router)
api_router.include_router(embeddings.router)
api_router.include_router(semantic_search.router)
api_router.include_router(noise.router)
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
api_router.include_router(versions.router)
