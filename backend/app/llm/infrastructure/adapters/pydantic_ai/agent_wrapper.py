"""Agent wrapper implementing domain LLMAgent protocol using Pydantic AI."""

from collections.abc import AsyncIterator
from typing import Any, Generic, TypeVar

from pydantic_ai import Agent as PydanticAgent
from pydantic_ai.result import StreamedRunResult
from pydantic_ai.run import AgentRunResult

from app.llm.domain.exceptions import AgentExecutionError, StreamingNotSupportedError
from app.llm.domain.models import AgentConfig, AgentResult, StreamEvent
from app.llm.domain.ports import LLMAgent
from app.llm.infrastructure.adapters.pydantic_ai.converters import (
    extract_messages_from_result,
    pydantic_usage_to_domain,
)

T = TypeVar("T")


class PydanticAIAgentWrapper(Generic[T]):
    """Wraps Pydantic AI Agent to implement domain LLMAgent protocol.

    This wrapper translates domain-level agent operations into Pydantic AI
    framework calls, handling result conversion and error translation.

    The wrapper maintains both the Pydantic AI agent instance and the
    domain-level configuration for inspection and debugging.
    """

    def __init__(self, agent: PydanticAgent[Any, T], config: AgentConfig):
        """Initialize wrapper with Pydantic AI agent and configuration.

        Args:
            agent: Pydantic AI agent instance
            config: Domain agent configuration
        """
        self._agent = agent
        self._config = config

    async def run(
        self,
        prompt: str,
        dependencies: Any = None,
    ) -> AgentResult[T]:
        """Execute agent and return structured result.

        Runs the Pydantic AI agent with the given prompt and dependencies,
        converting the framework-specific result into a domain AgentResult.

        Args:
            prompt: User prompt/message
            dependencies: Optional dependencies for agent (Pydantic AI deps)

        Returns:
            AgentResult with output and usage info

        Raises:
            AgentExecutionError: If agent execution fails

        Example:
            >>> result = await agent.run("Analyze this task")
            >>> print(result.output)
            >>> print(f"Tokens used: {result.usage.total_tokens}")
        """
        try:
            pydantic_result: AgentRunResult[T] = await self._agent.run(prompt, deps=dependencies)

            usage = pydantic_usage_to_domain(pydantic_result.usage())
            messages = extract_messages_from_result(pydantic_result)

            return AgentResult(
                output=pydantic_result.output,
                usage=usage,
                messages=messages,
            )

        except Exception as e:
            raise AgentExecutionError(
                f"Agent execution failed for '{self._config.name}': {str(e)}"
            ) from e

    async def stream(
        self,
        prompt: str,
        dependencies: Any = None,
    ) -> AsyncIterator[StreamEvent]:
        """Stream agent execution events.

        Streams agent execution progressively, yielding events as they occur.
        This is useful for real-time UI updates and progressive processing.

        Args:
            prompt: User prompt/message
            dependencies: Optional dependencies

        Yields:
            StreamEvent objects as agent processes

        Raises:
            AgentExecutionError: If streaming fails
            StreamingNotSupportedError: If agent doesn't support streaming

        Example:
            >>> async for event in agent.stream("Analyze this task"):
            ...     if event.type == "text" and event.delta:
            ...         print(event.delta, end="", flush=True)
        """
        if not self.supports_streaming():
            raise StreamingNotSupportedError(
                f"Agent '{self._config.name}' does not support streaming operations"
            )

        try:
            async with self._agent.run_stream(prompt, deps=dependencies) as streamed:
                async for text_chunk in streamed.stream_text():
                    yield StreamEvent(
                        type="text",
                        content=text_chunk,
                        delta=text_chunk,
                    )

                final_result = await streamed.get_output()
                yield StreamEvent(
                    type="complete",
                    content=final_result,
                )

        except Exception as e:
            raise AgentExecutionError(
                f"Agent streaming failed for '{self._config.name}': {str(e)}"
            ) from e

    def supports_streaming(self) -> bool:
        """Check if agent supports streaming operations.

        Pydantic AI agents support streaming by default via run_stream().

        Returns:
            True (Pydantic AI always supports streaming)
        """
        return True

    def get_config(self) -> AgentConfig:
        """Get agent configuration.

        Returns:
            Domain agent configuration
        """
        return self._config
