"""Initialize database schema from SQLModel models."""
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlmodel import create_engine, SQLModel
from app.core.config import settings

# Import all models to register them with SQLModel.metadata
from app.models.atom import Atom, AtomLink, TopicAtom
from app.models.topic import Topic
from app.models.message import Message, MessageAuthor, MessageSource
from app.models.analysis import (
    AnalysisProvider,
    AnalysisAgent,
    AnalysisTask,
    AnalysisRun,
    AnalysisProposal,
)
from app.models.atom_version import AtomVersion
from app.models.topic_version import TopicVersion
from app.models.user import User
from app.models.approval_rule import ApprovalRule
from app.models.message_ingestion import MessageIngestionJob
from app.models.scheduled_job import ScheduledJob
from app.models.automation_rule import AutomationRule
from app.models.notification_preference import NotificationPreference
from app.models.task_execution_log import TaskExecutionLog
from app.models.failed_task import FailedTask
from app.models.legacy import Source as LegacySource, Task as LegacyTask


def init_db() -> None:
    """Create all tables from SQLModel metadata."""
    print("Creating database schema from SQLModel models...")

    # Create engine
    engine = create_engine(
        str(settings.DATABASE_URL),
        echo=True,
        connect_args={"connect_timeout": 30, "command_timeout": 30},
    )

    # Create all tables
    SQLModel.metadata.create_all(engine)

    print("✅ Database schema created successfully!")
    print(f"Tables created: {len(SQLModel.metadata.tables)}")

    # List tables
    print("\nTables:")
    for table_name in sorted(SQLModel.metadata.tables.keys()):
        print(f"  - {table_name}")


if __name__ == "__main__":
    init_db()
