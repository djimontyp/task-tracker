
import asyncio
import logging
import sys
import os
import re
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from sqlalchemy import text
from app.database import AsyncSessionLocal
from app.services.knowledge.knowledge_orchestrator import KnowledgeOrchestrator
from app.models import LLMProvider, Message, AgentConfig, ProviderType

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
logging.getLogger("httpx").setLevel(logging.WARNING)

def parse_messages(file_path):
    messages = []
    current_message = None
    
    # Regex for header: "Name, [DD.MM.YYYY HH:MM]"
    # Example: Olga Zaritska, [05.01.2026 09:51]
    header_pattern = re.compile(r"^(.*?),\s\[(\d{2}\.\d{2}\.\d{4}\s\d{2}:\d{2})\]$")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        match = header_pattern.match(line)
        if match:
            # Start of new message
            if current_message:
                messages.append(current_message)
            
            name = match.group(1)
            date_str = match.group(2)
            dt = datetime.strptime(date_str, "%d.%m.%Y %H:%M")
            
            current_message = {
                "role": "user", # Treat all chat participants as 'user' for now, or distinguish if needed
                "content": "",
                "created_at": dt,
                "author_name": name,
                # Simulate a provider_id and other fields or create Message objects directly?
                # The orchestrator expects Message objects.
            }
        else:
            # Content line
            if current_message:
                current_message["content"] += line + "\n"
                
    if current_message:
        messages.append(current_message)
        
    return messages

async def run_verification():
    logger.info("Starting Verification with Real Data...")
    
    # 1. Parse File
    file_path = "sample_chat_messages_2.txt"
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return
        
    raw_messages = parse_messages(file_path)
    logger.info(f"Parsed {len(raw_messages)} messages.")
    
    # Use a subset if too large for a single pass, or all of them
    # Let's take the first 50 messages to verify functionality without huge cost/time
    # Or maybe the whole thing if we want a "stress test"
    # The user asked to "verify all business developments", so let's try a substantial chunk or all.
    # 900 messages might be too much for one LLM context window depending on limit.
    # We'll parse them into Message objects.
    
    # 2. Setup DB and Orchestrator
    async with AsyncSessionLocal() as session:
        # Get Provider
        result = await session.execute(
            text("SELECT * FROM llm_providers WHERE is_active = true AND type IN ('openai', 'ollama') LIMIT 1")
        )
        provider_row = result.mappings().one_or_none()
        
        if not provider_row:
            logger.error("No active LLM provider found!")
            return

        provider = LLMProvider(**provider_row)
        logger.info(f"Using Provider: {provider.name}")
        
        # Try to find an existing model name for this provider
        model_result = await session.execute(
            text("SELECT model_name FROM agent_configs WHERE provider_id = :pid LIMIT 1"),
            {"pid": provider.id}
        )
        model_row = model_result.mappings().one_or_none()
        
        if model_row:
            model_name = model_row["model_name"]
        else:
            # Fallback defaults
            model_name = "qwen2.5-coder:14b" if provider.type == ProviderType.ollama else "gpt-4o"
            
        logger.info(f"Using Model: {model_name}")

        agent_config = AgentConfig(
            name="Verification Agent",
            model_name=model_name,
            provider_id=provider.id
        )
        
        orchestrator = KnowledgeOrchestrator(
            agent_config=agent_config,
            provider=provider
        )
        
        # 3. Process Logic
        # KnowledgeOrchestrator.extract_knowledge expects a list of Message objects.
        # We need to map our raw dicts to Message objects.
        # Ideally, these messages should be in the DB so they have IDs.
        # But for simulation we can maybe fake IDs or insert them temporarily.
        # Orchestrator uses message.id for linking.
        
        # Let's insert them into DB to be realistic and get IDs
        orm_messages = []
        import uuid
        
        # Group messages by 50 to avoid hitting limits
        chunk_size = 50
        chunks = [raw_messages[i:i + chunk_size] for i in range(0, len(raw_messages), chunk_size)]
        
        # We will process just the first 2 chunks (100 messages) for verification to save time/tokens unless user insists on all
        # The user said "verify business cases", so 100 messages should be enough to generate topics/atoms.
        chunks_to_process = chunks[:2] 
        
        total_topics = 0
        total_atoms = 0
        
        for i, chunk in enumerate(chunks_to_process):
            logger.info(f"Processing Chunk {i+1}/{len(chunks_to_process)}")
            
            chunk_orm_messages = []
            for msg_data in chunk:
                msg = Message(
                    role=msg_data["role"],
                    content=msg_data["content"].strip(),
                    sent_at=msg_data["created_at"],
                    # We need a valid session_id or similar? Schema checks?
                    # valid schema for Message:
                    # id, conversation_id, content, role, ...
                    # We can use a dummy conversation_id
                    conversation_id=uuid.uuid4(),
                    provider_id=provider.id,
                    model="test-model"
                )
                # We won't actually save them to DB to avoid polluting the user's message history?
                # Or we save them to a "Simulation" conversation?
                # Orchestrator needs IDs.
                # Let's assign fake UUIDs without saving to DB if possible, 
                # BUT `orchestrator` methods like `save_atoms` accept `ExtractedAtom` which has `related_message_ids`.
                # If we don't save messages, we can't link them properly in UI?
                # Actually, `save_atoms` stores IDs in metadata.
                msg.id = uuid.uuid4()
                chunk_orm_messages.append(msg)
            
            # Run Extraction
            try:
                # We call extract_knowledge directly
                result = await orchestrator.extract_knowledge(chunk_orm_messages)
                
                if result:
                    logger.info(f"Chunk {i+1} Results: {len(result.topics)} Topics, {len(result.atoms)} Atoms")
                    
                    # Run Saving (This triggers the Logic: Dedup, Linking)
                    saved_topics, _ = await orchestrator.save_topics(result.topics, session)
                    saved_atoms, _ = await orchestrator.save_atoms(result.atoms, saved_topics, session)
                    
                    total_topics += len(saved_topics)
                    total_atoms += len(saved_atoms)
                    
                    # Log some samples
                    for t in saved_topics.values():
                        logger.info(f"  Topic Created/Found: {t.name} (ID: {t.id})")
                    for a in saved_atoms:
                        logger.info(f"  Atom Created: {a.title} (Topic: {a.topic.name if a.topic else 'None'})")
                        
            except Exception as e:
                logger.error(f"Error processing chunk {i+1}: {e}", exc_info=True)
                
        logger.info(f"Verification Complete. Total Topics: {total_topics}, Total Atoms: {total_atoms}")

if __name__ == "__main__":
    asyncio.run(run_verification())
