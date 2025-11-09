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
    AgentTaskAssignmentWithDetails,
)
from .atom import (
    Atom,
    AtomCreate,
    AtomLink,
    AtomLinkCreate,
    AtomLinkPublic,
    AtomListResponse,
    AtomPublic,
    AtomType,
    AtomUpdate,
    BulkApproveRequest,
    BulkApproveResponse,
    LinkType,
    TopicAtom,
    TopicAtomCreate,
    TopicAtomPublic,
)
from .atom_version import AtomVersion, AtomVersionPublic
from .automation_rule import (
    AutomationRule,
    AutomationRuleCreate,
    AutomationRuleListResponse,
    AutomationRulePublic,
    AutomationRuleUpdate,
    LogicOperator,
    RuleAction,
)
from .base import IDMixin, TimestampMixin
from .classification_feedback import ClassificationFeedback, ClassificationFeedbackPublic
from .enums import (
    AnalysisRunStatus,
    AnalysisStatus,
    FailedTaskStatus,
    LLMRecommendation,
    ProposalStatus,
    SimilarityType,
    SourceType,
    TaskCategory,
    TaskPriority,
    TaskStatus,
)
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
from .llm_provider import (
    LLMProvider,
    LLMProviderCreate,
    LLMProviderPublic,
    LLMProviderUpdate,
    OllamaModel,
    OllamaModelsResponse,
    ProviderType,
    ValidationStatus,
)
from .message import Message
from .message_history import MessageHistory, MessageHistoryPublic
from .message_ingestion import (
    IngestionStatus,
    MessageIngestionJob,
    MessageIngestionJobCreate,
    MessageIngestionJobPublic,
)
from .notification_preference import DigestFrequency, NotificationPreference
from .project_config import (
    ProjectConfig,
    ProjectConfigCreate,
    ProjectConfigListResponse,
    ProjectConfigPublic,
    ProjectConfigUpdate,
)
from .scheduled_job import (
    JobStatus,
    ScheduledJob,
    ScheduledJobCreate,
    ScheduledJobListResponse,
    ScheduledJobPublic,
    ScheduledJobUpdate,
)
from .task_config import TaskConfig, TaskConfigCreate, TaskConfigPublic, TaskConfigUpdate
from .telegram_profile import TelegramProfile
from .topic import (
    ICON_COLORS,
    TOPIC_ICONS,
    RecentTopicItem,
    RecentTopicsResponse,
    Topic,
    TopicCreate,
    TopicListResponse,
    TopicPublic,
    TopicUpdate,
    auto_select_color,
    auto_select_icon,
    convert_to_hex_if_needed,
    validate_hex_color,
)
from .topic_version import TopicVersion, TopicVersionPublic
from .user import User

__all__ = [
    # Base
    "IDMixin",
    "TimestampMixin",
    # Message History & Feedback
    "MessageHistory",
    "MessageHistoryPublic",
    "ClassificationFeedback",
    "ClassificationFeedbackPublic",
    # Automation Rules
    "AutomationRule",
    "AutomationRuleCreate",
    "AutomationRuleUpdate",
    "AutomationRulePublic",
    "AutomationRuleListResponse",
    "RuleAction",
    "LogicOperator",
    # Scheduled Jobs
    "ScheduledJob",
    "ScheduledJobCreate",
    "ScheduledJobUpdate",
    "ScheduledJobPublic",
    "ScheduledJobListResponse",
    "JobStatus",
    # Enums
    "TaskStatus",
    "TaskCategory",
    "TaskPriority",
    "SourceType",
    "AnalysisRunStatus",
    "AnalysisStatus",
    "ProposalStatus",
    "LLMRecommendation",
    "SimilarityType",
    "ProviderType",
    "ValidationStatus",
    "IngestionStatus",
    "FailedTaskStatus",
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
    "OllamaModel",
    "OllamaModelsResponse",
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
    # Notification Preferences
    "NotificationPreference",
    "DigestFrequency",
    # Agent Config
    "AgentConfig",
    "AgentConfigCreate",
    "AgentConfigPublic",
    "AgentConfigUpdate",
    # Agent Task Assignment
    "AgentTaskAssignment",
    "AgentTaskAssignmentCreate",
    "AgentTaskAssignmentPublic",
    "AgentTaskAssignmentWithDetails",
    # Project Config
    "ProjectConfig",
    "ProjectConfigCreate",
    "ProjectConfigPublic",
    "ProjectConfigUpdate",
    "ProjectConfigListResponse",
    # Topic
    "Topic",
    "TopicCreate",
    "TopicUpdate",
    "TopicPublic",
    "TopicListResponse",
    "RecentTopicItem",
    "RecentTopicsResponse",
    "TOPIC_ICONS",
    "ICON_COLORS",
    "auto_select_icon",
    "auto_select_color",
    "convert_to_hex_if_needed",
    "validate_hex_color",
    # Atom (Zettelkasten)
    "Atom",
    "AtomCreate",
    "AtomUpdate",
    "AtomPublic",
    "AtomListResponse",
    "AtomLink",
    "AtomLinkCreate",
    "AtomLinkPublic",
    "TopicAtom",
    "TopicAtomCreate",
    "TopicAtomPublic",
    "AtomType",
    "LinkType",
    "BulkApproveRequest",
    "BulkApproveResponse",
    # Versioning
    "TopicVersion",
    "TopicVersionPublic",
    "AtomVersion",
    "AtomVersionPublic",
]
