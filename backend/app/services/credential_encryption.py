"""Credential encryption service using Fernet symmetric encryption.

Provides secure encryption/decryption for LLM provider API keys and other
sensitive credentials stored in the database.
"""

from cryptography.fernet import Fernet, InvalidToken

from core.config import settings


class CredentialEncryption:
    """Service for encrypting/decrypting provider credentials.

    Uses Fernet (symmetric encryption) with key from environment variable.
    All credentials are encrypted before storage and decrypted on retrieval.
    """

    def __init__(self):
        """Initialize encryption service with key from settings.

        Raises:
            ValueError: If ENCRYPTION_KEY not configured in settings
        """
        if not settings.encryption_key:
            raise ValueError(
                "ENCRYPTION_KEY not configured. Generate with: "
                'python -c "from cryptography.fernet import Fernet; '
                'print(Fernet.generate_key().decode())"'
            )

        # Ensure key is bytes for Fernet
        key = settings.encryption_key
        if isinstance(key, str):
            key = key.encode()

        self._fernet = Fernet(key)

    def encrypt(self, plaintext: str) -> bytes:
        """Encrypt plaintext credential.

        Args:
            plaintext: Credential to encrypt (e.g., API key)

        Returns:
            Encrypted bytes suitable for database storage

        Example:
            encryptor = CredentialEncryption()
            encrypted = encryptor.encrypt("sk-abc123...")
            # Store encrypted in database
        """
        if not plaintext:
            raise ValueError("Cannot encrypt empty credential")

        plaintext_bytes = plaintext.encode("utf-8")
        encrypted_bytes = self._fernet.encrypt(plaintext_bytes)
        return encrypted_bytes

    def decrypt(self, encrypted: bytes) -> str:
        """Decrypt encrypted credential.

        Args:
            encrypted: Encrypted credential bytes from database

        Returns:
            Decrypted plaintext credential

        Raises:
            InvalidToken: If encrypted data is corrupted or key is wrong

        Example:
            encryptor = CredentialEncryption()
            plaintext = encryptor.decrypt(provider.api_key_encrypted)
            # Use plaintext API key for provider authentication
        """
        if not encrypted:
            raise ValueError("Cannot decrypt empty data")

        try:
            decrypted_bytes = self._fernet.decrypt(encrypted)
            return decrypted_bytes.decode("utf-8")
        except InvalidToken as e:
            raise ValueError(
                "Failed to decrypt credential - invalid key or corrupted data"
            ) from e

    @staticmethod
    def generate_key() -> str:
        """Generate new Fernet encryption key.

        Returns:
            Base64-encoded encryption key suitable for ENCRYPTION_KEY env var

        Example:
            key = CredentialEncryption.generate_key()
            # Add to .env: ENCRYPTION_KEY=<key>
        """
        return Fernet.generate_key().decode()
