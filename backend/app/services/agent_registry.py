"""Agent instance registry with singleton pattern and weak references.

This service manages the lifecycle of PydanticAI agent instances to prevent
duplicate instantiations for identical agent+task configurations.
"""

import asyncio
import weakref
from typing import Optional
from uuid import UUID

from pydantic_ai import Agent

from app.models import AgentConfig, TaskConfig


class AgentRegistry:
    """Singleton registry for managing PydanticAI agent instances.

    Uses weak references to allow garbage collection of unused agents while
    preventing duplicate instantiations for active agent+task combinations.

    Thread-safe with async locks for concurrent access.
    """

    _instance: Optional["AgentRegistry"] = None
    _lock = asyncio.Lock()

    def __init__(self) -> None:
        """Initialize registry attributes."""
        if not hasattr(self, "_registry"):
            self._registry: dict[tuple[UUID, UUID], weakref.ref[Agent]] = {}
            self._locks: dict[tuple[UUID, UUID], asyncio.Lock] = {}
            self._global_lock: asyncio.Lock = asyncio.Lock()

    def __new__(cls) -> "AgentRegistry":
        """Ensure singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def get_or_create(
        self,
        agent_config: AgentConfig,
        task_config: TaskConfig,
    ) -> Agent:
        """Get existing agent instance or create new one.

        Args:
            agent_config: Agent configuration from database
            task_config: Task configuration from database

        Returns:
            PydanticAI Agent instance configured for the task

        Note:
            Uses weak references internally - agent will be garbage collected
            when no longer in use, but multiple calls with same config will
            return the same instance while it's still referenced elsewhere.
        """
        key = (agent_config.id, task_config.id)

        async with self._global_lock:
            if key not in self._locks:
                self._locks[key] = asyncio.Lock()
            lock = self._locks[key]

        # Use per-instance lock to prevent race conditions
        async with lock:
            # Check if agent instance exists and is still alive
            if key in self._registry:
                agent_ref = self._registry[key]
                agent = agent_ref()
                if agent is not None:
                    return agent
                del self._registry[key]

            agent = await self._create_agent(agent_config, task_config)

            # Store weak reference with cleanup callback
            def cleanup(_: weakref.ref[Agent]) -> None:
                """Remove entry from registry when agent is garbage collected."""
                self._registry.pop(key, None)
                self._locks.pop(key, None)

            self._registry[key] = weakref.ref(agent, cleanup)

            return agent

    async def _create_agent(
        self,
        agent_config: AgentConfig,
        task_config: TaskConfig,
    ) -> Agent:
        """Create new PydanticAI agent instance.

        Args:
            agent_config: Agent configuration with prompts and model settings
            task_config: Task configuration with Pydantic schemas

        Returns:
            Configured PydanticAI Agent instance

        Note:
            This is a placeholder implementation. Actual PydanticAI initialization
            will be implemented in T033 (SchemaGenerator service).
        """
        # TODO: Implement actual PydanticAI agent creation in T033
        # For now, return a basic Agent instance
        # Real implementation will:
        # 1. Generate Pydantic model from task_config.response_schema
        # 2. Initialize provider from agent_config.provider
        # 3. Configure system prompt and temperature
        # 4. Return Agent with result_type set to generated model

        # Minimal placeholder model wiring: use model_name directly.
        # Full provider-specific initialization will be implemented later
        # (e.g., resolving provider by agent_config.provider_id and constructing
        # a provider-aware model spec for PydanticAI).
        agent = Agent(
            model=agent_config.model_name,
            system_prompt=agent_config.system_prompt,
        )

        return agent

    async def clear(self) -> None:
        """Clear all agent instances from registry.

        Useful for testing or when forcing recreation of all agents.
        """
        async with self._global_lock:
            self._registry.clear()
            self._locks.clear()

    def get_registry_size(self) -> int:
        """Get count of active agent instances.

        Returns:
            Number of currently cached agent instances
        """
        # Clean up stale references before counting
        alive_keys = [key for key, ref in self._registry.items() if ref() is not None]
        return len(alive_keys)
