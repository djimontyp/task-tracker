"""
Comprehensive tests for the crypto module (AES-256-GCM encryption/decryption).

Tests cover:
- Basic encryption/decryption roundtrip
- Key derivation consistency
- Error handling for corrupted data
- Edge cases and security considerations
- Performance characteristics
"""
import os
import pytest
from unittest.mock import patch
from cryptography.exceptions import InvalidTag

from core.crypto import SettingsCrypto, encrypt_sensitive_data, decrypt_sensitive_data


class TestSettingsCrypto:
    """Test suite for SettingsCrypto class"""

    def test_crypto_initialization(self):
        """Test that crypto instance initializes correctly"""
        crypto = SettingsCrypto()
        assert crypto._key is not None
        assert len(crypto._key) == 32  # 256 bits / 8 = 32 bytes

    def test_key_derivation_consistency(self):
        """Test that the same environment produces the same key"""
        crypto1 = SettingsCrypto()
        crypto2 = SettingsCrypto()
        assert crypto1._key == crypto2._key

    @patch.dict(os.environ, {"SETTINGS_ENCRYPTION_KEY": "test-custom-key"})
    def test_custom_encryption_key(self):
        """Test that custom encryption key from environment is used"""
        crypto_custom = SettingsCrypto()
        crypto_default = SettingsCrypto()

        # Reset env and create new instance
        with patch.dict(os.environ, {}, clear=True):
            crypto_no_key = SettingsCrypto()

        # Custom key should produce different derived key than default
        assert crypto_custom._key != crypto_no_key._key

    def test_encrypt_decrypt_roundtrip_basic(self):
        """Test basic encryption/decryption roundtrip"""
        crypto = SettingsCrypto()
        original_text = "test_bot_token:1234567890:ABC-DEF"

        encrypted = crypto.encrypt(original_text)
        decrypted = crypto.decrypt(encrypted)

        assert decrypted == original_text
        assert encrypted != original_text
        assert len(encrypted) > 0

    def test_encrypt_decrypt_roundtrip_empty_string(self):
        """Test encryption/decryption with empty string"""
        crypto = SettingsCrypto()

        encrypted = crypto.encrypt("")
        decrypted = crypto.decrypt("")

        assert encrypted == ""
        assert decrypted == ""

    def test_encrypt_decrypt_unicode_characters(self):
        """Test encryption/decryption with Unicode characters"""
        crypto = SettingsCrypto()
        unicode_text = "Тест із українськими символами: 1234567890:АБВ-ГДЕ"

        encrypted = crypto.encrypt(unicode_text)
        decrypted = crypto.decrypt(encrypted)

        assert decrypted == unicode_text

    def test_encrypt_decrypt_long_text(self):
        """Test encryption/decryption with long text"""
        crypto = SettingsCrypto()
        long_text = "x" * 10000  # 10KB of text

        encrypted = crypto.encrypt(long_text)
        decrypted = crypto.decrypt(encrypted)  # Fix: decrypt the encrypted data, not original text

        assert decrypted == long_text

    def test_encrypt_produces_different_outputs(self):
        """Test that encrypting the same text produces different outputs (due to random IV)"""
        crypto = SettingsCrypto()
        text = "same_text_each_time"

        encrypted1 = crypto.encrypt(text)
        encrypted2 = crypto.encrypt(text)

        # Different encrypted outputs due to random IV
        assert encrypted1 != encrypted2

        # But both decrypt to the same original text
        assert crypto.decrypt(encrypted1) == text
        assert crypto.decrypt(encrypted2) == text

    def test_decrypt_corrupted_data(self):
        """Test that decrypting corrupted data raises appropriate error"""
        crypto = SettingsCrypto()

        with pytest.raises(ValueError, match="Failed to decrypt data"):
            crypto.decrypt("corrupted_base64_data")

    def test_decrypt_invalid_base64(self):
        """Test decryption with invalid base64 encoding"""
        crypto = SettingsCrypto()

        with pytest.raises(ValueError, match="Failed to decrypt data"):
            crypto.decrypt("not_valid_base64!")

    def test_decrypt_truncated_data(self):
        """Test decryption with truncated encrypted data"""
        crypto = SettingsCrypto()
        original_text = "test_data"

        encrypted = crypto.encrypt(original_text)
        # Truncate the encrypted data
        truncated = encrypted[:-10]

        with pytest.raises(ValueError, match="Failed to decrypt data"):
            crypto.decrypt(truncated)

    def test_decrypt_with_wrong_key(self):
        """Test that data encrypted with one key cannot be decrypted with another"""
        crypto1 = SettingsCrypto()

        # Mock different environment for second crypto instance
        with patch.dict(os.environ, {"SETTINGS_ENCRYPTION_KEY": "different-key"}):
            crypto2 = SettingsCrypto()

        text = "secret_token"
        encrypted_with_crypto1 = crypto1.encrypt(text)

        # Should fail to decrypt with different key
        with pytest.raises(ValueError, match="Failed to decrypt data"):
            crypto2.decrypt(encrypted_with_crypto1)

    def test_encryption_includes_authentication(self):
        """Test that encrypted data includes authentication tag (tamper detection)"""
        crypto = SettingsCrypto()
        original_text = "authenticated_data"

        encrypted = crypto.encrypt(original_text)

        # Manually tamper with encrypted data
        import base64
        encrypted_bytes = base64.b64decode(encrypted.encode('utf-8'))

        # Flip a bit in the ciphertext portion (after IV, before auth tag)
        tampered_bytes = bytearray(encrypted_bytes)
        tampered_bytes[15] ^= 1  # Flip one bit
        tampered_encrypted = base64.b64encode(tampered_bytes).decode('utf-8')

        # Should fail due to authentication tag mismatch
        with pytest.raises(ValueError, match="Failed to decrypt data"):
            crypto.decrypt(tampered_encrypted)

    def test_encrypted_data_structure(self):
        """Test that encrypted data has expected structure (IV + ciphertext + tag)"""
        crypto = SettingsCrypto()
        text = "test_structure"

        encrypted = crypto.encrypt(text)

        # Should be base64 encoded
        import base64
        try:
            encrypted_bytes = base64.b64decode(encrypted.encode('utf-8'))
        except Exception:
            pytest.fail("Encrypted data is not valid base64")

        # Should have minimum size: 12 bytes IV + some ciphertext + 16 bytes auth tag
        min_expected_size = 12 + len(text.encode('utf-8')) + 16
        assert len(encrypted_bytes) >= min_expected_size

    def test_performance_large_data(self):
        """Test encryption/decryption performance with large data"""
        import time

        crypto = SettingsCrypto()
        large_text = "A" * 100000  # 100KB

        # Measure encryption time
        start_time = time.time()
        encrypted = crypto.encrypt(large_text)
        encrypt_time = time.time() - start_time

        # Measure decryption time
        start_time = time.time()
        decrypted = crypto.decrypt(encrypted)
        decrypt_time = time.time() - start_time

        assert decrypted == large_text

        # Should be reasonably fast (< 1 second for 100KB)
        assert encrypt_time < 1.0
        assert decrypt_time < 1.0


class TestGlobalCryptoFunctions:
    """Test suite for global convenience functions"""

    def test_global_encrypt_function(self):
        """Test global encrypt_sensitive_data function"""
        data = "global_test_data"
        encrypted = encrypt_sensitive_data(data)

        assert encrypted != data
        assert len(encrypted) > 0

    def test_global_decrypt_function(self):
        """Test global decrypt_sensitive_data function"""
        data = "global_test_data"
        encrypted = encrypt_sensitive_data(data)
        decrypted = decrypt_sensitive_data(encrypted)

        assert decrypted == data

    def test_global_functions_roundtrip(self):
        """Test roundtrip with global functions"""
        original = "1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"

        encrypted = encrypt_sensitive_data(original)
        decrypted = decrypt_sensitive_data(encrypted)

        assert decrypted == original
        assert encrypted != original

    def test_global_functions_empty_data(self):
        """Test global functions with empty data"""
        assert encrypt_sensitive_data("") == ""
        assert decrypt_sensitive_data("") == ""

    def test_global_functions_use_same_instance(self):
        """Test that global functions use the same crypto instance"""
        data = "consistency_test"

        # Multiple calls should work consistently
        encrypted1 = encrypt_sensitive_data(data)
        encrypted2 = encrypt_sensitive_data(data)

        # Both should decrypt successfully with the same function
        assert decrypt_sensitive_data(encrypted1) == data
        assert decrypt_sensitive_data(encrypted2) == data


class TestSecurityConsiderations:
    """Test security-related aspects of the crypto implementation"""

    def test_key_not_exposed_in_memory(self):
        """Test that key is not easily exposed in object representation"""
        crypto = SettingsCrypto()

        # Key should not appear in string representation
        crypto_str = str(crypto)
        crypto_repr = repr(crypto)

        # The actual key bytes should not be visible
        assert crypto._key.hex() not in crypto_str
        assert crypto._key.hex() not in crypto_repr

    def test_salt_consistency(self):
        """Test that salt is consistent across instances"""
        # This ensures consistent key derivation
        crypto1 = SettingsCrypto()
        crypto2 = SettingsCrypto()

        # Same environment should produce same key
        assert crypto1._key == crypto2._key

    @patch.dict(os.environ, {}, clear=True)
    def test_default_key_fallback(self):
        """Test that system works with default key when no env var is set"""
        crypto = SettingsCrypto()
        test_data = "fallback_test"

        encrypted = crypto.encrypt(test_data)
        decrypted = crypto.decrypt(encrypted)

        assert decrypted == test_data

    def test_token_patterns(self):
        """Test encryption/decryption with various token patterns"""
        crypto = SettingsCrypto()

        token_patterns = [
            "1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",  # Telegram bot token pattern
            "xoxb-1234567890123-1234567890123-ABCDEFGHIJKLMNOPQRSTUVWX",  # Slack bot token pattern
            "ghp_1234567890abcdef1234567890abcdef12345678",  # GitHub personal access token
            "",  # Empty token
            "short",  # Very short token
            "x" * 1000,  # Very long token
        ]

        for token in token_patterns:
            encrypted = crypto.encrypt(token)
            decrypted = crypto.decrypt(encrypted)
            assert decrypted == token, f"Failed for token pattern: {token[:20]}..."