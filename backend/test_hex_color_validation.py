"""Tests for hex color validation and conversion utilities."""

import pytest
from app.models.topic import (
    auto_select_color,
    convert_to_hex_if_needed,
    validate_hex_color,
)


class TestHexColorValidation:
    """Test hex color validation functionality."""

    def test_validate_hex_color_valid_formats(self):
        """Test valid hex color formats."""
        # Test valid 6-digit hex codes
        assert validate_hex_color("#FF5733") == "#FF5733"
        assert validate_hex_color("#ff5733") == "#FF5733"
        assert validate_hex_color("#000000") == "#000000"
        assert validate_hex_color("#FFFFFF") == "#FFFFFF"

        # Test without hash symbol
        assert validate_hex_color("FF5733") == "#FF5733"
        assert validate_hex_color("ff5733") == "#FF5733"

    def test_validate_hex_color_invalid_formats(self):
        """Test invalid hex color formats."""
        # Empty string
        with pytest.raises(ValueError, match="Color cannot be empty"):
            validate_hex_color("")

        # Too short
        with pytest.raises(ValueError, match="Invalid hex color format"):
            validate_hex_color("#F57")

        # Too long
        with pytest.raises(ValueError, match="Invalid hex color format"):
            validate_hex_color("#FF57333")

        # Invalid characters
        with pytest.raises(ValueError, match="Invalid hex color format"):
            validate_hex_color("#GG5733")

        # Invalid format
        with pytest.raises(ValueError, match="Invalid hex color format"):
            validate_hex_color("FF57GG")

    def test_convert_to_hex_if_needed_hex_input(self):
        """Test conversion when input is already hex."""
        # Valid hex codes
        assert convert_to_hex_if_needed("#FF5733") == "#FF5733"
        assert convert_to_hex_if_needed("#ff5733") == "#FF5733"
        assert convert_to_hex_if_needed("FF5733") == "#FF5733"

        # Valid hex codes with hash
        assert convert_to_hex_if_needed("#ABCDEF") == "#ABCDEF"
        assert convert_to_hex_if_needed("abcdef") == "#ABCDEF"

    def test_convert_to_hex_if_needed_tailwind_names(self):
        """Test conversion of Tailwind color names to hex."""
        # Test known Tailwind colors
        assert convert_to_hex_if_needed("blue") == "#3B82F6"
        assert convert_to_hex_if_needed("emerald") == "#10B981"
        assert convert_to_hex_if_needed("amber") == "#F59E0B"
        assert convert_to_hex_if_needed("purple") == "#A855F7"
        assert convert_to_hex_if_needed("rose") == "#F43F5E"
        assert convert_to_hex_if_needed("green") == "#22C55E"
        assert convert_to_hex_if_needed("cyan") == "#06B6D4"
        assert convert_to_hex_if_needed("sky") == "#0EA5E9"
        assert convert_to_hex_if_needed("violet") == "#8B5CF6"
        assert convert_to_hex_if_needed("orange") == "#F97316"
        assert convert_to_hex_if_needed("indigo") == "#6366F1"
        assert convert_to_hex_if_needed("pink") == "#EC4899"
        assert convert_to_hex_if_needed("teal") == "#14B8A6"
        assert convert_to_hex_if_needed("red") == "#EF4444"
        assert convert_to_hex_if_needed("slate") == "#64748B"
        assert convert_to_hex_if_needed("fuchsia") == "#D946EF"

        # Test case insensitive
        assert convert_to_hex_if_needed("BLUE") == "#3B82F6"
        assert convert_to_hex_if_needed("Blue") == "#3B82F6"

        # Test unknown color names (should default to slate)
        assert convert_to_hex_if_needed("unknown") == "#64748B"
        assert convert_to_hex_if_needed("custom") == "#64748B"

    def test_convert_to_hex_if_needed_empty_input(self):
        """Test conversion with empty or None input."""
        assert convert_to_hex_if_needed("") == "#64748B"
        assert convert_to_hex_if_needed(None) == "#64748B"  # type: ignore[arg-type]

    def test_auto_select_color_hex_output(self):
        """Test that auto_select_color returns hex codes."""
        # Test known icons
        assert auto_select_color("BriefcaseIcon") == "#3B82F6"
        assert auto_select_color("ShoppingCartIcon") == "#10B981"
        assert auto_select_color("LightBulbIcon") == "#F59E0B"
        assert auto_select_color("AcademicCapIcon") == "#A855F7"
        assert auto_select_color("HeartIcon") == "#F43F5E"

        # Test unknown icon (should default to slate)
        assert auto_select_color("UnknownIcon") == "#64748B"

    def test_hex_color_format_consistency(self):
        """Test that all hex colors are consistent uppercase format."""
        # Test that all predefined colors are uppercase
        for color in [
            "#3B82F6",
            "#10B981",
            "#F59E0B",
            "#A855F7",
            "#F43F5E",
            "#22C55E",
            "#06B6D4",
            "#0EA5E9",
            "#8B5CF6",
            "#F97316",
            "#6366F1",
            "#EC4899",
            "#14B8A6",
            "#EF4444",
            "#64748B",
            "#D946EF",
        ]:
            assert color == color.upper()
            assert len(color) == 7
            assert color.startswith("#")
            assert all(c in "0123456789ABCDEF" for c in color[1:])
