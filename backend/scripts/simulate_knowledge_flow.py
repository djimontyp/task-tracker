
import asyncio
import logging
import sys
import uuid
from datetime import datetime, timezone

# Add backend to path
import os
sys.path.append(os.path.join(os.getcwd(), "backend"))

from sqlalchemy import text
from app.database import AsyncSessionLocal
from app.services.knowledge.knowledge_orchestrator import KnowledgeOrchestrator
from app.services.knowledge.knowledge_schemas import ExtractedAtom, ExtractedTopic
from app.models import LLMProvider, Message, AgentConfig, ProviderType
from app.config.ai_config import ai_config

# Configure logging to show info/debug
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Reduce noise from other loggers
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("unicode_graph").setLevel(logging.WARNING)

async def run_simulation():
    logger.info("Starting Business Logic Simulation...")
    
    async with AsyncSessionLocal() as session:
        # 1. Setup Mock Provider and Config
        # We need a provider that supports embeddings for the semantic checks
        # We will try to find an existing one
        result = await session.execute(
            text("SELECT * FROM llm_provider WHERE is_active = true AND type IN ('openai', 'ollama') LIMIT 1")
        )
        provider_row = result.mappings().one_or_none()
        
        if not provider_row:
            logger.error("No active LLM provider found! Cannot run semantic simulation.")
            return

        # Reconstruct provider object (simplified)
        provider = LLMProvider(**provider_row)
        logger.info(f"Using Provider: {provider.name} ({provider.type})")
        
        agent_config = AgentConfig(
            name="Simulation Agent",
            model_name="gpt-4o", # Or whatever
            provider_id=provider.id
        )
        
        orchestrator = KnowledgeOrchestrator(
            agent_config=agent_config,
            provider=provider
        )

        # --- SCENARIO 1: New Knowledge ---
        logger.info("\n--- SCENARIO 1: Creating New Knowledge (Unique) ---")
        
        topic_name = f"Simulated Topic {uuid.uuid4().hex[:4]}"
        atom_title = f"Simulated Atom {uuid.uuid4().hex[:4]}"
        
        topics_1 = [
            ExtractedTopic(
                name=topic_name,
                description="A topic created during simulation to verify semantic flow.",
                confidence=0.9
            )
        ]
        
        atoms_1 = [
            ExtractedAtom(
                topic_name=topic_name,
                type="insight",
                title=atom_title,
                content="This is a unique piece of knowledge created to test the system.",
                confidence=0.9,
                related_message_ids=[],
                links_to_atom_titles=[],
                link_types=[]
            )
        ]
        
        # Save SCENARIO 1
        saved_topics_Map, _ = await orchestrator.save_topics(topics_1, session)
        saved_atoms_1, _ = await orchestrator.save_atoms(atoms_1, saved_topics_Map, session)
        
        logger.info(f"Created Topic ID: {saved_topics_Map[topic_name].id}")
        logger.info(f"Created Atom ID: {saved_atoms_1[0].id}")


        # --- SCENARIO 2: Semantic Duplicate (Expect Version) ---
        logger.info("\n--- SCENARIO 2: Semantic Duplicate (Expect Version > 0.95 similarity) ---")
        # We use the EXACT SAME content, which should yield 1.0 similarity
        
        atoms_2 = [
            ExtractedAtom(
                topic_name=topic_name,
                type="insight",
                title=atom_title, # Same title helps, but content embedding is key
                content="This is a unique piece of knowledge created to test the system.", # Exact duplicate
                confidence=0.95,
                related_message_ids=[],
                links_to_atom_titles=[],
                link_types=[]
            )
        ]
        
        # Save SCENARIO 2
        saved_atoms_2, version_ids_2 = await orchestrator.save_atoms(atoms_2, saved_topics_Map, session)
        
        if version_ids_2:
            logger.info("SUCCESS: Created Atom Version (Semantic Duplicate detected)")
            logger.info(f"Versioned Atom ID: {version_ids_2[0]}")
        else:
            logger.warning("FAILURE: Did not create version for exact duplicate!")

        
        # --- SCENARIO 3: Semantic Auto-Linking ---
        logger.info("\n--- SCENARIO 3: Auto-Linking (New Atom -> Existing Topic) ---")
        
        # Create a new atom that talks about the topic we created in Scenario 1
        # We change the wording but keep the semantic meaning relative to the topic
        
        atom_link_title = f"Linking Atom {uuid.uuid4().hex[:4]}"
        
        atoms_3 = [
            ExtractedAtom(
                topic_name=topic_name, # Explicit link from extraction
                type="question",
                title=atom_link_title,
                content=f"How does the {topic_name} relate to the semantic flow verification?",
                confidence=0.88,
                related_message_ids=[],
                links_to_atom_titles=[],
                link_types=[]
            )
        ]
        
        saved_atoms_3, _ = await orchestrator.save_atoms(atoms_3, saved_topics_Map, session)
        
        # Verify the automatic linking (check logs or query DB)
        # The Orchestrator's save_atoms calls auto_link_atom
        
        logger.info(f"Created Atom 3 ID: {saved_atoms_3[0].id}")
        
    logger.info("\nSimulation Complete.")

if __name__ == "__main__":
    asyncio.run(run_simulation())
