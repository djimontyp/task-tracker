#!/usr/bin/env python3
"""
Add anti-delegation header to all agent files to prevent recursive delegation.

This script inserts a critical instruction after the frontmatter that prevents
agents from trying to delegate to other agents.
"""

import os
from pathlib import Path

ANTI_DELEGATION_HEADER = """
# 🚨 CRITICAL: YOU ARE A SUBAGENT - NO DELEGATION ALLOWED

**YOU ARE CURRENTLY EXECUTING AS A SPECIALIZED AGENT.**

- ❌ NEVER use Task tool to delegate to another agent
- ❌ NEVER say "I'll use X agent to..."
- ❌ NEVER say "Let me delegate to..."
- ❌ NEVER say "Передаю завдання агенту..."
- ✅ EXECUTE directly using available tools (Read, Edit, Write, Bash)
- ✅ Work autonomously and complete the task yourself

**The delegation examples in the description above are for the COORDINATOR (main Claude Code), not you.**

**If you find yourself wanting to delegate:**
1. STOP immediately
2. Re-read this instruction
3. Execute the task directly yourself

---
""".lstrip()


def process_agent_file(filepath: Path) -> bool:
    """
    Add anti-delegation header to an agent file if not already present.

    Returns True if file was modified, False otherwise.
    """
    content = filepath.read_text()

    # Check if already has anti-delegation header
    if "YOU ARE A SUBAGENT - NO DELEGATION ALLOWED" in content:
        print(f"  ⏭️  {filepath.name} - already has header, skipping")
        return False

    # Find the end of frontmatter (second ---)
    lines = content.split('\n')
    frontmatter_end = -1
    dash_count = 0

    for i, line in enumerate(lines):
        if line.strip() == '---':
            dash_count += 1
            if dash_count == 2:
                frontmatter_end = i
                break

    if frontmatter_end == -1:
        print(f"  ⚠️  {filepath.name} - no frontmatter found, skipping")
        return False

    # Insert anti-delegation header after frontmatter
    new_lines = (
        lines[:frontmatter_end + 1] +  # Include closing ---
        [''] +  # Empty line
        ANTI_DELEGATION_HEADER.split('\n') +
        lines[frontmatter_end + 1:]  # Rest of content (skip empty line if exists)
    )

    # Remove duplicate empty lines at insertion point
    while frontmatter_end + 2 < len(new_lines) and new_lines[frontmatter_end + 2].strip() == '':
        new_lines.pop(frontmatter_end + 2)

    new_content = '\n'.join(new_lines)

    # Write back
    filepath.write_text(new_content)
    print(f"  ✅ {filepath.name} - header added")
    return True


def main():
    agents_dir = Path(__file__).parent
    agent_files = sorted(agents_dir.glob("*.md"))

    print(f"🔧 Processing {len(agent_files)} agent files...\n")

    modified_count = 0
    for agent_file in agent_files:
        if process_agent_file(agent_file):
            modified_count += 1

    print(f"\n✨ Done! Modified {modified_count}/{len(agent_files)} files")


if __name__ == "__main__":
    main()
