"""
Encryption and decryption utilities for sensitive configuration data.

Uses AES-256-GCM for authenticated encryption with a key derived from environment.
"""

import base64
import os

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


class SettingsCrypto:
    """Handles encryption/decryption of sensitive settings data"""

    def __init__(self) -> None:
        self._key = self._derive_key()

    def _derive_key(self) -> bytes:
        """Derive encryption key from environment or generate a default one"""
        salt = b"task-tracker-settings-salt-v1"
        password = os.environ.get("SETTINGS_ENCRYPTION_KEY", "default-dev-key").encode()

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,  # 256 bits for AES-256
            salt=salt,
            iterations=100000,
            backend=default_backend(),
        )
        return kdf.derive(password)

    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt a plaintext string and return base64-encoded result

        Args:
            plaintext: String to encrypt

        Returns:
            Base64-encoded string containing IV + encrypted data + auth tag
        """
        if not plaintext:
            return ""

        # Generate random IV (12 bytes for GCM)
        iv = os.urandom(12)

        # Create cipher
        cipher = Cipher(algorithms.AES(self._key), modes.GCM(iv), backend=default_backend())
        encryptor = cipher.encryptor()

        # Encrypt the data
        ciphertext = encryptor.update(plaintext.encode()) + encryptor.finalize()

        # Combine IV + ciphertext + auth tag
        encrypted_data = iv + ciphertext + encryptor.tag

        # Return base64 encoded result
        return base64.b64encode(encrypted_data).decode("utf-8")

    def decrypt(self, encrypted_data: str) -> str:
        """
        Decrypt a base64-encoded encrypted string

        Args:
            encrypted_data: Base64-encoded encrypted string

        Returns:
            Decrypted plaintext string

        Raises:
            ValueError: If decryption fails or data is corrupted
        """
        if not encrypted_data:
            return ""

        try:
            # Decode from base64
            data = base64.b64decode(encrypted_data.encode("utf-8"))

            # Extract components (IV: 12 bytes, tag: 16 bytes at end)
            iv = data[:12]
            ciphertext = data[12:-16]
            tag = data[-16:]

            # Create cipher
            cipher = Cipher(algorithms.AES(self._key), modes.GCM(iv, tag), backend=default_backend())
            decryptor = cipher.decryptor()

            # Decrypt and return
            plaintext = decryptor.update(ciphertext) + decryptor.finalize()
            return plaintext.decode("utf-8")

        except Exception as e:
            raise ValueError(f"Failed to decrypt data: {e}")


# Global instance for use throughout the application
settings_crypto = SettingsCrypto()


def encrypt_sensitive_data(data: str) -> str:
    """Convenience function to encrypt sensitive data"""
    return settings_crypto.encrypt(data)


def decrypt_sensitive_data(encrypted_data: str) -> str:
    """Convenience function to decrypt sensitive data"""
    return settings_crypto.decrypt(encrypted_data)
