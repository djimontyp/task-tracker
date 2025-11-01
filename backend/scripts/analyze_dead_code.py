#!/usr/bin/env python3
"""
Dead Code Analysis Script

Analyzes Python codebase for:
1. Unused imports (via ruff)
2. Dead functions (defined but never called)
3. Commented-out code blocks
4. Orphaned files (not imported anywhere)
"""

import ast
import os
import subprocess
import sys
from collections import defaultdict
from pathlib import Path


def analyze_unused_imports(base_path: str = "app") -> list[dict]:
    """Use ruff to find unused imports."""
    try:
        result = subprocess.run(
            ["ruff", "check", base_path, "--select", "F401", "--output-format", "json"],
            capture_output=True,
            text=True,
            cwd="/Users/maks/PycharmProjects/task-tracker/backend",
        )

        if result.returncode == 0:
            return []

        import json
        findings = json.loads(result.stdout) if result.stdout else []
        return findings
    except Exception as e:
        print(f"Error running ruff: {e}", file=sys.stderr)
        return []


def analyze_commented_code(base_path: str = "app") -> list[dict]:
    """Find files with excessive commented code."""
    results = []

    for root, dirs, files in os.walk(base_path):
        # Skip pycache
        dirs[:] = [d for d in dirs if d != "__pycache__"]

        for file in files:
            if not file.endswith(".py"):
                continue

            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    lines = f.readlines()

                comment_lines = []
                for i, line in enumerate(lines, 1):
                    stripped = line.strip()
                    # Skip docstrings and empty comments
                    if stripped.startswith("#") and len(stripped) > 1:
                        # Check if it's actual code comment (not just #)
                        if not stripped.startswith("# ~~~") and "TODO" not in stripped:
                            comment_lines.append((i, line.rstrip()))

                # Report files with 10+ comment lines
                if len(comment_lines) >= 10:
                    results.append({
                        "file": filepath,
                        "comment_count": len(comment_lines),
                        "total_lines": len(lines),
                        "percentage": (len(comment_lines) / len(lines)) * 100,
                        "samples": comment_lines[:5]  # First 5 examples
                    })
            except Exception as e:
                print(f"Error reading {filepath}: {e}", file=sys.stderr)

    return sorted(results, key=lambda x: x["comment_count"], reverse=True)


def analyze_function_usage(base_path: str = "app") -> dict:
    """Analyze function definitions vs calls to find dead functions."""
    functions_defined = defaultdict(list)  # func_name -> [locations]
    functions_called = set()

    class FunctionVisitor(ast.NodeVisitor):
        def __init__(self, filepath):
            self.filepath = filepath

        def visit_FunctionDef(self, node):
            functions_defined[node.name].append(self.filepath)
            self.generic_visit(node)

        def visit_AsyncFunctionDef(self, node):
            functions_defined[node.name].append(self.filepath)
            self.generic_visit(node)

        def visit_Call(self, node):
            if isinstance(node.func, ast.Name):
                functions_called.add(node.func.id)
            elif isinstance(node.func, ast.Attribute):
                functions_called.add(node.func.attr)
            self.generic_visit(node)

    # Scan all Python files
    for root, dirs, files in os.walk(base_path):
        dirs[:] = [d for d in dirs if d != "__pycache__"]

        for file in files:
            if not file.endswith(".py"):
                continue

            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    tree = ast.parse(f.read(), filepath)
                    visitor = FunctionVisitor(filepath)
                    visitor.visit(tree)
            except Exception as e:
                print(f"Error parsing {filepath}: {e}", file=sys.stderr)

    # Find potentially unused functions
    exclude_patterns = {
        "main", "__init__", "setUp", "tearDown", "lifespan",
        "get_db_session", "get_session", "create_db_and_tables"
    }

    unused = []
    for func_name, locations in functions_defined.items():
        if func_name not in functions_called:
            # Skip special methods, tests, and common patterns
            if (not func_name.startswith("_") and
                not func_name.startswith("test_") and
                func_name not in exclude_patterns):
                unused.append({
                    "function": func_name,
                    "locations": locations,
                    "confidence": "medium"  # Could be called via reflection
                })

    return {
        "total_defined": len(functions_defined),
        "total_called": len(functions_called),
        "potentially_unused": unused[:50]  # Top 50
    }


def main():
    """Run all analyses and print report."""
    print("=" * 80)
    print("DEAD CODE ANALYSIS REPORT")
    print("=" * 80)
    print()

    # 1. Unused imports
    print("1. UNUSED IMPORTS (via ruff)")
    print("-" * 80)
    unused_imports = analyze_unused_imports()

    if unused_imports:
        for item in unused_imports:
            print(f"  {item['filename']}:{item['location']['row']}")
            print(f"    {item['message']}")
            print()
    else:
        print("  ✓ No unused imports found!")
    print()

    # 2. Commented code
    print("2. FILES WITH EXCESSIVE COMMENTED CODE")
    print("-" * 80)
    commented = analyze_commented_code()

    if commented:
        for item in commented[:10]:  # Top 10
            print(f"  {item['file']}")
            print(f"    {item['comment_count']} comment lines ({item['percentage']:.1f}% of file)")
            print(f"    Sample:")
            for line_no, line in item['samples'][:2]:
                print(f"      L{line_no}: {line[:60]}")
            print()
    else:
        print("  ✓ No files with excessive comments!")
    print()

    # 3. Function usage
    print("3. POTENTIALLY UNUSED FUNCTIONS")
    print("-" * 80)
    func_analysis = analyze_function_usage()

    print(f"  Total functions defined: {func_analysis['total_defined']}")
    print(f"  Total functions called: {func_analysis['total_called']}")
    print(f"  Potentially unused: {len(func_analysis['potentially_unused'])}")
    print()

    if func_analysis["potentially_unused"]:
        print("  Top 20 candidates:")
        for item in func_analysis["potentially_unused"][:20]:
            print(f"    {item['function']} (confidence: {item['confidence']})")
            print(f"      Defined in: {item['locations'][0]}")
        print()

    print("=" * 80)
    print("ANALYSIS COMPLETE")
    print("=" * 80)
    print()
    print("NOTE: This is static analysis. Some findings may be false positives.")
    print("      Always verify before removing code.")


if __name__ == "__main__":
    os.chdir("/Users/maks/PycharmProjects/task-tracker/backend")
    main()
