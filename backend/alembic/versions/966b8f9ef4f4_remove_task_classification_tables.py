"""remove_task_classification_tables

Revision ID: 966b8f9ef4f4
Revises: 7e33421d5aa3
Create Date: 2025-11-04 23:59:16.167314

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "966b8f9ef4f4"
down_revision: Union[str, Sequence[str], None] = "7e33421d5aa3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Remove task classification tables.

    Drop order respects foreign key constraints:
    1. task_proposals (FK to analysis_runs)
    2. task_entities (independent or FK to proposals)
    3. task_execution_logs (FK to task_entities)
    4. failed_tasks (independent)
    5. analysis_runs (referenced by proposals)
    """
    # Drop tables in correct order (children first, then parents)
    op.drop_table("task_proposals")
    op.drop_table("task_execution_logs")
    op.drop_table("task_entities")
    op.drop_table("failed_tasks")
    op.drop_table("analysis_runs")


def downgrade() -> None:
    """Downgrade schema (not implemented - data loss is permanent)."""
    raise NotImplementedError(
        "Cannot recreate task classification tables - data loss is permanent. Restore from database backup if needed."
    )
