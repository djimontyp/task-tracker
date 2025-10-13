"""Topic model for organizing messages and tasks into categories."""

import re

from pydantic import field_validator
from sqlalchemy import Text
from sqlmodel import Field, SQLModel

from .base import IDMixin, TimestampMixin

TOPIC_ICONS = {
    "shopping": "ShoppingCartIcon",
    "purchase": "ShoppingCartIcon",
    "brainstorm": "LightBulbIcon",
    "creative": "LightBulbIcon",
    "innovation": "LightBulbIcon",
    "learning": "AcademicCapIcon",
    "education": "AcademicCapIcon",
    "training": "AcademicCapIcon",
    "fitness": "HeartIcon",
    "wellness": "HeartIcon",
    "medical": "HeartIcon",
    "finance": "CurrencyDollarIcon",
    "budget": "CurrencyDollarIcon",
    "investment": "CurrencyDollarIcon",
    "apartment": "HomeIcon",
    "vacation": "GlobeAltIcon",
    "journey": "GlobeAltIcon",
    "meeting": "CalendarIcon",
    "calendar": "CalendarIcon",
    "schedule": "CalendarIcon",
    "reading": "BookOpenIcon",
    "literature": "BookOpenIcon",
    "programming": "CodeBracketIcon",
    "development": "CodeBracketIcon",
    "software": "CodeBracketIcon",
    "code review": "CodeBracketIcon",
    "office": "BriefcaseIcon",
    "career": "BriefcaseIcon",
    "private": "UserIcon",
    "buy": "ShoppingCartIcon",
    "store": "ShoppingCartIcon",
    "ideas": "LightBulbIcon",
    "study": "AcademicCapIcon",
    "course": "AcademicCapIcon",
    "health": "HeartIcon",
    "money": "CurrencyDollarIcon",
    "house": "HomeIcon",
    "travel": "GlobeAltIcon",
    "trip": "GlobeAltIcon",
    "project": "FolderIcon",
    "goal": "FlagIcon",
    "target": "FlagIcon",
    "objective": "FlagIcon",
    "event": "CalendarIcon",
    "book": "BookOpenIcon",
    "code": "CodeBracketIcon",
    "music": "MusicalNoteIcon",
    "audio": "MusicalNoteIcon",
    "sound": "MusicalNoteIcon",
    "task": "CheckCircleIcon",
    "todo": "CheckCircleIcon",
    "work": "BriefcaseIcon",
    "job": "BriefcaseIcon",
    "personal": "UserIcon",
    "self": "UserIcon",
    "home": "HomeIcon",
}

ICON_COLORS = {
    "BriefcaseIcon": "#3B82F6",
    "ShoppingCartIcon": "#10B981",
    "LightBulbIcon": "#F59E0B",
    "AcademicCapIcon": "#A855F7",
    "HeartIcon": "#F43F5E",
    "CurrencyDollarIcon": "#22C55E",
    "HomeIcon": "#06B6D4",
    "GlobeAltIcon": "#0EA5E9",
    "CodeBracketIcon": "#8B5CF6",
    "CalendarIcon": "#F97316",
    "BookOpenIcon": "#6366F1",
    "MusicalNoteIcon": "#EC4899",
    "CheckCircleIcon": "#14B8A6",
    "FlagIcon": "#EF4444",
    "FolderIcon": "#64748B",
    "UserIcon": "#D946EF",
}

# Tailwind color names to hex mapping for backward compatibility
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


def auto_select_icon(name: str, description: str = "") -> str:
    """
    Auto-select icon based on keywords in name/description.

    Args:
        name: Topic name
        description: Topic description

    Returns:
        Heroicon name (outline variant)
    """
    text = f"{name} {description}".lower()

    for keyword, icon in TOPIC_ICONS.items():
        if keyword in text:
            return icon

    return "FolderIcon"


def validate_hex_color(color: str) -> str:
    """
    Validate and normalize hex color format.

    Args:
        color: Color string to validate

    Returns:
        Normalized hex color in uppercase format (#RRGGBB)

    Raises:
        ValueError: If color format is invalid
    """
    if not color:
        raise ValueError("Color cannot be empty")

    # Remove # if present and convert to uppercase
    hex_color = color.upper().lstrip("#")

    # Validate hex format
    if not re.match(r"^[0-9A-F]{6}$", hex_color):
        raise ValueError(f"Invalid hex color format: {color}. Expected format: #RRGGBB")

    return f"#{hex_color}"


def convert_to_hex_if_needed(color: str) -> str:
    """
    Convert Tailwind color name to hex for backward compatibility.

    Args:
        color: Either hex color or Tailwind color name

    Returns:
        Hex color string
    """
    if not color:
        return "#64748B"  # Default slate color

    # If already hex format (with or without #), validate and return
    if color.startswith("#") or (len(color) == 6 and all(c in "0123456789ABCDEFabcdef" for c in color)):
        return validate_hex_color(color)

    # Convert Tailwind color name to hex
    hex_color = TAILWIND_TO_HEX.get(color.lower())
    if hex_color:
        return hex_color

    # Default to slate if unknown color
    return "#64748B"


def auto_select_color(icon: str) -> str:
    """
    Auto-select color based on icon.

    Args:
        icon: Heroicon name

    Returns:
        Hex color code
    """
    return ICON_COLORS.get(icon, "#64748B")


class Topic(IDMixin, TimestampMixin, SQLModel, table=True):
    """Topic model for categorizing messages and tasks."""

    __tablename__ = "topics"

    name: str = Field(
        unique=True,
        index=True,
        max_length=100,
        description="Topic name (unique)",
    )
    description: str = Field(
        sa_type=Text,
        description="Topic description",
    )
    icon: str | None = Field(
        default=None,
        max_length=50,
        description="Heroicon name for UI (outline variant)",
    )
    color: str | None = Field(
        default=None,
        max_length=7,
        description="Hex color code for UI (format: #RRGGBB)",
    )


class TopicPublic(SQLModel):
    """Public schema for topic responses."""

    id: int
    name: str
    description: str
    icon: str | None
    color: str | None
    created_at: str
    updated_at: str


class TopicCreate(SQLModel):
    """Schema for creating a new topic."""

    name: str = Field(
        min_length=1,
        max_length=100,
        description="Topic name (must be unique)",
    )
    description: str = Field(
        min_length=1,
        description="Topic description",
    )
    icon: str | None = Field(
        default=None,
        max_length=50,
        description="Heroicon name (auto-selected if not provided)",
    )
    color: str | None = Field(
        default=None,
        max_length=7,
        description="Hex color code (format: #RRGGBB, auto-selected if not provided)",
    )

    @field_validator("color", mode="before")
    @classmethod
    def validate_and_convert_color(cls, v: str | None) -> str | None:
        """Validate hex color or convert Tailwind name to hex for backward compatibility."""
        if v is None:
            return None
        return convert_to_hex_if_needed(str(v))


class TopicUpdate(SQLModel):
    """Schema for updating an existing topic."""

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
        description="Topic name (must be unique)",
    )
    description: str | None = Field(
        default=None,
        min_length=1,
        description="Topic description",
    )
    icon: str | None = Field(
        default=None,
        max_length=50,
        description="Heroicon name",
    )
    color: str | None = Field(
        default=None,
        max_length=7,
        description="Hex color code (format: #RRGGBB)",
    )

    @field_validator("color", mode="before")
    @classmethod
    def validate_and_convert_color(cls, v: str | None) -> str | None:
        """Validate hex color or convert Tailwind name to hex for backward compatibility."""
        if v is None:
            return None
        return convert_to_hex_if_needed(str(v))


class TopicListResponse(SQLModel):
    """Paginated response schema for topics."""

    items: list[TopicPublic]
    total: int
    page: int
    page_size: int
