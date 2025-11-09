"""CRUD operations for Agent Configuration management.

Provides create, read, update, delete operations for agent configurations
with provider relationship validation.
"""

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
from app.services.base_crud import BaseCRUD


class AgentCRUD(BaseCRUD[AgentConfig]):
    """CRUD service for Agent Configuration operations.

    Inherits standard CRUD operations from BaseCRUD and adds
    agent-specific business logic for name uniqueness and provider validation.
    """

    def __init__(self, session: AsyncSession):
        """Initialize CRUD service.

        Args:
            session: Async database session
        """
        super().__init__(AgentConfig, session)

    def _to_public(self, agent: AgentConfig) -> AgentConfigPublic:
        """Convert AgentConfig model to AgentConfigPublic schema.

        Args:
            agent: Database agent configuration instance

        Returns:
            Public agent configuration schema
        """
        return AgentConfigPublic.model_validate(agent)

    async def create_agent(self, agent_data: AgentConfigCreate) -> AgentConfigPublic:
        """Create new agent configuration.

        Args:
            agent_data: Agent creation data

        Returns:
            Created agent with public fields

        Raises:
            ValueError: If agent name already exists or provider not found
        """
        existing = await self.get_by_name(agent_data.name)
        if existing:
            raise ValueError(f"Agent with name '{agent_data.name}' already exists")

        provider_result = await self.session.execute(
            select(LLMProvider).where(LLMProvider.id == agent_data.provider_id)
        )
        provider = provider_result.scalar_one_or_none()
        if not provider:
            raise ValueError(f"Provider with ID '{agent_data.provider_id}' not found")

        agent = await self.create(agent_data.model_dump())
        return self._to_public(agent)

    async def get_agent(self, agent_id: UUID) -> AgentConfigPublic | None:
        """Get agent by ID.

        Args:
            agent_id: Agent UUID

        Returns:
            Agent if found, None otherwise
        """
        agent = await self.get(agent_id)
        return self._to_public(agent) if agent else None

    async def get_by_name(self, name: str) -> AgentConfigPublic | None:
        """Get agent by name.

        Args:
            name: Agent name

        Returns:
            Agent if found, None otherwise
        """
        result = await self.session.execute(select(AgentConfig).where(AgentConfig.name == name))
        agent = result.scalar_one_or_none()
        return self._to_public(agent) if agent else None

    async def list_agents(
        self,
        skip: int = 0,
        limit: int = 100,
        active_only: bool = False,
        provider_id: UUID | None = None,
    ) -> list[AgentConfigPublic]:
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

        return [self._to_public(a) for a in agents]

    async def update_agent(
        self,
        agent_id: UUID,
        update_data: AgentConfigUpdate,
    ) -> AgentConfigPublic | None:
        """Update agent configuration.

        Args:
            agent_id: Agent UUID
            update_data: Fields to update

        Returns:
            Updated agent if found, None otherwise

        Raises:
            ValueError: If provider_id provided but not found
        """
        agent = await self.get(agent_id)
        if not agent:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)

        if "provider_id" in update_dict:
            provider_result = await self.session.execute(
                select(LLMProvider).where(LLMProvider.id == update_dict["provider_id"])
            )
            provider = provider_result.scalar_one_or_none()
            if not provider:
                raise ValueError(f"Provider with ID '{update_dict['provider_id']}' not found")

        updated_agent = await self.update(agent, update_dict)
        return self._to_public(updated_agent)

    async def delete_agent(self, agent_id: UUID) -> bool:
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
        return await self.delete(agent_id)
