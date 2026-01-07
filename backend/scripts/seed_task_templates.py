"""Seed default task templates for Design and Bug workflows.

This script creates 'Design Review' and 'Bug Fix' task templates if they don't exist.
"""
import asyncio
import logging
import sys

from app.database import AsyncSessionLocal
from app.models import TaskConfig
from app.services import TaskCRUD
from sqlalchemy import select

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_task_templates():
    async with AsyncSessionLocal() as session:
        crud = TaskCRUD(session)

        # 1. Design Review Template
        design_review_name = "Design Review"
        existing_design = await crud.get_task_by_name(design_review_name)
        if not existing_design:
            logger.info(f"Creating '{design_review_name}' template...")
            await crud.create_task(TaskConfig(
                name=design_review_name,
                description="Review design mockups and provide feedback on UX/UI.",
                response_schema={
                    "type": "object",
                    "properties": {
                        "approved": {"type": "boolean", "description": "Is the design approved?"},
                        "feedback": {"type": "string", "description": "Detailed feedback or change requests."},
                        "score": {"type": "integer", "minimum": 1, "maximum": 10, "description": "Design quality score."}
                    },
                    "required": ["approved", "score"]
                }
            ))
        else:
            logger.info(f"'{design_review_name}' template already exists.")

        # 2. Bug Fix Template
        bug_fix_name = "Bug Fix"
        existing_bug = await crud.get_task_by_name(bug_fix_name)
        if not existing_bug:
            logger.info(f"Creating '{bug_fix_name}' template...")
            await crud.create_task(TaskConfig(
                name=bug_fix_name,
                description="Analyze bug report, reproduce, and suggest a fix.",
                response_schema={
                    "type": "object",
                    "properties": {
                        "reproducible": {"type": "boolean", "description": "Can the bug be reproduced?"},
                        "root_cause": {"type": "string", "description": "Explanation of what causes the bug."},
                        "fix_suggestion": {"type": "string", "description": "Proposed code fix or strategy."}
                    },
                    "required": ["reproducible", "root_cause"]
                }
            ))
        else:
            logger.info(f"'{bug_fix_name}' template already exists.")

if __name__ == "__main__":
    asyncio.run(seed_task_templates())
