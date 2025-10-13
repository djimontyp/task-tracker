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
from .analysis_run import (
    AnalysisRun,
    AnalysisRunCreate,
    AnalysisRunListResponse,
    AnalysisRunPublic,
    AnalysisRunUpdate,
)
from .base import IDMixin, TimestampMixin
from .enums import (
    AnalysisRunStatus,
    AnalysisStatus,
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
    ProviderType,
    ValidationStatus,
)
from .message import Message
from .message_ingestion import (
    IngestionStatus,
    MessageIngestionJob,
    MessageIngestionJobCreate,
    MessageIngestionJobPublic,
)
from .project_config import (
    ProjectConfig,
    ProjectConfigCreate,
    ProjectConfigListResponse,
    ProjectConfigPublic,
    ProjectConfigUpdate,
)
from .task_config import TaskConfig, TaskConfigCreate, TaskConfigPublic, TaskConfigUpdate
from .task_entity import TaskEntity, TaskEntityPublic
from .task_proposal import (
    TaskProposal,
    TaskProposalCreate,
    TaskProposalListResponse,
    TaskProposalPublic,
    TaskProposalUpdate,
)
from .telegram_profile import TelegramProfile
from .topic import (
    ICON_COLORS,
    TOPIC_ICONS,
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
from .atom import (
    Atom,
    AtomCreate,
    AtomUpdate,
    AtomPublic,
    AtomListResponse,
    AtomLink,
    AtomLinkCreate,
    AtomLinkPublic,
    TopicAtom,
    TopicAtomCreate,
    TopicAtomPublic,
    AtomType,
    LinkType,
)
from .user import User

__all__ = [
    # Base
    "IDMixin",
    "TimestampMixin",
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
    "AgentTaskAssignmentWithDetails",
    # Analysis Run
    "AnalysisRun",
    "AnalysisRunCreate",
    "AnalysisRunListResponse",
    "AnalysisRunPublic",
    "AnalysisRunUpdate",
    # Task Proposal
    "TaskProposal",
    "TaskProposalCreate",
    "TaskProposalPublic",
    "TaskProposalUpdate",
    # Project Config
    "ProjectConfig",
    "ProjectConfigCreate",
    "ProjectConfigPublic",
    "ProjectConfigUpdate",
    "ProjectConfigListResponse",
    # Task Entity (Phase 2 placeholder)
    "TaskEntity",
    "TaskEntityPublic",
    # Topic
    "Topic",
    "TopicCreate",
    "TopicUpdate",
    "TopicPublic",
    "TopicListResponse",
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
    # List Responses
    "TaskProposalListResponse",
]
