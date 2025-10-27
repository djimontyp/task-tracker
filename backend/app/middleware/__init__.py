"""Middleware modules for the application."""

from app.middleware.taskiq_logging_middleware import TaskLoggingMiddleware

__all__ = ["TaskLoggingMiddleware"]
