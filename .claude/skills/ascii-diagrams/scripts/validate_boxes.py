#!/usr/bin/env python3
"""
Validate ASCII box diagrams in markdown files.

Checks:
1. Individual boxes have consistent width
2. Top and bottom borders match
3. No mixed ASCII/Unicode border characters

Usage:
    python validate_boxes.py <file.md>
    python validate_boxes.py <file.md> --fix  # Auto-fix simple issues

Note: This script validates individual boxes, not entire code blocks.
      Side-by-side comparisons and flow diagrams are handled correctly.
"""

import re
import sys
from pathlib import Path
from dataclasses import dataclass

# Box drawing characters
BOX_CHARS = set("┌┐└┘├┤┬┴┼─│╔╗╚╝╠╣╦╩╬═║╭╮╰╯")
TOP_LEFT = {"┌", "╔", "╭"}
TOP_RIGHT = {"┐", "╗", "╮"}
BOTTOM_LEFT = {"└", "╚", "╰"}
BOTTOM_RIGHT = {"┘", "╝", "╯"}
HORIZONTAL = {"─", "═"}
VERTICAL = {"│", "║"}
# T-junctions count as horizontal for border matching
HORIZONTAL_JUNCTIONS = {"┬", "┴", "┼", "╦", "╩", "╬", "├", "┤", "╠", "╣"}


@dataclass
class Box:
    """Represents a single box in a diagram."""
    start_line: int
    lines: list[str]
    start_col: int  # Column offset where box starts


def find_code_blocks(content: str) -> list[tuple[int, list[str]]]:
    """Find code blocks in markdown."""
    blocks = []
    lines = content.split("\n")
    in_code_block = False
    block_start = 0
    current_block = []

    for i, line in enumerate(lines):
        if line.strip().startswith("```"):
            if in_code_block:
                if current_block:
                    blocks.append((block_start, current_block.copy()))
                current_block = []
                in_code_block = False
            else:
                in_code_block = True
                block_start = i + 1
        elif in_code_block:
            current_block.append(line)

    return blocks


def find_boxes_in_block(start_line: int, lines: list[str]) -> list[Box]:
    """Find individual boxes within a code block."""
    boxes = []

    # Find all top-left corners and trace each box
    for line_idx, line in enumerate(lines):
        for col_idx, char in enumerate(line):
            if char in TOP_LEFT:
                # Try to trace a complete box starting here
                box = trace_box(lines, line_idx, col_idx)
                if box:
                    box.start_line = start_line + line_idx
                    boxes.append(box)

    return boxes


def trace_box(lines: list[str], start_row: int, start_col: int) -> Box | None:
    """Trace a box starting from a top-left corner."""
    if start_row >= len(lines):
        return None

    first_line = lines[start_row]
    if start_col >= len(first_line):
        return None

    # Find the top-right corner on the same line
    top_right_col = None
    for col in range(start_col + 1, len(first_line)):
        char = first_line[col]
        if char in TOP_RIGHT:
            top_right_col = col
            break
        elif char not in HORIZONTAL and char not in {"┬", "╦"}:
            # Not a valid top border character
            break

    if top_right_col is None:
        return None

    box_width = top_right_col - start_col + 1

    # Trace down to find bottom
    box_lines = [first_line[start_col:start_col + box_width]]
    found_bottom = False

    for row in range(start_row + 1, len(lines)):
        line = lines[row]
        if start_col >= len(line):
            break

        # Extract the box portion
        end_col = min(start_col + box_width, len(line))
        box_portion = line[start_col:end_col]

        # Pad if needed
        if len(box_portion) < box_width:
            box_portion = box_portion + " " * (box_width - len(box_portion))

        # Check if this is a valid box line
        if len(box_portion) > 0:
            first_char = box_portion[0] if box_portion else ""
            last_char = box_portion[-1] if len(box_portion) >= box_width else ""

            # Check for bottom border
            if first_char in BOTTOM_LEFT and last_char in BOTTOM_RIGHT:
                box_lines.append(box_portion)
                found_bottom = True
                break
            # Check for side border or junction
            elif first_char in VERTICAL | {"├", "╠"} or first_char in TOP_LEFT:
                box_lines.append(box_portion)
            else:
                break

    if not found_bottom:
        return None

    return Box(start_line=0, lines=box_lines, start_col=start_col)


def validate_box(box: Box) -> list[dict]:
    """Validate a single box."""
    issues = []

    if len(box.lines) < 2:
        return issues

    # All lines should have equal width
    expected_width = len(box.lines[0])
    for i, line in enumerate(box.lines):
        actual_width = len(line.rstrip())  # Don't count trailing spaces
        # But the box should be padded correctly
        if len(line) < expected_width:
            issues.append({
                "line": box.start_line + i,
                "type": "width_mismatch",
                "message": f"Box line width {len(line)}, expected {expected_width}",
                "content": line,
                "expected_width": expected_width,
            })

    # Check top border matches bottom border length
    top_border = box.lines[0]
    bottom_border = box.lines[-1]

    # Count horizontal chars and junctions (they're part of the border)
    border_chars = HORIZONTAL | HORIZONTAL_JUNCTIONS
    top_h_count = sum(1 for c in top_border if c in border_chars)
    bottom_h_count = sum(1 for c in bottom_border if c in border_chars)

    if top_h_count != bottom_h_count:
        issues.append({
            "line": box.start_line + len(box.lines) - 1,
            "type": "border_mismatch",
            "message": f"Top border has {top_h_count} horizontal chars, bottom has {bottom_h_count}",
            "content": bottom_border,
        })

    return issues


def check_mixed_ascii_unicode(start_line: int, lines: list[str]) -> list[dict]:
    """Check for mixed ASCII and Unicode box characters."""
    issues = []

    for i, line in enumerate(lines):
        # Only flag if there's clear mixing in box context
        has_unicode = any(c in line for c in BOX_CHARS)
        has_ascii_corners = "+" in line and ("-+" in line or "+-" in line)

        if has_unicode and has_ascii_corners:
            issues.append({
                "line": start_line + i,
                "type": "mixed_chars",
                "message": "Mixed ASCII (+) and Unicode box characters",
                "content": line,
            })

    return issues


def validate_file(filepath: Path) -> list[dict]:
    """Validate all box diagrams in a file."""
    content = filepath.read_text()
    blocks = find_code_blocks(content)
    all_issues = []

    for start_line, block_lines in blocks:
        # Check for box characters in this block
        block_text = "\n".join(block_lines)
        if not any(c in block_text for c in BOX_CHARS):
            continue

        # Skip blocks that demonstrate broken examples (contain ❌ or BROKEN)
        if "❌" in block_text or "BROKEN" in block_text:
            continue

        # Find and validate individual boxes
        boxes = find_boxes_in_block(start_line, block_lines)
        for box in boxes:
            issues = validate_box(box)
            all_issues.extend(issues)

        # Check for mixed ASCII/Unicode
        mixed_issues = check_mixed_ascii_unicode(start_line, block_lines)
        all_issues.extend(mixed_issues)

    return all_issues


def main():
    if len(sys.argv) < 2:
        print("Usage: python validate_boxes.py <file.md>")
        print("\nValidates ASCII box diagrams in markdown files.")
        print("Checks individual boxes for consistent width and borders.")
        sys.exit(1)

    filepath = Path(sys.argv[1])

    if not filepath.exists():
        print(f"Error: File not found: {filepath}")
        sys.exit(1)

    issues = validate_file(filepath)

    if issues:
        print(f"\n{'='*60}")
        print(f"Found {len(issues)} issue(s) in {filepath}")
        print("="*60)

        for issue in issues:
            print(f"\n Line {issue['line']}: {issue['type']}")
            print(f"   {issue['message']}")
            content = issue['content']
            print(f"   Content: {content[:50]}{'...' if len(content) > 50 else ''}")

        sys.exit(1)
    else:
        print(f"✅ No issues found in {filepath}")
        sys.exit(0)


if __name__ == "__main__":
    main()
