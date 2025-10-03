from fastapi import APIRouter

from . import health, messages, stats, tasks, webhooks

api_router = APIRouter(prefix="/api")

api_router.include_router(health.router)
api_router.include_router(messages.router)
api_router.include_router(tasks.router)
api_router.include_router(stats.router)
api_router.include_router(webhooks.router)
