#!/usr/bin/env python3
"""
Batch document converter using Docling.

Converts documents from a directory to Markdown/JSON/HTML with:
- Clean, slugified filenames
- Automatic numbering based on original order
- Index file with table of contents
- Support for custom filename mappings

Usage:
    uv run python .claude/skills/docling/scripts/convert_docs.py \
        --input /path/to/documents \
        --output /path/to/output \
        --format md
"""

import argparse
import json
import re
import shutil
from pathlib import Path
from typing import Optional

from docling.document_converter import DocumentConverter

SUPPORTED_EXTENSIONS = {".pptx", ".pdf", ".docx", ".xlsx", ".html", ".png", ".jpg", ".jpeg", ".tiff"}


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text)
    return text.strip("-")


def extract_number(filename: str) -> tuple[int, str]:
    """Extract leading number from filename for sorting."""
    match = re.match(r"^(\d+)[._\s-]*(.*)$", filename)
    if match:
        return int(match.group(1)), match.group(2)
    return 999, filename


def generate_clean_name(original: str, index: int, prefix: str = "") -> str:
    """Generate clean filename from original."""
    stem = Path(original).stem
    _, name_part = extract_number(stem)

    name_part = re.sub(r"\(\d+\)$", "", name_part).strip()
    slug = slugify(name_part) or f"document-{index}"

    if prefix:
        return f"{prefix}-{index:02d}-{slug}"
    return f"{index:02d}-{slug}"


def load_mapping(mapping_file: Optional[Path]) -> dict[str, str]:
    """Load custom filename mapping from JSON file."""
    if mapping_file and mapping_file.exists():
        return json.loads(mapping_file.read_text())
    return {}


def convert_documents(
    input_dir: Path,
    output_dir: Path,
    output_format: str = "md",
    prefix: str = "",
    mapping_file: Optional[Path] = None,
    copy_assets: bool = True,
) -> list[dict]:
    """Convert all documents in directory."""
    output_dir.mkdir(parents=True, exist_ok=True)

    custom_mapping = load_mapping(mapping_file)

    files = [
        f for f in input_dir.iterdir()
        if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS
    ]
    files.sort(key=lambda f: extract_number(f.name))

    asset_files = [
        f for f in input_dir.iterdir()
        if f.is_file() and f.suffix.lower() in {".jpg", ".jpeg", ".png", ".gif", ".svg"}
        and f.suffix.lower() not in SUPPORTED_EXTENSIONS
    ]

    if copy_assets:
        for asset in asset_files:
            dest = output_dir / slugify(asset.stem) + asset.suffix.lower()
            shutil.copy(asset, dest)
            print(f"Copied asset: {asset.name} -> {dest.name}")

    converter = DocumentConverter()
    results = []

    for idx, source_file in enumerate(files, 1):
        original_name = source_file.name

        if original_name in custom_mapping:
            clean_name = custom_mapping[original_name]
        else:
            clean_name = generate_clean_name(original_name, idx, prefix)

        print(f"[{idx}/{len(files)}] Converting: {original_name} -> {clean_name}.{output_format}")

        try:
            result = converter.convert(str(source_file))

            if result.status.name != "SUCCESS":
                print(f"  WARNING: Conversion status: {result.status.name}")

            output_file = output_dir / f"{clean_name}.{output_format}"

            if output_format == "md":
                content = result.document.export_to_markdown()
                title = extract_title(original_name)
                full_content = f"# {title}\n\n> Source: `{original_name}`\n\n---\n\n{content}"
                output_file.write_text(full_content, encoding="utf-8")
            elif output_format == "json":
                result.document.save_as_json(output_file)
            elif output_format == "html":
                result.document.save_as_html(output_file)
            else:
                content = result.document.export_to_text()
                output_file.write_text(content, encoding="utf-8")

            results.append({
                "original": original_name,
                "output": f"{clean_name}.{output_format}",
                "title": extract_title(original_name),
                "status": "success",
            })
            print(f"  -> Saved: {output_file.name}")

        except Exception as e:
            print(f"  ERROR: {e}")
            results.append({
                "original": original_name,
                "output": None,
                "title": extract_title(original_name),
                "status": f"error: {e}",
            })

    return results


def extract_title(filename: str) -> str:
    """Extract human-readable title from filename."""
    stem = Path(filename).stem
    _, name_part = extract_number(stem)
    name_part = re.sub(r"\(\d+\)$", "", name_part).strip()
    name_part = re.sub(r"[_-]+", " ", name_part)
    return name_part.strip() or stem


def create_index(output_dir: Path, results: list[dict], title: str = "Document Index") -> None:
    """Create README.md index file."""
    content = f"# {title}\n\n"
    content += "## Contents\n\n"
    content += "| # | Topic | File | Status |\n"
    content += "|---|-------|------|--------|\n"

    for idx, item in enumerate(results, 1):
        status_icon = "✅" if item["status"] == "success" else "❌"
        if item["output"]:
            content += f"| {idx:02d} | [{item['title']}](./{item['output']}) | `{item['output']}` | {status_icon} |\n"
        else:
            content += f"| {idx:02d} | {item['title']} | - | {status_icon} {item['status']} |\n"

    content += "\n---\n\n*Generated by [Docling](https://github.com/docling-project/docling)*\n"

    index_file = output_dir / "README.md"
    index_file.write_text(content, encoding="utf-8")
    print(f"\nCreated index: {index_file}")


def main():
    parser = argparse.ArgumentParser(
        description="Batch convert documents to Markdown/JSON/HTML using Docling"
    )
    parser.add_argument(
        "--input", "-i",
        type=Path,
        required=True,
        help="Input directory containing documents"
    )
    parser.add_argument(
        "--output", "-o",
        type=Path,
        required=True,
        help="Output directory for converted files"
    )
    parser.add_argument(
        "--format", "-f",
        choices=["md", "json", "html", "text"],
        default="md",
        help="Output format (default: md)"
    )
    parser.add_argument(
        "--prefix", "-p",
        default="",
        help="Prefix for output filenames (e.g., 'lesson' -> 'lesson-01-intro.md')"
    )
    parser.add_argument(
        "--mapping", "-m",
        type=Path,
        help="JSON file with custom filename mappings"
    )
    parser.add_argument(
        "--title", "-t",
        default="Document Index",
        help="Title for the index file"
    )
    parser.add_argument(
        "--no-index",
        action="store_true",
        help="Skip creating index file"
    )
    parser.add_argument(
        "--no-assets",
        action="store_true",
        help="Skip copying asset files (images)"
    )

    args = parser.parse_args()

    if not args.input.exists():
        print(f"Error: Input directory not found: {args.input}")
        return 1

    print(f"Input: {args.input}")
    print(f"Output: {args.output}")
    print(f"Format: {args.format}")
    print()

    results = convert_documents(
        input_dir=args.input,
        output_dir=args.output,
        output_format=args.format,
        prefix=args.prefix,
        mapping_file=args.mapping,
        copy_assets=not args.no_assets,
    )

    if not args.no_index:
        create_index(args.output, results, args.title)

    success_count = sum(1 for r in results if r["status"] == "success")
    print(f"\nDone! Converted {success_count}/{len(results)} documents.")

    return 0 if success_count == len(results) else 1


if __name__ == "__main__":
    exit(main())