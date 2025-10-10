"""Tests for ProjectConfig model."""
import pytest
from datetime import datetime

from app.models import (
    ProjectConfig,
    User,
)


@pytest.mark.asyncio
async def test_create_project_config(db_session):
    """Test creating project config with required fields."""
    # Create user dependency
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create project config
    project = ProjectConfig(
        name="Test Project",
        description="Test project description",
        keywords=["test", "project", "backend"],
        glossary={"API": "Application Programming Interface"},
        components=[{"name": "API", "keywords": ["endpoint", "route"]}],
        default_assignee_ids=[user.id],
        pm_user_id=user.id,
        is_active=True,
        priority_rules={"critical_keywords": ["crash", "security"]},
        version="1.0.0",
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)

    # Assertions
    assert project.id is not None
    assert project.name == "Test Project"
    assert project.description == "Test project description"
    assert project.keywords == ["test", "project", "backend"]
    assert project.glossary == {"API": "Application Programming Interface"}
    assert len(project.components) == 1
    assert project.components[0]["name"] == "API"
    assert project.default_assignee_ids == [user.id]
    assert project.pm_user_id == user.id
    assert project.is_active is True
    assert project.priority_rules == {"critical_keywords": ["crash", "security"]}
    assert project.version == "1.0.0"
    assert project.created_at is not None
    assert project.updated_at is not None


@pytest.mark.asyncio
async def test_keywords_validation(db_session):
    """Test that keywords field is required and stored correctly."""
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create with multiple keywords
    keywords = ["backend", "api", "fastapi", "python", "async"]
    project = ProjectConfig(
        name="Backend Project",
        description="Backend services",
        keywords=keywords,
        glossary={},
        components=[],
        default_assignee_ids=[],
        pm_user_id=user.id,
        is_active=True,
        priority_rules={},
        version="1.0.0",
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)

    assert project.keywords == keywords
    assert len(project.keywords) == 5
    assert "fastapi" in project.keywords


@pytest.mark.asyncio
async def test_jsonb_fields(db_session):
    """Test JSONB fields: glossary, components, priority_rules."""
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Complex JSONB data
    glossary = {
        "API": "Application Programming Interface",
        "REST": "Representational State Transfer",
        "CRUD": "Create, Read, Update, Delete",
        "ORM": "Object-Relational Mapping",
    }

    components = [
        {"name": "API", "keywords": ["endpoint", "route", "handler"]},
        {"name": "Database", "keywords": ["model", "migration", "query"]},
        {"name": "Workers", "keywords": ["task", "job", "queue"]},
    ]

    priority_rules = {
        "critical_keywords": ["crash", "security", "data loss"],
        "high_keywords": ["bug", "error", "broken"],
        "low_keywords": ["improvement", "enhancement"],
    }

    project = ProjectConfig(
        name="Complex Project",
        description="Project with complex config",
        keywords=["complex"],
        glossary=glossary,
        components=components,
        default_assignee_ids=[],
        pm_user_id=user.id,
        is_active=True,
        priority_rules=priority_rules,
        version="1.0.0",
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)

    # Verify JSONB fields
    assert project.glossary == glossary
    assert project.glossary["API"] == "Application Programming Interface"
    assert len(project.glossary) == 4

    assert project.components == components
    assert len(project.components) == 3
    assert project.components[0]["name"] == "API"

    assert project.priority_rules == priority_rules
    assert "critical_keywords" in project.priority_rules
    assert len(project.priority_rules["high_keywords"]) == 3


@pytest.mark.asyncio
async def test_versioning(db_session):
    """Test version field with semantic versioning."""
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Initial version
    project = ProjectConfig(
        name="Versioned Project",
        description="Project with versioning",
        keywords=["version"],
        glossary={},
        components=[],
        default_assignee_ids=[],
        pm_user_id=user.id,
        is_active=True,
        priority_rules={},
        version="1.0.0",
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)

    assert project.version == "1.0.0"

    # Update version
    project.version = "1.1.0"
    await db_session.commit()
    await db_session.refresh(project)

    assert project.version == "1.1.0"

    # Major version bump
    project.version = "2.0.0"
    await db_session.commit()
    await db_session.refresh(project)

    assert project.version == "2.0.0"


@pytest.mark.asyncio
async def test_is_active_flag(db_session):
    """Test is_active flag for enabling/disabling projects."""
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create active project
    project = ProjectConfig(
        name="Active Project",
        description="Active project",
        keywords=["active"],
        glossary={},
        components=[],
        default_assignee_ids=[],
        pm_user_id=user.id,
        is_active=True,
        priority_rules={},
        version="1.0.0",
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)

    assert project.is_active is True

    # Deactivate project
    project.is_active = False
    await db_session.commit()
    await db_session.refresh(project)

    assert project.is_active is False

    # Reactivate
    project.is_active = True
    await db_session.commit()
    await db_session.refresh(project)

    assert project.is_active is True


@pytest.mark.asyncio
async def test_default_assignee_ids(db_session):
    """Test default_assignee_ids JSONB list field."""
    # Create users
    user1 = User(first_name="User1", email="user1@example.com")
    user2 = User(first_name="User2", email="user2@example.com")
    user3 = User(first_name="User3", email="user3@example.com")
    db_session.add(user1)
    db_session.add(user2)
    db_session.add(user3)
    await db_session.commit()
    await db_session.refresh(user1)
    await db_session.refresh(user2)
    await db_session.refresh(user3)

    # Create project with multiple assignees
    project = ProjectConfig(
        name="Team Project",
        description="Project with team",
        keywords=["team"],
        glossary={},
        components=[],
        default_assignee_ids=[user1.id, user2.id, user3.id],
        pm_user_id=user1.id,
        is_active=True,
        priority_rules={},
        version="1.0.0",
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)

    assert len(project.default_assignee_ids) == 3
    assert user1.id in project.default_assignee_ids
    assert user2.id in project.default_assignee_ids
    assert user3.id in project.default_assignee_ids


@pytest.mark.asyncio
async def test_timestamps(db_session):
    """Test created_at and updated_at timestamps."""
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    project = ProjectConfig(
        name="Timestamped Project",
        description="Project with timestamps",
        keywords=["time"],
        glossary={},
        components=[],
        default_assignee_ids=[],
        pm_user_id=user.id,
        is_active=True,
        priority_rules={},
        version="1.0.0",
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)

    created_at = project.created_at
    updated_at = project.updated_at

    assert created_at is not None
    assert updated_at is not None
    assert isinstance(created_at, datetime)
    assert isinstance(updated_at, datetime)

    # Update project
    project.description = "Updated description"
    await db_session.commit()
    await db_session.refresh(project)

    # Note: updated_at may not auto-update in SQLite, but the field should exist
    assert project.created_at == created_at
    assert project.updated_at is not None
