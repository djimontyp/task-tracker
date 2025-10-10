from fastapi import APIRouter

from . import agents, analysis, health, messages, providers, stats, task_configs, tasks, users, webhooks, ingestion

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router)
api_router.include_router(users.router)
api_router.include_router(messages.router)
api_router.include_router(tasks.router)
api_router.include_router(stats.router)
api_router.include_router(webhooks.router)
api_router.include_router(ingestion.router)
api_router.include_router(analysis.router)
api_router.include_router(providers.router)
api_router.include_router(agents.router)
api_router.include_router(task_configs.router)
