"""Models package - new agent management + legacy models."""

# New agent management models
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
from .llm_provider import (
    LLMProvider,
    LLMProviderCreate,
    LLMProviderPublic,
    LLMProviderUpdate,
    ProviderType,
    ValidationStatus,
)
from .task_config import TaskConfig, TaskConfigCreate, TaskConfigPublic, TaskConfigUpdate

# Base classes and enums
from .base import IDMixin, TimestampMixin
from .enums import TaskStatus, TaskCategory, TaskPriority, SourceType

# Legacy models (old task tracker models)
from .legacy import (
    Source,
    SourceCreate,
    SourcePublic,
    SourceUpdate,
    Message,
    MessageCreate,
    MessagePublic,
    MessageUpdate,
    Task,
    TaskCreate,
    TaskPublic,
    TaskUpdate,
    WebhookSettings,
    WebhookSettingsCreate,
    WebhookSettingsPublic,
    WebhookSettingsUpdate,
    SimpleSource,
    SimpleMessage,
    SimpleTask,
)

__all__ = [
    # New models
    "AgentConfig",
    "AgentConfigCreate",
    "AgentConfigPublic",
    "AgentConfigUpdate",
    "LLMProvider",
    "LLMProviderCreate",
    "LLMProviderPublic",
    "LLMProviderUpdate",
    "ProviderType",
    "ValidationStatus",
    "TaskConfig",
    "TaskConfigCreate",
    "TaskConfigPublic",
    "TaskConfigUpdate",
    "AgentTaskAssignment",
    "AgentTaskAssignmentCreate",
    "AgentTaskAssignmentPublic",
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
    "SimpleSource",
    "SimpleMessage",
    "SimpleTask",
]
