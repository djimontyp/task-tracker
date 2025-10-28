"""Schemas for agent testing functionality."""

from uuid import UUID

from pydantic import BaseModel, Field


class TestAgentRequest(BaseModel):
    """Request schema for testing an agent."""

    prompt: str = Field(min_length=1, max_length=5000, description="Test prompt to send to the agent")


class TestAgentResponse(BaseModel):
    """Response schema for agent test results."""

    agent_id: UUID = Field(description="UUID of the tested agent")
    agent_name: str = Field(description="Name of the tested agent")
    prompt: str = Field(description="Prompt that was sent to the agent")
    response: str = Field(description="Agent's response from LLM")
    elapsed_time: float = Field(description="Time taken to get response in seconds")
    model_name: str = Field(description="Model used for the test")
    provider_name: str = Field(description="Provider name")
    provider_type: str = Field(description="Provider type (ollama, openai)")
