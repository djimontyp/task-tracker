"""CRUD operations for LLM Provider management.

Provides create, read, update, delete operations for LLM providers
with encryption support and validation scheduling.
"""

from uuid import UUID

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import (
    AgentConfig,
    LLMProvider,
    LLMProviderCreate,
    LLMProviderPublic,
    LLMProviderUpdate,
    ValidationStatus,
)
from app.services.base_crud import BaseCRUD
from app.services.credential_encryption import CredentialEncryption
from app.services.provider_validator import ProviderValidator


class ProviderCRUD(BaseCRUD[LLMProvider]):
    """CRUD service for LLM Provider operations.

    Inherits standard CRUD operations from BaseCRUD and adds
    provider-specific business logic for encryption and validation.
    """

    def __init__(
        self,
        session: AsyncSession,
        encryptor: CredentialEncryption | None = None,
        validator: ProviderValidator | None = None,
    ):
        """Initialize CRUD service.

        Args:
            session: Async database session
            encryptor: Credential encryption service (created if not provided)
            validator: Provider validation service (created if not provided)
        """
        super().__init__(LLMProvider, session)
        self.encryptor = encryptor or CredentialEncryption()
        self.validator = validator or ProviderValidator()

    async def create_provider(
        self,
        provider_data: LLMProviderCreate,
        schedule_validation: bool = True,
    ) -> LLMProviderPublic:
        """Create new LLM provider with encrypted credentials.

        Args:
            provider_data: Provider creation data
            schedule_validation: Whether to schedule async validation

        Returns:
            Created provider with public fields

        Raises:
            ValueError: If provider name already exists
        """
        existing = await self.get_by_name(provider_data.name)
        if existing:
            raise ValueError(f"Provider with name '{provider_data.name}' already exists")

        api_key_encrypted = None
        if provider_data.api_key:
            api_key_encrypted = self.encryptor.encrypt(provider_data.api_key)

        provider = LLMProvider(
            name=provider_data.name,
            type=provider_data.type,
            base_url=provider_data.base_url,
            api_key_encrypted=api_key_encrypted,
            is_active=provider_data.is_active,
            validation_status=(ValidationStatus.validating if schedule_validation else ValidationStatus.pending),
        )

        self.session.add(provider)
        await self.session.commit()
        await self.session.refresh(provider)

        if schedule_validation:
            self.validator.schedule_validation(str(provider.id))

        return LLMProviderPublic.model_validate(provider)

    async def get(self, provider_id: UUID) -> LLMProviderPublic | None:  # type: ignore[override]
        """Get provider by ID.

        Args:
            provider_id: Provider UUID

        Returns:
            Provider if found, None otherwise
        """
        provider = await super().get(provider_id)

        if provider:
            return LLMProviderPublic.model_validate(provider)
        return None

    async def get_by_name(self, name: str) -> LLMProviderPublic | None:
        """Get provider by name.

        Args:
            name: Provider name

        Returns:
            Provider if found, None otherwise
        """
        result = await self.session.execute(select(LLMProvider).where(LLMProvider.name == name))
        provider = result.scalar_one_or_none()

        if provider:
            return LLMProviderPublic.model_validate(provider)
        return None

    async def list(
        self,
        skip: int = 0,
        limit: int = 100,
        active_only: bool = False,
    ) -> list[LLMProviderPublic]:
        """List providers with pagination.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            active_only: Filter for active providers only

        Returns:
            List of providers
        """
        query = select(LLMProvider)

        if active_only:
            query = query.where(LLMProvider.is_active == True)  # noqa: E712

        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        providers = result.scalars().all()

        return [LLMProviderPublic.model_validate(p) for p in providers]

    async def update_provider(
        self,
        provider_id: UUID,
        update_data: LLMProviderUpdate,
        schedule_validation: bool = True,
    ) -> LLMProviderPublic | None:
        """Update provider configuration.

        Args:
            provider_id: Provider UUID
            update_data: Fields to update
            schedule_validation: Whether to schedule async validation

        Returns:
            Updated provider if found, None otherwise
        """
        result = await self.session.execute(select(LLMProvider).where(LLMProvider.id == provider_id))
        provider = result.scalar_one_or_none()

        if not provider:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)

        if "api_key" in update_dict:
            api_key = update_dict.pop("api_key")
            if api_key:
                update_dict["api_key_encrypted"] = self.encryptor.encrypt(api_key)
            else:
                update_dict["api_key_encrypted"] = None

        for field, value in update_dict.items():
            setattr(provider, field, value)

        connection_changed = any(k in update_dict for k in ["base_url", "api_key_encrypted"])
        if connection_changed:
            provider.validation_status = (
                ValidationStatus.validating if schedule_validation else ValidationStatus.pending
            )
            provider.validation_error = None
            provider.validated_at = None

        await self.session.commit()
        await self.session.refresh(provider)

        if schedule_validation and connection_changed:
            self.validator.schedule_validation(str(provider.id))

        return LLMProviderPublic.model_validate(provider)

    async def delete(self, provider_id: UUID) -> bool:  # type: ignore[override]
        """Delete provider.

        Args:
            provider_id: Provider UUID

        Returns:
            True if deleted, False if not found

        Behavior:
            - If provider is referenced by any AgentConfig, perform soft delete by
              setting is_active=False and return True.
            - Otherwise, perform hard delete.
        """
        provider = await super().get(provider_id)

        if not provider:
            return False

        ref_result = await self.session.execute(
            select(AgentConfig.id).where(AgentConfig.provider_id == provider_id).limit(1)
        )
        has_references = ref_result.first() is not None

        if has_references:
            provider.is_active = False
            await self.session.commit()
            return True

        return await super().delete(provider_id)

    async def get_decrypted_api_key(self, provider_id: UUID) -> str | None:
        """Get decrypted API key for provider.

        Args:
            provider_id: Provider UUID

        Returns:
            Decrypted API key if found, None otherwise

        Note:
            This method should only be used by internal services
            that need the actual API key (e.g., PydanticAI agent initialization).
            Never expose decrypted keys via API endpoints.
        """
        provider = await super().get(provider_id)

        if not provider or not provider.api_key_encrypted:
            return None

        return self.encryptor.decrypt(provider.api_key_encrypted)
