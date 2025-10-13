"""convert topic colors to hex format

Revision ID: d00f35446ee4
Revises: 750874da2155
Create Date: 2025-10-12 18:32:46.637783

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d00f35446ee4"
down_revision: Union[str, Sequence[str], None] = "750874da2155"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Tailwind color names to hex mapping for migration
    TAILWIND_TO_HEX = {
        "blue": "#3B82F6",
        "emerald": "#10B981",
        "amber": "#F59E0B",
        "purple": "#A855F7",
        "rose": "#F43F5E",
        "green": "#22C55E",
        "cyan": "#06B6D4",
        "sky": "#0EA5E9",
        "violet": "#8B5CF6",
        "orange": "#F97316",
        "indigo": "#6366F1",
        "pink": "#EC4899",
        "teal": "#14B8A6",
        "red": "#EF4444",
        "slate": "#64748B",
        "fuchsia": "#D946EF",
    }

    # Convert existing Tailwind color names to hex codes
    for tailwind_name, hex_code in TAILWIND_TO_HEX.items():
        op.execute(f"UPDATE topics SET color = '{hex_code}' WHERE color = '{tailwind_name}'")

    # Update any existing hex codes to uppercase format
    op.execute("UPDATE topics SET color = UPPER(color) WHERE color LIKE '#%'")

    # Ensure all hex codes are in the correct format
    op.execute("UPDATE topics SET color = '#' || color WHERE color NOT LIKE '#%' AND LENGTH(color) = 6")


def downgrade() -> None:
    """Downgrade schema."""
    # Hex to Tailwind color mapping for rollback
    HEX_TO_TAILWIND = {
        "#3B82F6": "blue",
        "#10B981": "emerald",
        "#F59E0B": "amber",
        "#A855F7": "purple",
        "#F43F5E": "rose",
        "#22C55E": "green",
        "#06B6D4": "cyan",
        "#0EA5E9": "sky",
        "#8B5CF6": "violet",
        "#F97316": "orange",
        "#6366F1": "indigo",
        "#EC4899": "pink",
        "#14B8A6": "teal",
        "#EF4444": "red",
        "#64748B": "slate",
        "#D946EF": "fuchsia",
    }

    # Convert hex codes back to Tailwind color names
    for hex_code, tailwind_name in HEX_TO_TAILWIND.items():
        op.execute(f"UPDATE topics SET color = '{tailwind_name}' WHERE UPPER(color) = '{hex_code}'")
