"""Unit tests for text utility functions."""

import pytest

from app.core.text_utils import strip_markdown_wrapper


class TestStripMarkdownWrapper:
    """Test cases for strip_markdown_wrapper function."""

    def test_strips_json_code_block(self) -> None:
        """Should strip ```json wrapper from JSON content."""
        input_text = '```json\n{"key": "value"}\n```'
        expected = '{"key": "value"}'

        result = strip_markdown_wrapper(input_text)

        assert result == expected, f"Expected '{expected}', got '{result}'"

    def test_strips_plain_code_block(self) -> None:
        """Should strip plain ``` wrapper without language."""
        input_text = '```\n{"key": "value"}\n```'
        expected = '{"key": "value"}'

        result = strip_markdown_wrapper(input_text)

        assert result == expected, f"Expected '{expected}', got '{result}'"

    def test_strips_javascript_code_block(self) -> None:
        """Should strip ```javascript wrapper."""
        input_text = '```javascript\n{"key": "value"}\n```'
        expected = '{"key": "value"}'

        result = strip_markdown_wrapper(input_text)

        assert result == expected, f"Expected '{expected}', got '{result}'"

    def test_trims_whitespace(self) -> None:
        """Should trim surrounding whitespace."""
        input_text = '  {"key": "value"}  '
        expected = '{"key": "value"}'

        result = strip_markdown_wrapper(input_text)

        assert result == expected, f"Expected '{expected}', got '{result}'"

    def test_returns_clean_json_unchanged(self) -> None:
        """Should return clean JSON without modification."""
        input_text = '{"key": "value"}'
        expected = '{"key": "value"}'

        result = strip_markdown_wrapper(input_text)

        assert result == expected, f"Expected '{expected}', got '{result}'"

    def test_handles_empty_string(self) -> None:
        """Should return empty string for empty input."""
        result = strip_markdown_wrapper("")

        assert result == "", f"Expected empty string, got '{result}'"

    def test_handles_multiline_json(self) -> None:
        """Should handle multiline JSON content."""
        input_text = '''```json
{
    "topics": [{"name": "Test"}],
    "atoms": []
}
```'''
        expected = '''{
    "topics": [{"name": "Test"}],
    "atoms": []
}'''

        result = strip_markdown_wrapper(input_text)

        assert result == expected, f"Expected:\n{expected}\nGot:\n{result}"

    def test_handles_nested_backticks(self) -> None:
        """Should only strip outermost wrapper."""
        input_text = '```json\n{"code": "```test```"}\n```'
        expected = '{"code": "```test```"}'

        result = strip_markdown_wrapper(input_text)

        assert result == expected, f"Expected '{expected}', got '{result}'"

    def test_handles_no_newline_after_language(self) -> None:
        """Should handle case with no newline after language tag."""
        input_text = '```json{"key": "value"}```'
        expected = '{"key": "value"}'

        result = strip_markdown_wrapper(input_text)

        assert result == expected, f"Expected '{expected}', got '{result}'"

    def test_preserves_internal_content(self) -> None:
        """Should preserve all internal content including special characters."""
        input_text = '```json\n{"message": "Hello\\nWorld", "symbols": "@#$%"}\n```'
        expected = '{"message": "Hello\\nWorld", "symbols": "@#$%"}'

        result = strip_markdown_wrapper(input_text)

        assert result == expected, f"Expected '{expected}', got '{result}'"

    def test_handles_whitespace_around_wrapper(self) -> None:
        """Should handle whitespace before and after wrapper."""
        input_text = '  \n```json\n{"key": "value"}\n```\n  '
        expected = '{"key": "value"}'

        result = strip_markdown_wrapper(input_text)

        assert result == expected, f"Expected '{expected}', got '{result}'"
