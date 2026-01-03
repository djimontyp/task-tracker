"""Text utility functions for LLM response processing.

This module provides utilities for cleaning and processing text from LLM responses,
including stripping markdown code block wrappers that models sometimes add.
"""

import re


def strip_markdown_wrapper(text: str) -> str:
    """Strip markdown code block wrappers from text.

    LLM models sometimes wrap JSON responses in markdown code blocks like:
    - ```json ... ```
    - ``` ... ```
    - ```javascript ... ```

    This function removes these wrappers and returns clean content.

    Args:
        text: Input text that may contain markdown wrappers

    Returns:
        Clean text with markdown wrappers removed and whitespace trimmed

    Examples:
        >>> strip_markdown_wrapper("```json\\n{\"key\": \"value\"}\\n```")
        '{"key": "value"}'

        >>> strip_markdown_wrapper("  {\"key\": \"value\"}  ")
        '{"key": "value"}'

        >>> strip_markdown_wrapper("```\\n{\"key\": \"value\"}\\n```")
        '{"key": "value"}'
    """
    if not text:
        return text

    result = text.strip()

    # Pattern matches: ```[optional_language]\n content \n```
    # Handles: ```json, ```, ```javascript, etc.
    pattern = r"^```(?:\w+)?\s*\n?(.*?)\n?```$"
    match = re.match(pattern, result, re.DOTALL)

    if match:
        result = match.group(1).strip()

    return result
