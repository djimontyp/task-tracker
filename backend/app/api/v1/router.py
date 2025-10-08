from fastapi import APIRouter

from . import analysis, health, messages, stats, tasks, users, webhooks, ingestion

api_router = APIRouter(prefix="/api")

api_router.include_router(health.router)
api_router.include_router(users.router)
api_router.include_router(messages.router)
api_router.include_router(tasks.router)
api_router.include_router(stats.router)
api_router.include_router(webhooks.router)
api_router.include_router(ingestion.router)
api_router.include_router(analysis.router)
