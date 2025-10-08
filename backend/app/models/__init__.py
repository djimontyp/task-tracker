"""SQLModel models for the application."""
from .agent_config import (
    AgentConfig,
    AgentConfigCreate,
    AgentConfigPublic,
    AgentConfigUpdate,
)
from .agent_task_assignment import (
    AgentTaskAssignment,
    AgentTaskAssignmentCreate,
    AgentTaskAssignmentPublic,
)
from .base import IDMixin, TimestampMixin
from .enums import TaskCategory, TaskPriority, TaskStatus, SourceType
from .legacy import (
    MessageCreate,
    MessagePublic,
    MessageUpdate,
    Source,
    SourceCreate,
    SourcePublic,
    SourceUpdate,
    Task,
    TaskCreate,
    TaskPublic,
    WebhookSettings,
    WebhookSettingsCreate,
    WebhookSettingsPublic,
    WebhookSettingsUpdate,
)
from .message import Message
from .telegram_profile import TelegramProfile
from .user import User
from .llm_provider import (
    LLMProvider,
    LLMProviderCreate,
    LLMProviderPublic,
    LLMProviderUpdate,
    ProviderType,
    ValidationStatus,
)
from .task_config import TaskConfig, TaskConfigCreate, TaskConfigPublic, TaskConfigUpdate
from .message_ingestion import (
    MessageIngestionJob,
    MessageIngestionJobCreate,
    MessageIngestionJobPublic,
    IngestionStatus,
)

__all__ = [
    # Base
    "IDMixin",
    "TimestampMixin",
    # Enums
    "TaskStatus",
    "TaskCategory",
    "TaskPriority",
    "SourceType",
    # Legacy
    "Source",
    "SourceCreate",
    "SourcePublic",
    "SourceUpdate",
    "Message",
    "MessageCreate",
    "MessagePublic",
    "MessageUpdate",
    "Task",
    "TaskCreate",
    "TaskPublic",
    "TaskUpdate",
    "WebhookSettings",
    "WebhookSettingsCreate",
    "WebhookSettingsPublic",
    "WebhookSettingsUpdate",
    # User & Profiles
    "User",
    "TelegramProfile",
    # LLM Provider
    "LLMProvider",
    "LLMProviderCreate",
    "LLMProviderPublic",
    "LLMProviderUpdate",
    "ProviderType",
    "ValidationStatus",
    # Task Config
    "TaskConfig",
    "TaskConfigCreate",
    "TaskConfigPublic",
    # Message Ingestion
    "MessageIngestionJob",
    "MessageIngestionJobCreate",
    "MessageIngestionJobPublic",
    "IngestionStatus",
    # Agent Config
    "AgentConfig",
    "AgentConfigCreate",
    "AgentConfigPublic",
    "AgentConfigUpdate",
    # Agent Task Assignment
    "AgentTaskAssignment",
    "AgentTaskAssignmentCreate",
    "AgentTaskAssignmentPublic",
]
