"""Topic Classification Service for evaluating LLM classification accuracy.

This service handles:
- Single message classification using LLM with structured output
- Running classification experiments on batches of messages
- Calculating accuracy metrics and confusion matrices
- Managing experiment lifecycle and results storage
"""

import logging
import time
from uuid import UUID

from pydantic import BaseModel, Field
from pydantic_ai import Agent as PydanticAgent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.ollama import OllamaProvider
from pydantic_ai.providers.openai import OpenAIProvider
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    ClassificationExperiment,
    ExperimentStatus,
    LLMProvider,
    Message,
    ProviderType,
    Topic,
)
from app.services.credential_encryption import CredentialEncryption

logger = logging.getLogger(__name__)


class TopicAlternative(BaseModel):
    """Alternative topic suggestion with confidence."""

    topic_id: int = Field(description="Topic ID")
    topic_name: str = Field(description="Topic name")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score")


class TopicClassificationResult(BaseModel):
    """Structured output from LLM for topic classification."""

    topic_id: int = Field(description="Predicted topic ID")
    topic_name: str = Field(description="Predicted topic name")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score 0-1")
    reasoning: str = Field(description="Why this topic was chosen")
    alternatives: list[TopicAlternative] = Field(
        default_factory=list,
        description="Alternative topic suggestions",
    )


class TopicClassificationService:
    """Service for topic classification and experiment execution.

    Handles LLM-based topic classification with structured outputs and
    manages end-to-end classification experiments including metrics calculation.
    """

    def __init__(self, session: AsyncSession):
        """Initialize topic classification service.

        Args:
            session: Async database session
        """
        self.session = session
        self.encryptor = CredentialEncryption()

    async def classify_message(
        self,
        message: Message,
        topics: list[Topic],
        provider: LLMProvider,
        model_name: str,
    ) -> tuple[TopicClassificationResult, float]:
        """Classify a single message using LLM with structured output.

        Args:
            message: Message to classify
            topics: Available topics for classification
            provider: LLM provider configuration
            model_name: Model name to use

        Returns:
            Tuple of (classification result, execution time in ms)

        Raises:
            ValueError: If provider configuration is invalid
            Exception: If LLM request fails

        Example:
            >>> result, exec_time = await service.classify_message(msg, topics, provider, "llama3.2:3b")
            >>> print(f"Topic: {result.topic_name}, Confidence: {result.confidence:.2f}")
        """
        start_time = time.perf_counter()

        prompt = self._build_classification_prompt(message, topics)

        api_key = None
        if provider.api_key_encrypted:
            try:
                api_key = self.encryptor.decrypt(provider.api_key_encrypted)
            except Exception as e:
                raise ValueError(f"Failed to decrypt API key for provider '{provider.name}': {e}")

        model = self._build_model_instance(provider, model_name, api_key)

        system_prompt = """You are a topic classification expert.
Given a message and a list of available topics, classify the message into the most appropriate topic.
Provide your reasoning and confidence score. If uncertain, suggest alternative topics."""

        agent = PydanticAgent(
            model=model,
            system_prompt=system_prompt,
            output_type=TopicClassificationResult,
        )

        try:
            result = await agent.run(prompt)
            execution_time_ms = (time.perf_counter() - start_time) * 1000

            classification_result: TopicClassificationResult = result.output
            return classification_result, execution_time_ms

        except Exception as e:
            logger.error(f"Classification failed for message {message.id}: {e}", exc_info=True)
            raise Exception(f"LLM classification request failed: {str(e)}") from e

    async def run_experiment(
        self,
        provider_id: UUID,
        model_name: str,
        message_count: int,
    ) -> ClassificationExperiment:
        """Create classification experiment and prepare for execution.

        Args:
            provider_id: LLM provider UUID
            model_name: Model name to use
            message_count: Number of messages to classify

        Returns:
            Created experiment record (status=pending)

        Raises:
            ValueError: If provider not found or inactive
            ValueError: If not enough messages with topics in database

        Example:
            >>> experiment = await service.run_experiment(provider_id, "llama3.2:3b", 100)
            >>> # Trigger background task with experiment.id
        """
        provider = await self.session.get(LLMProvider, provider_id)
        if not provider:
            raise ValueError(f"Provider {provider_id} not found")
        if not provider.is_active:
            raise ValueError(f"Provider '{provider.name}' is not active")

        topics = await self._fetch_topics_snapshot()
        if not topics:
            raise ValueError("No topics available in database")

        messages_with_topics_count = await self.session.scalar(
            select(func.count(Message.id)).where(Message.topic_id.isnot(None))
        )
        if messages_with_topics_count < message_count:
            raise ValueError(
                f"Not enough messages with topics. Requested: {message_count}, Available: {messages_with_topics_count}"
            )

        topics_snapshot = {str(topic.id): {"name": topic.name, "description": topic.description} for topic in topics}

        experiment = ClassificationExperiment(
            provider_id=provider_id,
            model_name=model_name,
            message_count=message_count,
            topics_snapshot=topics_snapshot,
            status=ExperimentStatus.pending,
        )

        self.session.add(experiment)
        await self.session.commit()
        await self.session.refresh(experiment)

        logger.info(f"Created experiment {experiment.id} with {message_count} messages")

        return experiment

    async def calculate_metrics(
        self,
        classification_results: list[dict],
    ) -> dict:
        """Calculate accuracy metrics and confusion matrix from results.

        Args:
            classification_results: List of classification result dictionaries

        Returns:
            Dictionary with accuracy, avg_confidence, avg_execution_time_ms, confusion_matrix

        Example:
            >>> metrics = await service.calculate_metrics(results)
            >>> print(f"Accuracy: {metrics['accuracy']:.2%}")
        """
        if not classification_results:
            return {
                "accuracy": 0.0,
                "avg_confidence": 0.0,
                "avg_execution_time_ms": 0.0,
                "confusion_matrix": {},
            }

        correct = 0
        total = 0
        total_confidence = 0.0
        total_execution_time = 0.0
        confusion_matrix: dict[str, dict[str, int]] = {}

        for result in classification_results:
            actual_topic_name = result.get("actual_topic_name")
            predicted_topic_name = result["predicted_topic_name"]
            confidence = result["confidence"]
            execution_time_ms = result["execution_time_ms"]

            if actual_topic_name is not None:
                total += 1
                total_confidence += confidence
                total_execution_time += execution_time_ms

                if actual_topic_name not in confusion_matrix:
                    confusion_matrix[actual_topic_name] = {}

                if predicted_topic_name not in confusion_matrix[actual_topic_name]:
                    confusion_matrix[actual_topic_name][predicted_topic_name] = 0

                confusion_matrix[actual_topic_name][predicted_topic_name] += 1

                if actual_topic_name == predicted_topic_name:
                    correct += 1

        accuracy = correct / total if total > 0 else 0.0
        avg_confidence = total_confidence / total if total > 0 else 0.0
        avg_execution_time_ms = total_execution_time / total if total > 0 else 0.0

        return {
            "accuracy": accuracy,
            "avg_confidence": avg_confidence,
            "avg_execution_time_ms": avg_execution_time_ms,
            "confusion_matrix": confusion_matrix,
        }

    async def _fetch_topics_snapshot(self) -> list[Topic]:
        """Fetch all active topics for experiment snapshot."""
        result = await self.session.execute(select(Topic).order_by(Topic.id))
        return list(result.scalars().all())

    def _build_classification_prompt(
        self,
        message: Message,
        topics: list[Topic],
    ) -> str:
        """Build LLM prompt for topic classification.

        Args:
            message: Message to classify
            topics: Available topics

        Returns:
            Formatted prompt string
        """
        topics_text = "\n".join([
            f"- ID: {topic.id}, Name: {topic.name}, Description: {topic.description}" for topic in topics
        ])

        prompt = f"""Classify the following message into the most appropriate topic from the list below.

Message:
{message.content}

Available Topics:
{topics_text}

Instructions:
1. Choose the most appropriate topic ID and name
2. Provide a confidence score (0.0-1.0) based on how well the message fits
3. Explain your reasoning in 1-2 sentences
4. If confidence is below 0.9, suggest 1-2 alternative topics with their confidence scores

Return your classification decision."""
        return prompt

    def _build_model_instance(
        self,
        provider: LLMProvider,
        model_name: str,
        api_key: str | None = None,
    ) -> OpenAIChatModel:
        """Build pydantic-ai model instance from provider configuration.

        Args:
            provider: LLM provider configuration
            model_name: Model name to use
            api_key: Decrypted API key (if required)

        Returns:
            Configured model instance for pydantic-ai

        Raises:
            ValueError: If provider type is unsupported or configuration invalid
        """
        if provider.type == ProviderType.ollama:
            if not provider.base_url:
                raise ValueError(f"Provider '{provider.name}' is missing base_url")

            ollama_provider = OllamaProvider(base_url=provider.base_url)
            return OpenAIChatModel(
                model_name=model_name,
                provider=ollama_provider,
            )

        elif provider.type == ProviderType.openai:
            if not api_key:
                raise ValueError(f"Provider '{provider.name}' requires an API key")

            openai_provider = OpenAIProvider(api_key=api_key)
            return OpenAIChatModel(
                model_name=model_name,
                provider=openai_provider,
            )

        else:
            raise ValueError(f"Unsupported provider type: {provider.type}")
