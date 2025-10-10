"""API tests for ProjectConfig endpoints.

Tests CRUD operations and validation:
- Create, read, update, delete
- Keywords validation
- Version increments
- Name uniqueness
"""
import pytest
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from app.models import User, ProjectConfig


@pytest.mark.asyncio
async def test_list_projects(client, db_session):
    """Test GET /api/projects - list projects with pagination."""
    # Create user
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create projects
    for i in range(5):
        project = ProjectConfig(
            name=f"Project {i}",
            description=f"Description {i}",
            keywords=[f"keyword{i}"],
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

    # Test list
    response = await client.get("/api/projects")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5


@pytest.mark.asyncio
async def test_create_project(client, db_session):
    """Test POST /api/projects - create new project."""
    # Create user
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Mock WebSocket manager
    with patch("app.api.v1.projects.websocket_manager", AsyncMock()):
        # Create project
        project_data = {
            "name": "Test Project",
            "description": "Test project description",
            "keywords": ["test", "project"],
            "glossary": {"API": "Application Programming Interface"},
            "components": [{"name": "API", "keywords": ["endpoint"]}],
            "default_assignee_ids": [user.id],
            "pm_user_id": user.id,
            "is_active": True,
            "priority_rules": {"critical_keywords": ["crash"]},
            "version": "1.0.0",
        }
        response = await client.post("/api/projects", json=project_data)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Project"
        assert data["keywords"] == ["test", "project"]
        assert data["version"] == "1.0.0"


@pytest.mark.asyncio
async def test_keywords_validation(client, db_session):
    """Test that keywords must be non-empty."""
    # Create user
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Mock WebSocket manager
    with patch("app.api.v1.projects.websocket_manager", AsyncMock()):
        # Try to create project with empty keywords
        project_data = {
            "name": "Invalid Project",
            "description": "Project with empty keywords",
            "keywords": [],  # Empty!
            "glossary": {},
            "components": [],
            "default_assignee_ids": [],
            "pm_user_id": user.id,
            "is_active": True,
            "priority_rules": {},
            "version": "1.0.0",
        }
        response = await client.post("/api/projects", json=project_data)
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_project(client, db_session):
    """Test PUT /api/projects/{id} - update project."""
    # Create user
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create project
    project = ProjectConfig(
        name="Original Project",
        description="Original description",
        keywords=["original"],
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

    # Mock WebSocket manager
    with patch("app.api.v1.projects.websocket_manager", AsyncMock()):
        # Update project
        update_data = {
            "description": "Updated description",
            "keywords": ["updated", "keywords"],
        }
        response = await client.put(f"/api/projects/{project.id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "Updated description"
        assert data["keywords"] == ["updated", "keywords"]
        # Version should increment (keywords changed)
        assert data["version"] == "1.1.0"


@pytest.mark.asyncio
async def test_version_increments(client, db_session):
    """Test that version increments when config changes."""
    # Create user
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create project
    project = ProjectConfig(
        name="Versioned Project",
        description="Test versioning",
        keywords=["test"],
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

    # Mock WebSocket manager
    with patch("app.api.v1.projects.websocket_manager", AsyncMock()):
        # Update keywords (should increment version)
        response = await client.put(
            f"/api/projects/{project.id}",
            json={"keywords": ["test", "new"]}
        )
        assert response.status_code == 200
        assert response.json()["version"] == "1.1.0"

        # Update glossary (should increment version again)
        response = await client.put(
            f"/api/projects/{project.id}",
            json={"glossary": {"term": "definition"}}
        )
        assert response.status_code == 200
        assert response.json()["version"] == "1.2.0"


@pytest.mark.asyncio
async def test_delete_project(client, db_session):
    """Test DELETE /api/projects/{id} - delete project."""
    # Create user
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create project
    project = ProjectConfig(
        name="Delete Me",
        description="Will be deleted",
        keywords=["delete"],
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

    # Mock WebSocket manager
    with patch("app.api.v1.projects.websocket_manager", AsyncMock()):
        # Delete project
        response = await client.delete(f"/api/projects/{project.id}")
        assert response.status_code == 204

    # Verify project deleted
    response = await client.get(f"/api/projects/{project.id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_name_uniqueness(client, db_session):
    """Test that project names must be unique."""
    # Create user
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create first project
    project1 = ProjectConfig(
        name="Unique Name",
        description="First project",
        keywords=["test"],
        glossary={},
        components=[],
        default_assignee_ids=[],
        pm_user_id=user.id,
        is_active=True,
        priority_rules={},
        version="1.0.0",
    )
    db_session.add(project1)
    await db_session.commit()

    # Mock WebSocket manager
    with patch("app.api.v1.projects.websocket_manager", AsyncMock()):
        # Try to create second project with same name
        project_data = {
            "name": "Unique Name",  # Duplicate!
            "description": "Second project",
            "keywords": ["test"],
            "glossary": {},
            "components": [],
            "default_assignee_ids": [],
            "pm_user_id": user.id,
            "is_active": True,
            "priority_rules": {},
            "version": "1.0.0",
        }
        response = await client.post("/api/projects", json=project_data)
        assert response.status_code == 409  # Conflict
        assert "already exists" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_project_by_id(client, db_session):
    """Test GET /api/projects/{id} - get project details."""
    # Create user
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create project
    project = ProjectConfig(
        name="Detail Project",
        description="Project with details",
        keywords=["detail", "test"],
        glossary={"API": "Application Programming Interface"},
        components=[{"name": "API", "keywords": ["endpoint"]}],
        default_assignee_ids=[user.id],
        pm_user_id=user.id,
        is_active=True,
        priority_rules={"critical_keywords": ["crash"]},
        version="1.0.0",
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)

    # Get project
    response = await client.get(f"/api/projects/{project.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(project.id)
    assert data["name"] == "Detail Project"
    assert data["keywords"] == ["detail", "test"]
    assert data["glossary"]["API"] == "Application Programming Interface"
    assert len(data["components"]) == 1


@pytest.mark.asyncio
async def test_filter_by_active_status(client, db_session):
    """Test filtering projects by is_active status."""
    # Create user
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create active project
    project1 = ProjectConfig(
        name="Active Project",
        description="Active",
        keywords=["active"],
        glossary={},
        components=[],
        default_assignee_ids=[],
        pm_user_id=user.id,
        is_active=True,
        priority_rules={},
        version="1.0.0",
    )
    # Create inactive project
    project2 = ProjectConfig(
        name="Inactive Project",
        description="Inactive",
        keywords=["inactive"],
        glossary={},
        components=[],
        default_assignee_ids=[],
        pm_user_id=user.id,
        is_active=False,
        priority_rules={},
        version="1.0.0",
    )
    db_session.add(project1)
    db_session.add(project2)
    await db_session.commit()

    # Filter by active
    response = await client.get("/api/projects?is_active=true")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Active Project"

    # Filter by inactive
    response = await client.get("/api/projects?is_active=false")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Inactive Project"


@pytest.mark.asyncio
async def test_pagination(client, db_session):
    """Test pagination with skip and limit."""
    # Create user
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create 10 projects
    for i in range(10):
        project = ProjectConfig(
            name=f"Project {i}",
            description=f"Description {i}",
            keywords=[f"keyword{i}"],
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

    # Get first 5
    response = await client.get("/api/projects?skip=0&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5

    # Get next 5
    response = await client.get("/api/projects?skip=5&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5


@pytest.mark.asyncio
async def test_project_not_found(client, db_session):
    """Test GET /api/projects/{id} with non-existent ID."""
    random_id = uuid4()
    response = await client.get(f"/api/projects/{random_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
