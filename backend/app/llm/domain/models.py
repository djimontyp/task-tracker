"""Framework-agnostic domain models for LLM layer.

These models define the core data structures used across the LLM hexagonal architecture.
They are completely independent of any specific LLM framework (Pydantic AI, LangChain, etc.)
and serve as the contract between domain logic and infrastructure adapters.
"""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field


T = TypeVar("T")


class AgentConfig(BaseModel):
    """Configuration for creating an agent.

    This is a framework-agnostic representation of agent configuration.
    Adapters will translate this into framework-specific agent instances.

    Note: This model complements the database AgentConfig model but is purely
    for domain logic and doesn't include database-specific fields.
    """

    name: str = Field(description="Agent name (for logging and identification)")
    model_name: str = Field(description="Model identifier (e.g., 'llama3', 'gpt-4')")
    system_prompt: str | None = Field(default=None, description="System prompt for agent behavior")
    output_type: type | None = Field(
        default=None,
        description="Expected output type for structured responses (e.g., Pydantic model class)",
    )
    deps_type: type | None = Field(
        default=None,
        description="Dependencies type for agent execution (e.g., database session, config)",
    )
    temperature: float | None = Field(
        default=None,
        ge=0.0,
        le=2.0,
        description="Sampling temperature (0.0-2.0, lower = more deterministic)",
    )
    max_tokens: int | None = Field(default=None, gt=0, description="Maximum tokens in response")
    tools: list["ToolDefinition"] | None = Field(default=None, description="Tools available to agent")


class UsageInfo(BaseModel):
    """Token usage information from LLM execution.

    Tracks token consumption for monitoring, billing, and optimization purposes.
    """

    prompt_tokens: int = Field(ge=0, description="Tokens used in prompt/input")
    completion_tokens: int = Field(ge=0, description="Tokens generated in completion/output")
    total_tokens: int = Field(ge=0, description="Total tokens consumed")


class AgentResult(BaseModel, Generic[T]):
    """Result from agent execution.

    Generic container for agent output with metadata about execution.
    Type parameter T represents the output type (can be str, Pydantic model, etc.)
    """

    output: T = Field(description="Actual output from agent (type depends on agent config)")
    usage: UsageInfo | None = Field(default=None, description="Token usage statistics")
    messages: list[dict[str, Any]] | None = Field(
        default=None,
        description="Conversation messages (for debugging/logging)",
    )
    metadata: dict[str, Any] | None = Field(default=None, description="Additional execution metadata")


class StreamEvent(BaseModel):
    """Event from streaming agent execution.

    Represents a single event in a streaming response, allowing progressive
    processing of agent output as it's generated.
    """

    type: str = Field(description="Event type (e.g., 'text', 'tool_call', 'complete', 'error')")
    content: Any = Field(description="Event payload (content depends on event type)")
    delta: str | None = Field(default=None, description="Text delta for incremental text events")
    metadata: dict[str, Any] | None = Field(default=None, description="Additional event metadata")


class ToolDefinition(BaseModel):
    """Tool that can be used by agents.

    Defines a callable function/tool that agents can invoke during execution
    for extended capabilities beyond text generation.
    """

    name: str = Field(description="Tool name (must be unique per agent)")
    description: str = Field(description="Tool description (helps agent decide when to use it)")
    parameters: dict[str, Any] = Field(
        description="JSON Schema for tool parameters",
        default_factory=dict,
    )
    required: list[str] | None = Field(default=None, description="List of required parameter names")


class ModelInfo(BaseModel):
    """Information about a model instance.

    Metadata about a model for inspection and debugging purposes.
    """

    name: str = Field(description="Model name/identifier")
    provider_type: str = Field(description="Provider type (e.g., 'ollama', 'openai')")
    supports_streaming: bool = Field(default=False, description="Whether model supports streaming")
    supports_tools: bool = Field(default=False, description="Whether model supports tool calling")
    context_window: int | None = Field(default=None, description="Maximum context window size")
    metadata: dict[str, Any] | None = Field(default=None, description="Additional model metadata")


class ProviderConfig(BaseModel):
    """Provider configuration for model creation.

    Framework-agnostic representation of provider settings.
    Adapters translate this into framework-specific provider instances.
    """

    provider_type: str = Field(description="Provider type (e.g., 'ollama', 'openai')")
    base_url: str | None = Field(default=None, description="Base URL for API (if applicable)")
    api_key: str | None = Field(default=None, description="API key (if applicable)")
    timeout: int | None = Field(default=None, gt=0, description="Request timeout in seconds")
    max_retries: int | None = Field(default=None, ge=0, description="Maximum retry attempts")
    metadata: dict[str, Any] | None = Field(default=None, description="Additional provider-specific config")
