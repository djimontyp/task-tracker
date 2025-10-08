"""API routers for agent management system."""

from .agents import router as agents_router
from .providers import router as providers_router
from .tasks import router as tasks_router

__all__ = ["agents_router", "providers_router", "tasks_router"]
