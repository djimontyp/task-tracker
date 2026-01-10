
import logging
from typing import Any

from pydantic import BaseModel, Field

from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select
from core.config import settings
from app.llm.application.llm_service import LLMService
from app.llm.domain.models import AgentConfig
from app.models.agent_config import AgentConfig as DBAgentConfig
from app.models.message import Message
from app.models.user import User

logger = logging.getLogger(__name__)

class ScoringAnalysis(BaseModel):
    """Structured output from LLM scoring."""
    importance_score: float = Field(..., description="Score from 0.0 to 1.0", ge=0.0, le=1.0)
    classification: str = Field(..., description="One of: noise, weak_signal, signal")
    reasoning: str = Field(..., description="Brief explanation of the score")
    factors: dict[str, float] = Field(
        ..., 
        description="Key factors scores (0-1): knowledge_value, actionability, urgency"
    )

class LLMImportanceScorer:
    """AI-based importance scorer using LLM Service."""

    def __init__(self, llm_service: LLMService):
        self.llm_service = llm_service

    async def score_message(self, message: Message, db_session: AsyncSession) -> dict[str, Any]:
        """Score a single message using LLM.

        Args:
            message: Message object to score
            db_session: Database session (passed to LLMService for provider resolution)

        Returns:
            Dict compatible with legacy scorer structure:
            {
                "importance_score": float,
                "classification": str,
                "noise_factors": dict
            }
        """
        # Fetch author manually to avoid type errors and ensure it's loaded
        author = await db_session.get(User, message.author_id)
        author_name = author.full_name if author else "Unknown"
        text_content = message.content or "[No Content]"
        
        system_prompt = (
            "You are an expert Data Triage Judge for a DevOps/Engineering team. "
            "Your task is to rate the 'Knowledge Value' of chat messages.\n"
            "High Value (0.8-1.0): Bug reports, architectural decisions, incidents, technical insights, 'how-to' guides.\n"
            "Medium Value (0.4-0.7): Status updates, coordination, clarifications.\n"
            "Low Value (0.0-0.3): Social chatter, 'ok/thanks', logistical noise, scheduling.\n\n"
            "IMPORTANT: \n"
            "- Ignore language (support Ukrainian/English).\n"
            "- Ignore date/time.\n"
            "- Focus on SUBSTANCE and ACTIONABILITY."
        )

        user_prompt = (
            f"Analyze this message:\n"
            f"Author: {author_name}\n"
            f"Content: \"{text_content}\"\n\n"
            f"Output JSON with score, classification, brief reasoning, and factor scores."
        )

        # Config First: Try to load agent configuration from DB
        # Note: Agent renamed from "scoring_judge" to "importance_scorer" in seed_default_agent.py
        stmt = select(DBAgentConfig).where(DBAgentConfig.name == "importance_scorer")
        result = await db_session.execute(stmt)
        db_agent_config = result.scalar_one_or_none()

        if db_agent_config:
            # Found custom config in DB - use it (Config First)
            provider_id = db_agent_config.provider_id
            model_name = db_agent_config.model_name
            temperature = float(db_agent_config.temperature) if db_agent_config.temperature is not None else 0.0
            
            # Note: We still use the code-defined system_prompt as base, 
            # but we could append custom_prompt from DB if needed.
        else:
            # Fallback to ENV/Defaults (Cold Start)
            from app.models import ProviderType
            try:
                provider = await self.llm_service.provider_resolver.resolve_active(db_session, ProviderType.ollama)
                provider_id = provider.id
            except Exception:
                logger.warning("Could not resolve active provider, expecting fallback")
                provider_id = None
            
            model_name = settings.llm.ollama_model
            temperature = 0.0

        # Configure Agent (Domain Object)
        agent_config = AgentConfig(
            name="importance_scorer",
            description="System agent for scoring message importance and triage",
            model_name=model_name,
            system_prompt=system_prompt,
            output_type=ScoringAnalysis,
            temperature=temperature,
        )

        try:
            # Execute
            result = await self.llm_service.execute_prompt(
                session=db_session,
                config=agent_config,
                prompt=user_prompt,
                provider_id=provider_id
            )
            
            # The result.output should be an instance of ScoringAnalysis because of output_type
            analysis: ScoringAnalysis = result.output

            logger.info(
                f"LLM Scored message {message.id}: {analysis.importance_score} "
                f"({analysis.classification}) - {analysis.reasoning}"
            )

            # Note: reasoning is logged above but NOT stored in noise_factors
            # noise_factors expects dict[str, float], reasoning is str
            return {
                "importance_score": analysis.importance_score,
                "classification": analysis.classification,
                "noise_factors": analysis.factors,  # Only numeric factors
            }

        except Exception as e:
            logger.error(f"LLM Scoring failed for message {message.id}: {e}")
            # Fallback to neutral score to avoid blocking flow, or raise?
            # User wants High Quality. Better to fail and retry than save garbage.
            # But for batch processing, we might want to return a safe default.
            # Let's return a special "Error" state/score or raise.
            # Raising allows the task to retry.
            raise e
