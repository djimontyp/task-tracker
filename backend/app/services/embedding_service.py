"""Embedding generation service for vector embeddings using LLM providers.

This service handles generating vector embeddings for messages and atoms using
OpenAI and Ollama providers. Supports both single and batch embedding operations.
"""

import logging
import uuid
from typing import Protocol

import httpx
from core.config import settings
from openai import AsyncOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.atom import Atom
from app.models.llm_provider import LLMProvider, ProviderType
from app.models.message import Message
from app.models.topic import Topic
from app.services.credential_encryption import CredentialEncryption

logger = logging.getLogger(__name__)


class EmbeddingProvider(Protocol):
    """Protocol for embedding providers."""

    async def generate_embedding(self, text: str) -> list[float]: ...


class EmbeddingService:
    """Service for generating vector embeddings using LLM providers.

    Supports both OpenAI and Ollama providers for generating 1536-dimension
    embeddings. Handles API key encryption/decryption and batch processing.
    """

    def __init__(self, provider: LLMProvider):
        """Initialize embedding service with a provider.

        Args:
            provider: LLMProvider configuration that supports embeddings

        Raises:
            ValueError: If provider type doesn't support embeddings
        """
        self.provider = provider
        self.encryptor = CredentialEncryption()

        if self.provider.type not in (ProviderType.openai, ProviderType.ollama):
            raise ValueError(
                f"Provider type '{self.provider.type}' doesn't support embeddings. Supported types: openai, ollama"
            )

    async def _validate_embedding(self, embedding: list[float]) -> list[float]:
        """Validate embedding dimensions and pad if needed for database storage.

        Database uses 1536 dimensions (OpenAI ada-002 size). Ollama embeddings (768 dims)
        are padded with zeros to match database schema without migration.

        Args:
            embedding: Generated embedding vector

        Returns:
            Validated (and potentially padded) embedding vector (1536 dimensions)

        Raises:
            ValueError: If dimensions don't match expected size for provider
        """
        actual_dims = len(embedding)

        if self.provider.type == ProviderType.openai:
            expected_dims = settings.embedding.openai_embedding_dimensions
            if actual_dims != expected_dims:
                raise ValueError(
                    f"OpenAI embedding dimension mismatch: expected {expected_dims}, "
                    f"got {actual_dims} from provider '{self.provider.name}'"
                )
            return embedding

        elif self.provider.type == ProviderType.ollama:
            expected_dims = settings.embedding.ollama_embedding_dimensions
            if actual_dims != expected_dims:
                raise ValueError(
                    f"Ollama embedding dimension mismatch: expected {expected_dims}, "
                    f"got {actual_dims} from provider '{self.provider.name}'"
                )
            db_dims = 1536
            if actual_dims < db_dims:
                padded = embedding + [0.0] * (db_dims - actual_dims)
                logger.debug(
                    f"Padded Ollama embedding from {actual_dims} to {db_dims} dimensions "
                    f"for database storage (provider '{self.provider.name}')"
                )
                return padded
            return embedding

        else:
            raise ValueError(f"Unsupported provider type for validation: {self.provider.type}")

    async def generate_embedding(self, text: str) -> list[float]:
        """Generate embedding vector for given text.

        Args:
            text: Text to generate embedding for

        Returns:
            Embedding vector (1536 dimensions for OpenAI text-embedding-3-small)

        Raises:
            ValueError: If API key is missing or decryption fails
            Exception: If embedding generation fails

        Example:
            >>> service = EmbeddingService(provider)
            >>> embedding = await service.generate_embedding("Hello world")
            >>> len(embedding)
            1536
        """
        if not text or not text.strip():
            raise ValueError("Cannot generate embedding for empty text")

        api_key = None
        if self.provider.api_key_encrypted:
            try:
                api_key = self.encryptor.decrypt(self.provider.api_key_encrypted)
            except Exception as e:
                raise ValueError(f"Failed to decrypt API key for provider '{self.provider.name}': {e}") from e

        if self.provider.type == ProviderType.openai:
            return await self._generate_openai_embedding(text, api_key)
        elif self.provider.type == ProviderType.ollama:
            return await self._generate_ollama_embedding(text)
        else:
            raise ValueError(f"Unsupported provider type: {self.provider.type}")

    async def _generate_openai_embedding(self, text: str, api_key: str | None) -> list[float]:
        """Generate embedding using OpenAI.

        Args:
            text: Text to embed
            api_key: Decrypted OpenAI API key

        Returns:
            Embedding vector (1536 dimensions)

        Raises:
            ValueError: If API key is missing
            Exception: If OpenAI API call fails
        """
        if not api_key:
            raise ValueError(
                f"Provider '{self.provider.name}' requires an API key. "
                "OpenAI providers must have an API key configured."
            )

        try:
            client = AsyncOpenAI(api_key=api_key)
            response = await client.embeddings.create(
                model=settings.embedding.openai_embedding_model, input=text, encoding_format="float"
            )
            embedding = response.data[0].embedding
            return await self._validate_embedding(embedding)
        except Exception as e:
            logger.error(f"OpenAI embedding generation failed for provider '{self.provider.name}': {e}", exc_info=True)
            raise Exception(f"OpenAI embedding generation failed: {str(e)}") from e

    async def _generate_ollama_embedding(self, text: str) -> list[float]:
        """Generate embedding using Ollama.

        Args:
            text: Text to embed

        Returns:
            Embedding vector (dimensions depend on model)

        Raises:
            ValueError: If base_url is missing
            Exception: If Ollama API call fails
        """
        if not self.provider.base_url:
            raise ValueError(
                f"Provider '{self.provider.name}' is missing base_url. "
                "Ollama providers require a base_url configuration."
            )

        try:
            base_url = (
                self.provider.base_url.rstrip("/v1")
                if self.provider.base_url.endswith("/v1")
                else self.provider.base_url
            )
            embed_url = f"{base_url}/api/embed"
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    embed_url,
                    json={"model": settings.embedding.ollama_embedding_model, "input": text},
                )
                response.raise_for_status()
                data = response.json()
                embedding: list[float] = data["embeddings"][0]
                return await self._validate_embedding(embedding)
        except httpx.HTTPError as e:
            logger.error(f"Ollama embedding generation failed for provider '{self.provider.name}': {e}", exc_info=True)
            raise Exception(f"Ollama embedding generation failed: {str(e)}") from e
        except Exception as e:
            logger.error(
                f"Unexpected error during Ollama embedding for provider '{self.provider.name}': {e}", exc_info=True
            )
            raise Exception(f"Ollama embedding generation failed: {str(e)}") from e

    async def embed_message(self, session: AsyncSession, message: Message) -> Message:
        """Generate and save embedding for a message.

        Args:
            session: Database session
            message: Message to embed

        Returns:
            Updated message with embedding

        Example:
            >>> message = await session.get(Message, message_id)
            >>> updated = await service.embed_message(session, message)
            >>> assert updated.embedding is not None
        """
        has_embedding = False
        try:
            has_embedding = message.embedding is not None and len(message.embedding) > 0
        except (ValueError, AttributeError):
            has_embedding = hasattr(message.embedding, "__len__") and len(message.embedding) > 0

        if has_embedding:
            logger.debug(f"Message {message.id} already has embedding, skipping")
            return message

        try:
            embedding = await self.generate_embedding(message.content)
            message.embedding = embedding

            session.add(message)
            await session.commit()
            await session.refresh(message)

            logger.info(f"Successfully embedded message {message.id} ({len(embedding)} dimensions)")
            return message

        except Exception as e:
            logger.error(f"Failed to embed message {message.id}: {e}", exc_info=True)
            await session.rollback()
            raise

    async def embed_atom(self, session: AsyncSession, atom: Atom) -> Atom:
        """Generate and save embedding for an atom.

        Args:
            session: Database session
            atom: Atom to embed

        Returns:
            Updated atom with embedding

        Example:
            >>> atom = await session.get(Atom, atom_id)
            >>> updated = await service.embed_atom(session, atom)
            >>> assert updated.embedding is not None
        """
        has_embedding = False
        try:
            has_embedding = atom.embedding is not None and len(atom.embedding) > 0
        except (ValueError, AttributeError):
            has_embedding = hasattr(atom.embedding, "__len__") and len(atom.embedding) > 0

        if has_embedding:
            logger.debug(f"Atom {atom.id} already has embedding, skipping")
            return atom

        try:
            text = f"{atom.title}\n\n{atom.content}"
            embedding = await self.generate_embedding(text)
            atom.embedding = embedding

            session.add(atom)
            await session.commit()
            await session.refresh(atom)

            logger.info(f"Successfully embedded atom {atom.id} ({len(embedding)} dimensions)")
            return atom

        except Exception as e:
            logger.error(f"Failed to embed atom {atom.id}: {e}", exc_info=True)
            await session.rollback()
            raise

    async def embed_topic(self, session: AsyncSession, topic: Topic) -> Topic:
        """Generate and save embedding for a topic.

        Args:
            session: Database session
            topic: Topic to embed

        Returns:
            Updated topic with embedding

        Example:
            >>> topic = await session.get(Topic, topic_id)
            >>> updated = await service.embed_topic(session, topic)
            >>> assert updated.embedding is not None
        """
        try:
            has_embedding = isinstance(topic.embedding, list) and len(topic.embedding) > 0
        except Exception:
            has_embedding = False

        if has_embedding:
            logger.debug(f"Topic {topic.id} already has embedding, skipping")
            return topic

        try:
            text = f"{topic.name}\n\n{topic.description}"
            embedding = await self.generate_embedding(text)
            topic.embedding = embedding

            session.add(topic)
            await session.commit()
            await session.refresh(topic)

            logger.info(f"Successfully embedded topic {topic.id} ({len(embedding)} dimensions)")
            return topic

        except Exception as e:
            logger.error(f"Failed to embed topic {topic.id}: {e}", exc_info=True)
            await session.rollback()
            raise

    async def embed_messages_batch(
        self, session: AsyncSession, message_ids: list[uuid.UUID], batch_size: int | None = None
    ) -> dict[str, int]:
        """Batch embed multiple messages with progress tracking.

        Args:
            session: Database session
            message_ids: List of message IDs to embed
            batch_size: Number of messages to process per chunk (default: from settings)

        Returns:
            Statistics dictionary with counts:
                - success: Number of successfully embedded messages
                - failed: Number of failed embeddings
                - skipped: Number of already embedded messages

        Example:
            >>> stats = await service.embed_messages_batch(session, [1, 2, 3, 4, 5])
            >>> print(f"Success: {stats['success']}, Failed: {stats['failed']}")
        """
        if batch_size is None:
            batch_size = settings.embedding.embedding_batch_size

        stats = {"success": 0, "failed": 0, "skipped": 0}

        total_messages = len(message_ids)
        logger.info(f"Starting batch embedding for {total_messages} messages (batch_size={batch_size})")

        for i in range(0, len(message_ids), batch_size):
            chunk_ids = message_ids[i : i + batch_size]
            chunk_num = (i // batch_size) + 1
            total_chunks = (len(message_ids) + batch_size - 1) // batch_size

            logger.info(f"Processing chunk {chunk_num}/{total_chunks} ({len(chunk_ids)} messages)")

            stmt = select(Message).where(Message.id.in_(chunk_ids))  # type: ignore[union-attr]
            result = await session.execute(stmt)
            messages = result.scalars().all()

            for msg in messages:
                try:
                    has_embedding = False
                    try:
                        has_embedding = msg.embedding is not None and len(msg.embedding) > 0
                    except (ValueError, AttributeError):
                        has_embedding = hasattr(msg.embedding, "__len__") and len(msg.embedding) > 0

                    if has_embedding:
                        stats["skipped"] += 1
                        continue

                    embedding = await self.generate_embedding(msg.content)
                    msg.embedding = embedding
                    session.add(msg)
                    stats["success"] += 1

                except Exception as e:
                    logger.error(f"Failed to embed message {msg.id}: {e}")
                    stats["failed"] += 1

            try:
                await session.commit()
                logger.info(
                    f"Chunk {chunk_num}/{total_chunks} committed: "
                    f"success={stats['success']}, failed={stats['failed']}, skipped={stats['skipped']}"
                )
            except Exception as e:
                logger.error(f"Failed to commit chunk {chunk_num}: {e}")
                await session.rollback()
                stats["failed"] += len([m for m in messages if m.embedding is None])

        logger.info(
            f"Batch embedding completed: {stats['success']} success, "
            f"{stats['failed']} failed, {stats['skipped']} skipped"
        )

        return stats

    async def embed_atoms_batch(
        self, session: AsyncSession, atom_ids: list[uuid.UUID], batch_size: int | None = None
    ) -> dict[str, int]:
        """Batch embed multiple atoms with progress tracking.

        Args:
            session: Database session
            atom_ids: List of atom IDs to embed
            batch_size: Number of atoms to process per chunk (default: from settings)

        Returns:
            Statistics dictionary with counts:
                - success: Number of successfully embedded atoms
                - failed: Number of failed embeddings
                - skipped: Number of already embedded atoms

        Example:
            >>> stats = await service.embed_atoms_batch(session, [1, 2, 3, 4, 5])
            >>> print(f"Success: {stats['success']}, Failed: {stats['failed']}")
        """
        if batch_size is None:
            batch_size = settings.embedding.embedding_batch_size

        stats = {"success": 0, "failed": 0, "skipped": 0}

        total_atoms = len(atom_ids)
        logger.info(f"Starting batch embedding for {total_atoms} atoms (batch_size={batch_size})")

        for i in range(0, len(atom_ids), batch_size):
            chunk_ids = atom_ids[i : i + batch_size]
            chunk_num = (i // batch_size) + 1
            total_chunks = (len(atom_ids) + batch_size - 1) // batch_size

            logger.info(f"Processing chunk {chunk_num}/{total_chunks} ({len(chunk_ids)} atoms)")

            stmt = select(Atom).where(Atom.id.in_(chunk_ids))  # type: ignore[union-attr]
            result = await session.execute(stmt)
            atoms = result.scalars().all()

            for atom in atoms:
                try:
                    has_embedding = False
                    try:
                        has_embedding = atom.embedding is not None and len(atom.embedding) > 0
                    except (ValueError, AttributeError):
                        has_embedding = hasattr(atom.embedding, "__len__") and len(atom.embedding) > 0

                    if has_embedding:
                        stats["skipped"] += 1
                        continue

                    text = f"{atom.title}\n\n{atom.content}"
                    embedding = await self.generate_embedding(text)
                    atom.embedding = embedding
                    session.add(atom)
                    stats["success"] += 1

                except Exception as e:
                    logger.error(f"Failed to embed atom {atom.id}: {e}")
                    stats["failed"] += 1

            try:
                await session.commit()
                logger.info(
                    f"Chunk {chunk_num}/{total_chunks} committed: "
                    f"success={stats['success']}, failed={stats['failed']}, skipped={stats['skipped']}"
                )
            except Exception as e:
                logger.error(f"Failed to commit chunk {chunk_num}: {e}")
                await session.rollback()
                stats["failed"] += len([a for a in atoms if a.embedding is None])

        logger.info(
            f"Batch embedding completed: {stats['success']} success, "
            f"{stats['failed']} failed, {stats['skipped']} skipped"
        )

        return stats
