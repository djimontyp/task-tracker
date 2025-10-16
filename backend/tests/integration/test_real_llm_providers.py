"""Integration tests for real LLM provider connections.

These tests verify actual connectivity with OpenAI and Ollama APIs.
They are skipped by default and require environment variables to run.

Environment variables:
- OPENAI_API_KEY: OpenAI API key for testing
- OLLAMA_BASE_URL: Ollama API base URL (default: http://localhost:11434)

Usage:
    pytest tests/integration/test_real_llm_providers.py -v -m integration
"""

import os

import pytest
from app.models.llm_provider import LLMProvider, ProviderType
from app.services.embedding_service import EmbeddingService
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.integration
@pytest.mark.skipif(not os.getenv("OPENAI_API_KEY"), reason="OPENAI_API_KEY not set")
@pytest.mark.asyncio
class TestOpenAIProvider:
    """Integration tests with real OpenAI API.

    Requires OPENAI_API_KEY environment variable.
    Tests real API connectivity and embedding generation.
    """

    async def test_openai_embedding_generation(self, db_session: AsyncSession) -> None:
        """Test real OpenAI embedding generation."""
        from app.services.credential_encryption import CredentialEncryption
        from uuid import uuid4

        encryptor = CredentialEncryption()

        provider = LLMProvider(
            id=uuid4(),
            name="OpenAI Integration Test",
            type=ProviderType.openai,
            api_key_encrypted=encryptor.encrypt(os.getenv("OPENAI_API_KEY", "")),
            is_active=True,
        )
        db_session.add(provider)
        await db_session.commit()

        service = EmbeddingService(provider)

        embedding = await service.generate_embedding("Hello, world! This is a test.")

        assert embedding is not None
        assert len(embedding) == 1536
        assert all(isinstance(x, float) for x in embedding)

        magnitude = sum(x**2 for x in embedding) ** 0.5
        assert abs(magnitude - 1.0) < 0.01

    async def test_openai_different_texts_different_embeddings(self, db_session: AsyncSession) -> None:
        """Test that different texts produce different embeddings."""
        from app.services.credential_encryption import CredentialEncryption
        from uuid import uuid4

        encryptor = CredentialEncryption()

        provider = LLMProvider(
            id=uuid4(),
            name="OpenAI Integration Test 2",
            type=ProviderType.openai,
            api_key_encrypted=encryptor.encrypt(os.getenv("OPENAI_API_KEY", "")),
            is_active=True,
        )
        db_session.add(provider)
        await db_session.commit()

        service = EmbeddingService(provider)

        embedding1 = await service.generate_embedding("FastAPI is a modern web framework")
        embedding2 = await service.generate_embedding("PostgreSQL is a relational database")

        assert embedding1 != embedding2

        cosine_similarity = sum(a * b for a, b in zip(embedding1, embedding2))
        assert cosine_similarity < 0.95

    async def test_openai_similar_texts_similar_embeddings(self, db_session: AsyncSession) -> None:
        """Test that similar texts produce similar embeddings."""
        from app.services.credential_encryption import CredentialEncryption
        from uuid import uuid4

        encryptor = CredentialEncryption()

        provider = LLMProvider(
            id=uuid4(),
            name="OpenAI Integration Test 3",
            type=ProviderType.openai,
            api_key_encrypted=encryptor.encrypt(os.getenv("OPENAI_API_KEY", "")),
            is_active=True,
        )
        db_session.add(provider)
        await db_session.commit()

        service = EmbeddingService(provider)

        embedding1 = await service.generate_embedding("The cat sits on the mat")
        embedding2 = await service.generate_embedding("A cat is sitting on a mat")

        cosine_similarity = sum(a * b for a, b in zip(embedding1, embedding2))
        assert cosine_similarity > 0.85

    async def test_openai_embedding_error_handling(self, db_session: AsyncSession) -> None:
        """Test error handling with invalid API key."""
        from app.services.credential_encryption import CredentialEncryption
        from uuid import uuid4

        encryptor = CredentialEncryption()

        provider = LLMProvider(
            id=uuid4(),
            name="OpenAI Invalid Key Test",
            type=ProviderType.openai,
            api_key_encrypted=encryptor.encrypt("sk-invalid-key-for-testing"),
            is_active=True,
        )
        db_session.add(provider)
        await db_session.commit()

        service = EmbeddingService(provider)

        with pytest.raises(Exception, match="OpenAI embedding generation failed"):
            await service.generate_embedding("This should fail")


@pytest.mark.integration
@pytest.mark.skipif(not os.getenv("OLLAMA_BASE_URL"), reason="OLLAMA_BASE_URL not set")
@pytest.mark.asyncio
class TestOllamaProvider:
    """Integration tests with real Ollama instance.

    Requires OLLAMA_BASE_URL environment variable.
    Tests real Ollama API connectivity and embedding generation.
    """

    async def test_ollama_embedding_generation(self, db_session: AsyncSession) -> None:
        """Test real Ollama embedding generation."""
        from uuid import uuid4

        provider = LLMProvider(
            id=uuid4(),
            name="Ollama Integration Test",
            type=ProviderType.ollama,
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            is_active=True,
        )
        db_session.add(provider)
        await db_session.commit()

        service = EmbeddingService(provider)

        embedding = await service.generate_embedding("Hello, world! This is a test.")

        assert embedding is not None
        assert len(embedding) > 0
        assert all(isinstance(x, float) for x in embedding)

    async def test_ollama_different_texts_different_embeddings(self, db_session: AsyncSession) -> None:
        """Test that different texts produce different embeddings."""
        from uuid import uuid4

        provider = LLMProvider(
            id=uuid4(),
            name="Ollama Integration Test 2",
            type=ProviderType.ollama,
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            is_active=True,
        )
        db_session.add(provider)
        await db_session.commit()

        service = EmbeddingService(provider)

        embedding1 = await service.generate_embedding("FastAPI is a modern web framework")
        embedding2 = await service.generate_embedding("PostgreSQL is a relational database")

        assert embedding1 != embedding2
        assert len(embedding1) == len(embedding2)

    async def test_ollama_connection_error_handling(self, db_session: AsyncSession) -> None:
        """Test error handling with invalid Ollama URL."""
        from uuid import uuid4

        provider = LLMProvider(
            id=uuid4(),
            name="Ollama Invalid URL Test",
            type=ProviderType.ollama,
            base_url="http://invalid-ollama-host:11434",
            is_active=True,
        )
        db_session.add(provider)
        await db_session.commit()

        service = EmbeddingService(provider)

        with pytest.raises(Exception, match="Ollama embedding generation failed"):
            await service.generate_embedding("This should fail")


@pytest.mark.integration
@pytest.mark.asyncio
class TestProviderValidation:
    """Test provider validation and error handling."""

    async def test_empty_text_handling(self, db_session: AsyncSession) -> None:
        """Test error handling for empty text input."""
        from app.services.credential_encryption import CredentialEncryption
        from uuid import uuid4

        encryptor = CredentialEncryption()

        provider = LLMProvider(
            id=uuid4(),
            name="Empty Text Test",
            type=ProviderType.openai,
            api_key_encrypted=encryptor.encrypt("sk-test-key"),
            is_active=True,
        )
        db_session.add(provider)
        await db_session.commit()

        service = EmbeddingService(provider)

        with pytest.raises(ValueError, match="Cannot generate embedding for empty text"):
            await service.generate_embedding("")

        with pytest.raises(ValueError, match="Cannot generate embedding for empty text"):
            await service.generate_embedding("   ")
