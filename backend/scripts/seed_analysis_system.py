#!/usr/bin/env python3
"""
Database seeding script for Phase 1 Analysis System.

Seeds: Sources, Users, TelegramProfiles, Messages, LLMProviders, AgentConfigs,
       TaskConfigs, AgentTaskAssignments, ProjectConfigs, MessageIngestionJobs,
       AnalysisRuns, TaskProposals, TaskEntities

Usage:
    python scripts/seed_analysis_system.py --clear                           # Clear all data
    python scripts/seed_analysis_system.py --seed                            # Seed test data
    python scripts/seed_analysis_system.py --clear --seed                    # Clear and seed
    python scripts/seed_analysis_system.py --seed --runs 5 --proposals 20   # Custom counts
"""

import argparse
import asyncio
import random
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.models import (
    AgentConfig,
    AgentTaskAssignment,
    AnalysisRun,
    AnalysisRunStatus,
    AnalysisStatus,
    IngestionStatus,
    LLMProvider,
    LLMRecommendation,
    Message,
    MessageIngestionJob,
    ProjectConfig,
    ProposalStatus,
    ProviderType,
    Source,
    SourceType,
    TaskConfig,
    TaskEntity,
    TaskProposal,
    TaskStatus,
    TelegramProfile,
    User,
    ValidationStatus,
)
from app.services.credential_encryption import CredentialEncryption
from core.config import settings
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

LLM_PROVIDERS_DATA = [
    {
        "name": "Local Ollama",
        "type": ProviderType.ollama,
        "base_url": "http://localhost:11434",
        "api_key": None,
        "is_active": True,
        "validation_status": ValidationStatus.connected,
    },
    {
        "name": "OpenAI GPT-4",
        "type": ProviderType.openai,
        "base_url": "https://api.openai.com/v1",
        "api_key": "sk-test-key-placeholder",
        "is_active": True,
        "validation_status": ValidationStatus.connected,
    },
    {
        "name": "OpenAI GPT-3.5",
        "type": ProviderType.openai,
        "base_url": "https://api.openai.com/v1",
        "api_key": "sk-test-key-placeholder-2",
        "is_active": True,
        "validation_status": ValidationStatus.pending,
    },
]

AGENT_CONFIGS_DATA = [
    {
        "name": "Task Classifier",
        "description": "Classifies messages into task categories and priorities",
        "model_name": "llama3.2",
        "system_prompt": "You are a task classification expert. Analyze messages and categorize them into bug, feature, documentation, or task.",
        "temperature": 0.7,
    },
    {
        "name": "Priority Analyzer",
        "description": "Determines task priority based on content and context",
        "model_name": "llama3.2",
        "system_prompt": "You are a priority analysis expert. Evaluate urgency and importance of tasks.",
        "temperature": 0.6,
    },
    {
        "name": "Duplicate Detector",
        "description": "Finds similar existing tasks to prevent duplicates",
        "model_name": "gpt-4",
        "system_prompt": "You are a semantic similarity expert. Identify duplicate or similar tasks.",
        "temperature": 0.5,
    },
    {
        "name": "Task Proposal Generator",
        "description": "Generates structured task proposals from message analysis",
        "model_name": "gpt-4",
        "system_prompt": "You are a product management assistant. Create well-structured task proposals from discussions.",
        "temperature": 0.7,
    },
    {
        "name": "Project Classifier",
        "description": "Assigns messages to appropriate projects based on keywords",
        "model_name": "llama3.2",
        "system_prompt": "You are a project classification expert. Match discussions to projects using keywords and context.",
        "temperature": 0.6,
    },
]

TASK_CONFIGS_DATA = [
    {
        "name": "Message Classification",
        "description": "Classify message into task category and priority",
        "response_schema": {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "category": {"type": "string", "enum": ["bug", "feature", "documentation", "task"]},
                "priority": {"type": "string", "enum": ["low", "medium", "high", "urgent", "critical"]},
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            },
            "required": ["category", "priority", "confidence"],
        },
    },
    {
        "name": "Duplicate Detection",
        "description": "Find similar existing tasks",
        "response_schema": {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "is_duplicate": {"type": "boolean"},
                "similar_task_id": {"type": "string", "format": "uuid"},
                "similarity_score": {"type": "number", "minimum": 0, "maximum": 1},
                "reasoning": {"type": "string"},
            },
            "required": ["is_duplicate", "similarity_score", "reasoning"],
        },
    },
    {
        "name": "Task Proposal Generation",
        "description": "Generate structured task proposal from messages",
        "response_schema": {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "description": {"type": "string"},
                "category": {"type": "string"},
                "priority": {"type": "string"},
                "tags": {"type": "array", "items": {"type": "string"}},
                "sub_tasks": {"type": "array", "items": {"type": "object"}},
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            },
            "required": ["title", "description", "category", "priority", "confidence"],
        },
    },
    {
        "name": "Project Classification",
        "description": "Classify message to project",
        "response_schema": {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "project_id": {"type": "string", "format": "uuid"},
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                "matched_keywords": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["confidence", "matched_keywords"],
        },
    },
]

PROJECT_CONFIGS_DATA = [
    {
        "name": "Task Tracker Backend",
        "description": "FastAPI backend, TaskIQ workers, PostgreSQL, and API endpoints",
        "keywords": ["backend", "api", "fastapi", "worker", "taskiq", "postgres", "database", "endpoint"],
        "glossary": {
            "TaskIQ": "Async task queue framework for background job processing",
            "NATS": "Message broker for distributed task queue",
            "SQLAlchemy": "Python SQL toolkit and ORM",
        },
        "components": [
            {"name": "API", "keywords": ["endpoint", "route", "handler", "rest"]},
            {"name": "Worker", "keywords": ["task", "job", "queue", "background"]},
            {"name": "Database", "keywords": ["migration", "model", "query", "schema"]},
        ],
        "priority_rules": {
            "critical_keywords": ["crash", "security", "data loss", "production down"],
            "high_keywords": ["bug", "error", "broken", "not working"],
        },
    },
    {
        "name": "React Dashboard",
        "description": "Frontend dashboard with React, TypeScript, and WebSocket integration",
        "keywords": ["frontend", "react", "dashboard", "ui", "typescript", "websocket", "component"],
        "glossary": {
            "Zustand": "Lightweight state management library",
            "React Hook Form": "Form validation library",
            "Tailwind CSS": "Utility-first CSS framework",
        },
        "components": [
            {"name": "Components", "keywords": ["component", "ui", "button", "form"]},
            {"name": "Features", "keywords": ["feature", "page", "view", "screen"]},
            {"name": "Store", "keywords": ["state", "store", "zustand", "redux"]},
        ],
        "priority_rules": {
            "critical_keywords": ["crash", "white screen", "not loading"],
            "high_keywords": ["bug", "broken ui", "styling issue"],
        },
    },
    {
        "name": "Telegram Bot",
        "description": "Telegram bot integration with aiogram 3 and webhook handling",
        "keywords": ["telegram", "bot", "aiogram", "webhook", "message", "chat"],
        "glossary": {
            "aiogram": "Modern Telegram Bot framework",
            "webhook": "HTTP callback for receiving updates",
        },
        "components": [
            {"name": "Handlers", "keywords": ["handler", "command", "callback"]},
            {"name": "Middleware", "keywords": ["middleware", "filter", "interceptor"]},
        ],
        "priority_rules": {
            "critical_keywords": ["not responding", "webhook failed"],
            "high_keywords": ["bot error", "message not sent"],
        },
    },
]

TASK_PROPOSAL_TEMPLATES = [
    {
        "title": "Fix authentication timeout on backend API",
        "description": "Users reporting session timeouts after 5 minutes. Need to implement JWT refresh token mechanism and update client-side token handling. Backend changes required in auth middleware.",
        "category": "bug",
        "priority": "high",
        "tags": ["backend", "authentication", "security"],
        "reasoning": "Multiple user reports indicate this is affecting production usage. Security-critical.",
    },
    {
        "title": "Add dark mode to dashboard",
        "description": "Implement theme switcher for dark/light modes. Use Tailwind CSS dark: variant and persist preference in localStorage. Update all component styles.",
        "category": "feature",
        "priority": "medium",
        "tags": ["frontend", "ui", "ux"],
        "reasoning": "Requested by multiple users, improves accessibility and user experience.",
    },
    {
        "title": "Optimize database query performance",
        "description": "API response times degraded during peak load. Identified N+1 query issues in task listing endpoint. Add eager loading and database indexes.",
        "category": "task",
        "priority": "high",
        "tags": ["backend", "performance", "database"],
        "reasoning": "Performance bottleneck affecting all users during business hours.",
    },
    {
        "title": "Document WebSocket API endpoints",
        "description": "Create comprehensive documentation for WebSocket events including connection flow, authentication, and message formats. Add code examples.",
        "category": "documentation",
        "priority": "medium",
        "tags": ["documentation", "websocket", "api"],
        "reasoning": "New team members and external developers need clear documentation.",
    },
    {
        "title": "Implement rate limiting for webhook endpoints",
        "description": "Add rate limiting to prevent abuse of webhook endpoints. Use Redis for distributed rate limiting. Configure limits: 100 req/min per IP.",
        "category": "feature",
        "priority": "high",
        "tags": ["backend", "security", "infrastructure"],
        "reasoning": "Security requirement to prevent abuse and DDoS attacks.",
    },
]

MESSAGE_TEMPLATES = [
    "Bug: Users can't login after last deploy. Getting 500 errors on /auth endpoint. Urgent!",
    "Feature request: Add ability to filter tasks by multiple categories at once",
    "The dashboard is loading really slow today, takes 10+ seconds. Can we optimize the queries?",
    "Documentation for the new API endpoints would be helpful for the team",
    "We need dark mode support, many users are requesting it",
    "Found a security issue with JWT token validation. Need to fix ASAP.",
    "Can we add export to CSV functionality for task reports?",
    "The WebSocket connection keeps dropping every few minutes",
    "Memory usage is growing continuously in the worker container",
    "Nice work on the last release! Dashboard looks much better now.",
    "Question: How do we handle rate limiting for the webhook endpoints?",
    "Bug report: Task priorities are not saving correctly",
    "We should refactor the message processing logic, it's getting complex",
    "Can someone review my PR for the new notification system?",
    "The Telegram bot is not responding to commands anymore",
    "Need to update dependencies to fix security vulnerabilities",
    "Feature idea: Auto-assign tasks based on keywords",
    "Database migration failed on staging, need to rollback",
    "The AI classification confidence seems low, maybe retrain the model?",
    "Great work everyone! Sprint goals achieved 🎉",
]


async def clear_data(session: AsyncSession):
    """Clear all Analysis System data."""
    print("🗑️  Clearing Analysis System data...")

    await session.execute(delete(TaskProposal))
    await session.execute(delete(TaskEntity))
    await session.execute(delete(AnalysisRun))
    await session.execute(delete(MessageIngestionJob))
    await session.execute(delete(Message))
    await session.execute(delete(TelegramProfile))
    await session.execute(delete(AgentTaskAssignment))
    await session.execute(delete(TaskConfig))
    await session.execute(delete(AgentConfig))
    await session.execute(delete(ProjectConfig))
    await session.execute(delete(LLMProvider))
    await session.execute(delete(Source))

    result = await session.execute(select(User).where(User.email.like("%@tasktracker.test")))
    test_users = result.scalars().all()
    for user in test_users:
        await session.delete(user)

    await session.commit()
    print("✅ Analysis System data cleared")


async def seed_data(
    session: AsyncSession,
    num_runs: int = 10,
    num_proposals: int = 30,
):
    """Seed Analysis System test data."""
    print(f"🌱 Seeding Analysis System: {num_runs} runs, {num_proposals} proposals...")
    encryptor = CredentialEncryption()
    now = datetime.now(UTC)

    print("  Creating PM users...")
    pm_user = User(
        first_name="Project",
        last_name="Manager",
        email="pm@tasktracker.test",
        is_active=True,
        is_bot=False,
    )
    session.add(pm_user)

    dev_user = User(
        first_name="Developer",
        last_name="User",
        email="dev@tasktracker.test",
        is_active=True,
        is_bot=False,
    )
    session.add(dev_user)
    await session.flush()
    print(f"    ✓ Created 2 users")

    print("  Creating Sources...")
    telegram_source = Source(
        name="Task Tracker Team Chat",
        type=SourceType.telegram,
        config={"chat_id": "-1002988379206", "chat_title": "Task Tracker Team"},
        is_active=True,
    )
    session.add(telegram_source)

    slack_source = Source(
        name="Engineering Channel",
        type=SourceType.slack,
        config={"channel_id": "C12345678", "channel_name": "#engineering"},
        is_active=True,
    )
    session.add(slack_source)

    email_source = Source(
        name="Support Email",
        type=SourceType.email,
        config={"email": "support@tasktracker.com"},
        is_active=False,
    )
    session.add(email_source)
    await session.flush()
    print(f"    ✓ Created 3 sources")

    print("  Creating Telegram Profiles...")
    pm_telegram = TelegramProfile(
        telegram_user_id=random.randint(100000000, 999999999),
        first_name="Project",
        last_name="Manager",
        language_code="en",
        is_bot=False,
        is_premium=True,
        user_id=pm_user.id,
        source_id=telegram_source.id,
    )
    session.add(pm_telegram)

    dev_telegram = TelegramProfile(
        telegram_user_id=random.randint(100000000, 999999999),
        first_name="Developer",
        last_name="User",
        language_code="uk",
        is_bot=False,
        is_premium=False,
        user_id=dev_user.id,
        source_id=telegram_source.id,
    )
    session.add(dev_telegram)
    await session.flush()
    print(f"    ✓ Created 2 Telegram profiles")

    print("  Creating LLM Providers...")
    providers = []
    for provider_data in LLM_PROVIDERS_DATA:
        api_key_encrypted = None
        if provider_data["api_key"]:
            api_key_encrypted = encryptor.encrypt(provider_data["api_key"])

        provider = LLMProvider(
            id=uuid4(),
            name=provider_data["name"],
            type=provider_data["type"],
            base_url=provider_data["base_url"],
            api_key_encrypted=api_key_encrypted,
            is_active=provider_data["is_active"],
            validation_status=provider_data["validation_status"],
            validated_at=now if provider_data["validation_status"] == ValidationStatus.connected else None,
        )
        session.add(provider)
        providers.append(provider)
    await session.flush()
    print(f"    ✓ Created {len(providers)} providers")

    print("  Creating Agent Configs...")
    agents = []
    for idx, agent_data in enumerate(AGENT_CONFIGS_DATA):
        provider = providers[idx % len(providers)]
        agent = AgentConfig(
            id=uuid4(),
            name=agent_data["name"],
            description=agent_data["description"],
            provider_id=provider.id,
            model_name=agent_data["model_name"],
            system_prompt=agent_data["system_prompt"],
            temperature=agent_data["temperature"],
            is_active=True,
        )
        session.add(agent)
        agents.append(agent)
    await session.flush()
    print(f"    ✓ Created {len(agents)} agents")

    print("  Creating Task Configs...")
    tasks = []
    for task_data in TASK_CONFIGS_DATA:
        task = TaskConfig(
            id=uuid4(),
            name=task_data["name"],
            description=task_data["description"],
            response_schema=task_data["response_schema"],
            is_active=True,
        )
        session.add(task)
        tasks.append(task)
    await session.flush()
    print(f"    ✓ Created {len(tasks)} tasks")

    print("  Creating Agent-Task Assignments...")
    assignments = []
    for agent in agents:
        task = random.choice(tasks)
        try:
            assignment = AgentTaskAssignment(
                id=uuid4(),
                agent_id=agent.id,
                task_id=task.id,
                is_active=True,
            )
            session.add(assignment)
            assignments.append(assignment)
            await session.flush()
        except Exception:
            continue
    print(f"    ✓ Created {len(assignments)} assignments")

    print("  Creating Project Configs...")
    projects = []
    for project_data in PROJECT_CONFIGS_DATA:
        project = ProjectConfig(
            id=uuid4(),
            name=project_data["name"],
            description=project_data["description"],
            keywords=project_data["keywords"],
            glossary=project_data["glossary"],
            components=project_data["components"],
            default_assignee_ids=[pm_user.id, dev_user.id],
            pm_user_id=pm_user.id,
            is_active=True,
            priority_rules=project_data["priority_rules"],
            version="1.0.0",
        )
        session.add(project)
        projects.append(project)
    await session.flush()
    print(f"    ✓ Created {len(projects)} projects")

    print("  Creating Messages...")
    messages = []
    users_list = [pm_user, dev_user]
    telegram_profiles = [pm_telegram, dev_telegram]

    num_messages = 100
    for i in range(num_messages):
        days_ago = random.randint(0, 30)
        hours_ago = random.randint(0, 23)
        sent_at = (now - timedelta(days=days_ago, hours=hours_ago)).replace(tzinfo=None)

        author = random.choice(users_list)
        telegram_profile = telegram_profiles[users_list.index(author)]
        source = random.choice([telegram_source, slack_source])

        content = random.choice(MESSAGE_TEMPLATES)

        msg_dict = {
            "external_message_id": f"{source.name[:3].upper()}-{i + 1}-{random.randint(1000, 9999)}",
            "content": content,
            "sent_at": sent_at,
            "source_id": source.id,
            "author_id": author.id,
            "analyzed": random.choice([True, False]),
            "analysis_status": random.choice([
                AnalysisStatus.pending.value,
                AnalysisStatus.analyzed.value,
                AnalysisStatus.spam.value,
            ]),
        }

        if source.type == SourceType.telegram:
            msg_dict["telegram_profile_id"] = telegram_profile.id

        message = Message(**msg_dict)
        session.add(message)
        messages.append(message)

        if (i + 1) % 20 == 0:
            await session.flush()

    await session.flush()
    print(f"    ✓ Created {len(messages)} messages")

    message_ids = [msg.id for msg in messages]

    print("  Creating Message Ingestion Jobs...")
    ingestion_jobs = []
    for i in range(3):
        days_ago = random.randint(1, 7)
        created = now - timedelta(days=days_ago, hours=random.randint(0, 23))

        if i == 0:
            status = IngestionStatus.completed
            fetched = 150
            stored = 145
            skipped = 5
            errors = 0
            completed_at = created + timedelta(minutes=10)
        elif i == 1:
            status = IngestionStatus.running
            fetched = 80
            stored = 78
            skipped = 0
            errors = 2
            completed_at = None
        else:
            status = IngestionStatus.pending
            fetched = 0
            stored = 0
            skipped = 0
            errors = 0
            completed_at = None

        job = MessageIngestionJob(
            source_type="telegram",
            source_identifiers={"chat_id": f"-100{random.randint(1000000000, 9999999999)}"},
            time_window_start=(created - timedelta(days=1)).replace(tzinfo=None),
            time_window_end=created.replace(tzinfo=None),
            status=status,
            messages_fetched=fetched,
            messages_stored=stored,
            messages_skipped=skipped,
            errors_count=errors,
            current_batch=random.randint(1, 10) if status != IngestionStatus.pending else 0,
            total_batches=10 if status != IngestionStatus.pending else None,
            error_log={"errors": ["Connection timeout"]} if errors > 0 else None,
            started_at=created.replace(tzinfo=None) if status != IngestionStatus.pending else None,
            completed_at=completed_at.replace(tzinfo=None) if completed_at else None,
        )
        session.add(job)
        ingestion_jobs.append(job)
    await session.flush()
    print(f"    ✓ Created {len(ingestion_jobs)} ingestion jobs")

    print("  Creating Analysis Runs...")
    runs = []

    # Calculate thresholds as percentages of num_runs
    pending_threshold = max(1, int(num_runs * 0.1))  # 10% pending
    completed_threshold = max(2, int(num_runs * 0.3))  # 30% completed
    reviewed_threshold = max(3, int(num_runs * 0.6))  # 60% reviewed
    closed_threshold = max(3, int(num_runs * 0.8))  # 80% closed

    for i in range(num_runs):
        assignment = random.choice(assignments)
        project = random.choice(projects)

        days_ago = random.randint(0, 14)
        created_at = now - timedelta(days=days_ago, hours=random.randint(0, 23))
        time_start = created_at - timedelta(days=1)
        time_end = created_at

        if i < pending_threshold:
            status = AnalysisRunStatus.pending
            started_at = None
            completed_at = None
            closed_at = None
            props_total = 0
            props_approved = 0
            props_rejected = 0
            props_pending = 0
        elif i < completed_threshold:
            status = AnalysisRunStatus.completed
            started_at = created_at + timedelta(minutes=1)
            completed_at = started_at + timedelta(minutes=random.randint(10, 30))
            closed_at = None
            props_total = random.randint(3, 8)
            props_approved = 0
            props_rejected = 0
            props_pending = props_total
        elif i < reviewed_threshold:
            status = AnalysisRunStatus.reviewed
            started_at = created_at + timedelta(minutes=1)
            completed_at = started_at + timedelta(minutes=random.randint(10, 30))
            closed_at = None
            props_total = random.randint(3, 8)
            props_approved = random.randint(1, props_total - 1)
            props_rejected = props_total - props_approved
            props_pending = 0
        elif i < closed_threshold:
            status = AnalysisRunStatus.closed
            started_at = created_at + timedelta(minutes=1)
            completed_at = started_at + timedelta(minutes=random.randint(10, 30))
            closed_at = completed_at + timedelta(hours=random.randint(1, 24))
            props_total = random.randint(3, 8)
            props_approved = random.randint(1, props_total)
            props_rejected = props_total - props_approved
            props_pending = 0
        else:
            status = AnalysisRunStatus.failed
            started_at = created_at + timedelta(minutes=1)
            completed_at = None
            closed_at = None
            props_total = 0
            props_approved = 0
            props_rejected = 0
            props_pending = 0

        run = AnalysisRun(
            id=uuid4(),
            time_window_start=time_start,
            time_window_end=time_end,
            agent_assignment_id=assignment.id,
            project_config_id=project.id,
            config_snapshot={
                "agent": {"name": str(assignment.agent_id), "model": "test-model"},
                "task": {"name": str(assignment.task_id)},
                "project": {"name": project.name, "version": project.version},
            },
            trigger_type="manual",
            triggered_by_user_id=pm_user.id,
            status=status.value,
            created_at=created_at,
            started_at=started_at,
            completed_at=completed_at,
            closed_at=closed_at,
            proposals_total=props_total,
            proposals_approved=props_approved,
            proposals_rejected=props_rejected,
            proposals_pending=props_pending,
            total_messages_in_window=random.randint(100, 500),
            messages_after_prefilter=random.randint(50, 200),
            batches_created=random.randint(5, 20),
            llm_tokens_used=random.randint(5000, 50000),
            cost_estimate=round(random.uniform(0.5, 5.0), 2),
            error_log={"error": "LLM API timeout"} if status == AnalysisRunStatus.failed else None,
        )
        session.add(run)
        runs.append(run)
    await session.flush()
    print(f"    ✓ Created {len(runs)} analysis runs")

    print("  Creating Task Proposals...")
    proposals = []

    # Only use reviewed/closed runs for proposals (they can have approved status)
    reviewable_runs = [
        r
        for r in runs
        if r.status in [AnalysisRunStatus.reviewed.value, AnalysisRunStatus.closed.value] and r.proposals_total > 0
    ]

    # Fallback: if no reviewable runs, use any run with proposals_total > 0
    if not reviewable_runs:
        reviewable_runs = [r for r in runs if r.proposals_total > 0]

    for i in range(num_proposals):
        if not reviewable_runs:
            break

        run = random.choice(reviewable_runs)
        template = random.choice(TASK_PROPOSAL_TEMPLATES)

        confidence = random.uniform(0.6, 0.98)
        if confidence >= 0.9:
            conf_level = "high"
            recommendation = LLMRecommendation.new_task
        elif confidence >= 0.7:
            conf_level = "medium"
            recommendation = random.choice([LLMRecommendation.new_task, LLMRecommendation.update_existing])
        else:
            conf_level = "low"
            recommendation = random.choice([LLMRecommendation.merge, LLMRecommendation.reject])

        source_msg_count = random.randint(1, 5)
        source_msg_ids = random.sample(message_ids, min(source_msg_count, len(message_ids)))

        if run.status == AnalysisRunStatus.completed.value:
            status = ProposalStatus.pending
            reviewed_by = None
            reviewed_at = None
            review_action = None
        elif run.status == AnalysisRunStatus.reviewed.value:
            status = random.choices([ProposalStatus.approved, ProposalStatus.rejected], weights=[70, 30])[0]
            reviewed_by = pm_user.id
            reviewed_at = run.completed_at + timedelta(hours=random.randint(1, 48))
            review_action = "approve" if status == ProposalStatus.approved else "reject"
        else:
            status = random.choices([ProposalStatus.approved, ProposalStatus.rejected], weights=[80, 20])[0]
            reviewed_by = pm_user.id
            reviewed_at = run.completed_at + timedelta(hours=random.randint(1, 48))
            review_action = "approve" if status == ProposalStatus.approved else "reject"

        proposal = TaskProposal(
            id=uuid4(),
            analysis_run_id=run.id,
            proposed_title=template["title"],
            proposed_description=template["description"],
            proposed_priority=template["priority"],
            proposed_category=template["category"],
            proposed_project_id=random.choice(projects).id,
            proposed_tags=template["tags"],
            source_message_ids=source_msg_ids,
            message_count=len(source_msg_ids),
            time_span_seconds=random.randint(300, 7200),
            llm_recommendation=recommendation.value,
            confidence=confidence,
            reasoning=f"{template['reasoning']} Confidence: {conf_level}",
            status=status.value,
            reviewed_by_user_id=reviewed_by,
            reviewed_at=reviewed_at,
            review_action=review_action,
            created_at=run.completed_at or run.created_at,
        )
        session.add(proposal)
        proposals.append(proposal)

        if i % 10 == 0:
            await session.flush()

    print("  Creating Task Entities...")
    task_entities = []
    approved_proposals = [p for p in proposals if p.status == ProposalStatus.approved.value]

    for i in range(min(len(approved_proposals), 10)):
        proposal = approved_proposals[i]

        task_entity = TaskEntity(
            id=uuid4(),
            title=proposal.proposed_title,
            description=proposal.proposed_description,
            status=TaskStatus.open.value,
            priority=proposal.proposed_priority,
            category=proposal.proposed_category,
        )
        session.add(task_entity)
        task_entities.append(task_entity)

    await session.commit()

    print(f"    ✓ Created {len(task_entities)} task entities")

    print()
    print("✅ Seeding complete!")
    print(f"   👥 Users: 2 (PM + Dev)")
    print(f"   📍 Sources: 3 (Telegram + Slack + Email)")
    print(f"   💬 Telegram Profiles: 2")
    print(f"   📨 Messages: {len(messages)}")
    print(f"   🤖 LLM Providers: {len(providers)}")
    print(f"   🧠 Agent Configs: {len(agents)}")
    print(f"   📋 Task Configs: {len(tasks)}")
    print(f"   🔗 Agent-Task Assignments: {len(assignments)}")
    print(f"   📁 Project Configs: {len(projects)}")
    print(f"   📥 Ingestion Jobs: {len(ingestion_jobs)}")
    print(f"   🔄 Analysis Runs: {len(runs)}")
    print(f"   💡 Task Proposals: {len(proposals)}")
    print(f"   ✅ Task Entities: {len(task_entities)}")


async def main():
    parser = argparse.ArgumentParser(description="Seed Analysis System data")
    parser.add_argument("--clear", action="store_true", help="Clear all data")
    parser.add_argument("--seed", action="store_true", help="Seed test data")
    parser.add_argument("--runs", type=int, default=10, help="Number of analysis runs (default: 10)")
    parser.add_argument("--proposals", type=int, default=30, help="Number of task proposals (default: 30)")
    args = parser.parse_args()

    if not args.clear and not args.seed:
        parser.print_help()
        return

    engine = create_async_engine(settings.database_url, echo=False, pool_pre_ping=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    if args.clear:
        async with async_session() as session:
            await clear_data(session)

    if args.seed:
        async with async_session() as session:
            await seed_data(session, args.runs, args.proposals)

    await engine.dispose()
    print("🎉 Done!")


if __name__ == "__main__":
    asyncio.run(main())
