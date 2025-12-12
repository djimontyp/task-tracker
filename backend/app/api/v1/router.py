from fastapi import APIRouter

from app.api.v1 import (
    agents,
    assignments,
    atoms,
    automation,
    dashboard,
    embeddings,
    health,
    ingestion,
    knowledge,
    messages,
    metrics,
    noise,
    projects,
    prompts,
    providers,
    scheduler,
    search,
    semantic_search,
    stats,
    task_configs,
    topics,
    users,
    versions,
    webhooks,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router)
api_router.include_router(dashboard.router)
api_router.include_router(users.router)
api_router.include_router(messages.router)
api_router.include_router(stats.router)
api_router.include_router(webhooks.router)
api_router.include_router(ingestion.router)
api_router.include_router(projects.router, tags=["projects"])
api_router.include_router(providers.router)
api_router.include_router(agents.router)
api_router.include_router(task_configs.router)
api_router.include_router(assignments.router)
api_router.include_router(topics.router)
api_router.include_router(atoms.router)
api_router.include_router(embeddings.router)
api_router.include_router(semantic_search.router)
api_router.include_router(search.router)
api_router.include_router(noise.router)
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
api_router.include_router(versions.router)
api_router.include_router(scheduler.router)
api_router.include_router(automation.router)
api_router.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
api_router.include_router(prompts.router)
