#!/usr/bin/env python3
"""Export OpenAPI schema from FastAPI without running server.

Usage:
    cd backend && uv run python scripts/export_openapi.py

Output:
    ../contracts/openapi.json
"""
import json
import sys
from pathlib import Path

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app

OUTPUT_PATH = Path(__file__).parent.parent.parent / "contracts" / "openapi.json"


def main() -> None:
    """Export OpenAPI schema to JSON file."""
    schema = app.openapi()

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=2, ensure_ascii=False)

    print(f"✅ OpenAPI schema exported to {OUTPUT_PATH}")
    print(f"   Endpoints: {len(schema.get('paths', {}))}")
    print(f"   Schemas: {len(schema.get('components', {}).get('schemas', {}))}")


if __name__ == "__main__":
    main()
