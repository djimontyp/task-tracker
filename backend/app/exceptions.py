"""Common exceptions for the application."""


class AppError(Exception):
    """Base exception for application errors."""

    pass


class NotFoundError(AppError):
    """Resource not found."""

    pass


class ConflictError(AppError):
    """Resource conflict (e.g., already approved, duplicate)."""

    pass


class LockedError(AppError):
    """Resource is locked and cannot be modified."""

    pass
