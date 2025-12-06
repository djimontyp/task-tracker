#!/usr/bin/env python3
"""
Scan docs/content/{en,uk}/ structure and extract file titles/descriptions.

Outputs a structured markdown tree with document titles from frontmatter.
"""

import re
from pathlib import Path
from typing import Dict, List, Optional


def extract_frontmatter_title(file_path: Path) -> Optional[str]:
    """Extract title from markdown frontmatter if present."""
    try:
        content = file_path.read_text(encoding="utf-8")
        frontmatter_match = re.match(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
        if frontmatter_match:
            frontmatter = frontmatter_match.group(1)
            title_match = re.search(r"^title:\s*(.+)$", frontmatter, re.MULTILINE)
            if title_match:
                return title_match.group(1).strip().strip('"\'')
    except Exception:
        pass
    return None


def build_tree(root: Path, prefix: str = "", is_last: bool = True) -> List[str]:
    """Build tree structure recursively."""
    lines = []

    if not root.exists():
        return lines

    items = sorted(root.iterdir(), key=lambda p: (not p.is_dir(), p.name))

    for i, item in enumerate(items):
        is_last_item = i == len(items) - 1
        connector = "└── " if is_last_item else "├── "

        if item.is_dir():
            lines.append(f"{prefix}{connector}{item.name}/")
            extension = "    " if is_last_item else "│   "
            lines.extend(build_tree(item, prefix + extension, is_last_item))
        else:
            title = extract_frontmatter_title(item)
            if title and title != item.stem:
                lines.append(f"{prefix}{connector}{item.name} - {title}")
            else:
                lines.append(f"{prefix}{connector}{item.name}")

    return lines


def scan_docs(docs_path: Path) -> str:
    """Scan docs structure and return markdown formatted tree."""
    output = []

    content_path = docs_path / "content"
    if not content_path.exists():
        return "❌ docs/content/ not found"

    output.append("docs/content/")

    for lang in ["en", "uk"]:
        lang_path = content_path / lang
        if lang_path.exists():
            output.append(f"├── {lang}/")
            tree_lines = build_tree(lang_path, "│   ")
            output.extend(tree_lines)

    return "\n".join(output)


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        docs_dir = Path(sys.argv[1])
    else:
        docs_dir = Path.cwd() / "docs"

    result = scan_docs(docs_dir)
    print(result)