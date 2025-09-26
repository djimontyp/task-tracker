#!/usr/bin/env python3
"""
Test script for the settings system functionality.
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from backend.app.database import create_db_and_tables, get_db_session_context
from backend.core.config import settings
from backend.core.crypto import settings_crypto
from backend.core.telegram import telegram_webhook_manager


async def test_database_connection():
    """Test database connection and table creation"""
    print("🔍 Testing database connection...")
    try:
        await create_db_and_tables()
        print("✅ Database tables created successfully")
        return True
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False


async def test_encryption():
    """Test encryption/decryption functionality"""
    print("\n🔒 Testing encryption functionality...")

    test_data = "1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"

    try:
        # Encrypt
        encrypted = settings_crypto.encrypt(test_data)
        print(f"📝 Original: {test_data[:20]}...")
        print(f"🔐 Encrypted: {encrypted[:40]}...")

        # Decrypt
        decrypted = settings_crypto.decrypt(encrypted)
        print(f"🔓 Decrypted: {decrypted[:20]}...")

        if decrypted == test_data:
            print("✅ Encryption/decryption test passed")
            return True
        else:
            print("❌ Encryption/decryption test failed - data mismatch")
            return False

    except Exception as e:
        print(f"❌ Encryption error: {e}")
        return False


async def test_telegram_validation():
    """Test Telegram token validation (with fake token)"""
    print("\n📱 Testing Telegram token validation...")

    fake_token = "123456:ABC-DEF1234ghIkl"

    try:
        result = await telegram_webhook_manager.validate_bot_token(fake_token)

        # We expect this to fail with fake token
        if not result["valid"]:
            print(f"✅ Token validation correctly rejected fake token: {result['error']}")
            return True
        else:
            print("⚠️ Fake token was unexpectedly accepted")
            return False

    except Exception as e:
        print(f"❌ Telegram validation error: {e}")
        return False


async def test_settings_database():
    """Test settings database operations"""
    print("\n💾 Testing settings database operations...")

    try:
        from backend.app.models import Settings
        from backend.core.crypto import encrypt_sensitive_data, decrypt_sensitive_data
        from sqlmodel import select

        test_token = "1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
        test_webhook_url = "https://example.com"

        async with get_db_session_context() as session:
            # Create settings record
            db_settings = Settings(
                id=1,
                telegram_bot_token_encrypted=encrypt_sensitive_data(test_token),
                telegram_webhook_base_url=test_webhook_url
            )
            session.add(db_settings)
            await session.commit()
            await session.refresh(db_settings)

            print("✅ Settings record created")

            # Retrieve and verify
            statement = select(Settings).where(Settings.id == 1)
            result = await session.execute(statement)
            retrieved_settings = result.scalar_one_or_none()

            if retrieved_settings:
                decrypted_token = decrypt_sensitive_data(retrieved_settings.telegram_bot_token_encrypted)

                if decrypted_token == test_token and retrieved_settings.telegram_webhook_base_url == test_webhook_url:
                    print("✅ Settings retrieval and decryption successful")

                    # Clean up
                    await session.delete(retrieved_settings)
                    await session.commit()
                    print("✅ Test data cleaned up")

                    return True
                else:
                    print("❌ Settings data mismatch after retrieval")
                    return False
            else:
                print("❌ Settings record not found")
                return False

    except Exception as e:
        print(f"❌ Settings database error: {e}")
        return False


async def main():
    """Run all tests"""
    print("🚀 Starting Settings System Test Suite")
    print("=" * 50)

    tests = [
        ("Database Connection", test_database_connection),
        ("Encryption", test_encryption),
        ("Telegram Validation", test_telegram_validation),
        ("Settings Database", test_settings_database),
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        try:
            if await test_func():
                passed += 1
        except Exception as e:
            print(f"❌ {test_name} test failed with exception: {e}")

    print("\n" + "=" * 50)
    print(f"🏁 Test Results: {passed}/{total} passed")

    if passed == total:
        print("🎉 All tests passed! Settings system is ready.")
        return True
    else:
        print("⚠️  Some tests failed. Check the output above.")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)