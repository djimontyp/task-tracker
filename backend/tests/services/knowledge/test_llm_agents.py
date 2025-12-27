"""Tests for LLM agent language support functions.

Tests cover:
1. get_extraction_prompt - language-specific prompt selection
2. get_strengthened_prompt - retry prompt with emphasis
3. validate_output_language - langdetect validation
"""

import pytest

from app.services.knowledge.llm_agents import (
    KNOWLEDGE_EXTRACTION_PROMPT_EN,
    KNOWLEDGE_EXTRACTION_PROMPT_UK,
    get_extraction_prompt,
    get_strengthened_prompt,
    validate_output_language,
)


class TestGetExtractionPrompt:
    """Tests for get_extraction_prompt function."""

    def test_returns_ukrainian_prompt_by_default(self) -> None:
        """Default language should be Ukrainian."""
        prompt = get_extraction_prompt()
        assert prompt == KNOWLEDGE_EXTRACTION_PROMPT_UK

    def test_returns_ukrainian_prompt_explicitly(self) -> None:
        """Explicit 'uk' should return Ukrainian prompt."""
        prompt = get_extraction_prompt("uk")
        assert prompt == KNOWLEDGE_EXTRACTION_PROMPT_UK
        assert "УКРАЇНСЬКОЮ" in prompt or "українською" in prompt

    def test_returns_english_prompt(self) -> None:
        """'en' should return English prompt."""
        prompt = get_extraction_prompt("en")
        assert prompt == KNOWLEDGE_EXTRACTION_PROMPT_EN
        assert "JSON" in prompt

    def test_unknown_language_falls_back_to_english(self) -> None:
        """Unknown language code should fall back to English."""
        prompt = get_extraction_prompt("fr")
        assert prompt == KNOWLEDGE_EXTRACTION_PROMPT_EN


class TestGetStrengthenedPrompt:
    """Tests for get_strengthened_prompt function."""

    def test_strengthened_ukrainian_prompt(self) -> None:
        """Ukrainian strengthened prompt should have emphasis."""
        prompt = get_strengthened_prompt("uk")
        assert "IMPORTANT LANGUAGE REQUIREMENT" in prompt
        assert "Ukrainian" in prompt
        assert "NOT in Ukrainian" in prompt

    def test_strengthened_english_prompt(self) -> None:
        """English strengthened prompt should have emphasis."""
        prompt = get_strengthened_prompt("en")
        assert "IMPORTANT LANGUAGE REQUIREMENT" in prompt
        assert "EN" in prompt

    def test_strengthened_prompt_contains_base(self) -> None:
        """Strengthened prompt should contain base prompt."""
        base = get_extraction_prompt("uk")
        strengthened = get_strengthened_prompt("uk")
        # Base prompt should be included
        assert base in strengthened or strengthened.startswith(base[:100])


class TestValidateOutputLanguage:
    """Tests for validate_output_language function."""

    def test_validates_ukrainian_text(self) -> None:
        """Should correctly identify Ukrainian text."""
        ukrainian_text = (
            "Це тема про розробку програмного забезпечення. "
            "Обговорюються питання архітектури та дизайну системи."
        )
        assert validate_output_language(ukrainian_text, "uk") is True

    def test_validates_english_text(self) -> None:
        """Should correctly identify English text."""
        english_text = (
            "This is a topic about software development. "
            "We discuss architecture and system design questions."
        )
        assert validate_output_language(english_text, "en") is True

    def test_detects_language_mismatch(self) -> None:
        """Should detect when text language doesn't match expected."""
        english_text = (
            "This is a topic about software development. "
            "We discuss architecture and system design questions."
        )
        # English text should fail Ukrainian validation
        result = validate_output_language(english_text, "uk")
        assert result is False

    def test_skips_validation_for_short_text(self) -> None:
        """Should skip validation for very short text."""
        short_text = "Hello"
        # Short text should pass regardless of language
        assert validate_output_language(short_text, "uk") is True
        assert validate_output_language(short_text, "en") is True

    def test_skips_validation_for_empty_text(self) -> None:
        """Should skip validation for empty text."""
        assert validate_output_language("", "uk") is True
        assert validate_output_language("   ", "en") is True

    def test_handles_mixed_content_gracefully(self) -> None:
        """Should handle mixed language content (returns detected language)."""
        # Mixed content - langdetect will pick dominant language
        mixed_text = "Software Development Project. Architecture Overview."
        # This should detect as English
        result = validate_output_language(mixed_text, "en")
        assert result is True
