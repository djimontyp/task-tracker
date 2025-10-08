"""CRUD operations for Agent Configuration management.

Provides create, read, update, delete operations for agent configurations
with provider relationship validation.
"""

from typing import List, Optional
from uuid import UUID

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import (
    AgentConfig,
    AgentConfigCreate,
    AgentConfigPublic,
    AgentConfigUpdate,
    LLMProvider,
)


class AgentCRUD:
    """CRUD service for Agent Configuration operations."""

    def __init__(self, session: AsyncSession):
        """Initialize CRUD service.

        Args:
            session: Async database session
        """
        self.session = session

    async def create(self, agent_data: AgentConfigCreate) -> AgentConfigPublic:
        """Create new agent configuration.

        Args:
            agent_data: Agent creation data

        Returns:
            Created agent with public fields

        Raises:
            ValueError: If agent name already exists or provider not found
        """
        # Check name uniqueness
        existing = await self.get_by_name(agent_data.name)
        if existing:
            raise ValueError(f"Agent with name '{agent_data.name}' already exists")

        # Verify provider exists
        provider_result = await self.session.execute(
            select(LLMProvider).where(LLMProvider.id == agent_data.provider_id)
        )
        provider = provider_result.scalar_one_or_none()
        if not provider:
            raise ValueError(f"Provider with ID '{agent_data.provider_id}' not found")

        # Create agent record
        agent = AgentConfig(
            name=agent_data.name,
            description=agent_data.description,
            provider_id=agent_data.provider_id,
            model_name=agent_data.model_name,
            system_prompt=agent_data.system_prompt,
            temperature=agent_data.temperature,
            max_tokens=agent_data.max_tokens,
            is_active=agent_data.is_active,
        )

        self.session.add(agent)
        await self.session.commit()
        await self.session.refresh(agent)

        return AgentConfigPublic.model_validate(agent)

    async def get(self, agent_id: UUID) -> Optional[AgentConfigPublic]:
        """Get agent by ID.

        Args:
            agent_id: Agent UUID

        Returns:
            Agent if found, None otherwise
        """
        result = await self.session.execute(
            select(AgentConfig).where(AgentConfig.id == agent_id)
        )
        agent = result.scalar_one_or_none()

        if agent:
            return AgentConfigPublic.model_validate(agent)
        return None

    async def get_by_name(self, name: str) -> Optional[AgentConfigPublic]:
        """Get agent by name.

        Args:
            name: Agent name

        Returns:
            Agent if found, None otherwise
        """
        result = await self.session.execute(
            select(AgentConfig).where(AgentConfig.name == name)
        )
        agent = result.scalar_one_or_none()

        if agent:
            return AgentConfigPublic.model_validate(agent)
        return None

    async def list(
        self,
        skip: int = 0,
        limit: int = 100,
        active_only: bool = False,
        provider_id: Optional[UUID] = None,
    ) -> List[AgentConfigPublic]:
        """List agents with pagination and filters.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            active_only: Filter for active agents only
            provider_id: Filter by provider ID

        Returns:
            List of agents
        """
        query = select(AgentConfig)

        if active_only:
            query = query.where(AgentConfig.is_active == True)  # noqa: E712

        if provider_id:
            query = query.where(AgentConfig.provider_id == provider_id)

        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        agents = result.scalars().all()

        return [AgentConfigPublic.model_validate(a) for a in agents]

    async def update(
        self,
        agent_id: UUID,
        update_data: AgentConfigUpdate,
    ) -> Optional[AgentConfigPublic]:
        """Update agent configuration.

        Args:
            agent_id: Agent UUID
            update_data: Fields to update

        Returns:
            Updated agent if found, None otherwise

        Raises:
            ValueError: If provider_id provided but not found
        """
        result = await self.session.execute(
            select(AgentConfig).where(AgentConfig.id == agent_id)
        )
        agent = result.scalar_one_or_none()

        if not agent:
            return None

        # Get update dict excluding unset fields
        update_dict = update_data.model_dump(exclude_unset=True)

        # Verify new provider exists if changing provider
        if "provider_id" in update_dict:
            provider_result = await self.session.execute(
                select(LLMProvider).where(LLMProvider.id == update_dict["provider_id"])
            )
            provider = provider_result.scalar_one_or_none()
            if not provider:
                raise ValueError(
                    f"Provider with ID '{update_dict['provider_id']}' not found"
                )

        # Apply updates
        for field, value in update_dict.items():
            setattr(agent, field, value)

        await self.session.commit()
        await self.session.refresh(agent)

        return AgentConfigPublic.model_validate(agent)

    async def delete(self, agent_id: UUID) -> bool:
        """Delete agent configuration.

        Args:
            agent_id: Agent UUID

        Returns:
            True if deleted, False if not found

        Note:
            Per spec FR-033, deletion is allowed even with active task assignments.
            Running agent instances continue until task completion.
            Will cascade delete agent_task_assignments due to FK constraint.
        """
        result = await self.session.execute(
            select(AgentConfig).where(AgentConfig.id == agent_id)
        )
        agent = result.scalar_one_or_none()

        if not agent:
            return False

        await self.session.delete(agent)
        await self.session.commit()
        return True
