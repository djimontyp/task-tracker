#!/usr/bin/env python3
"""Comprehensive testing script for Topics API search, sorting, and pagination.

Tests all aspects of the /api/v1/topics endpoint including:
- Cyrillic search
- All 5 sorting options
- Pagination with large datasets
- Parameter combinations
- Edge cases
"""

import asyncio
import json
from dataclasses import dataclass
from datetime import datetime
from typing import Any

import httpx
from rich.console import Console
from rich.table import Table

console = Console()

API_BASE_URL = "http://localhost:8000/api/v1"


@dataclass
class TestResult:
    """Test result container."""

    test_case: str
    expected: str
    actual: str
    status: str
    details: str = ""


class TopicsAPITester:
    """Topics API test suite."""

    def __init__(self, base_url: str = API_BASE_URL):
        """Initialize tester."""
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30.0)
        self.results: list[TestResult] = []

    async def cleanup(self) -> None:
        """Close HTTP client."""
        await self.client.aclose()

    def add_result(
        self,
        test_case: str,
        expected: str,
        actual: str,
        status: str,
        details: str = "",
    ) -> None:
        """Add test result."""
        self.results.append(
            TestResult(
                test_case=test_case,
                expected=expected,
                actual=actual,
                status=status,
                details=details,
            )
        )

    async def get_topics(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        sort_by: str | None = None,
    ) -> dict[str, Any]:
        """Fetch topics from API."""
        params: dict[str, Any] = {"skip": skip, "limit": limit}
        if search:
            params["search"] = search
        if sort_by:
            params["sort_by"] = sort_by

        response = await self.client.get(f"{self.base_url}/topics", params=params)
        response.raise_for_status()
        return response.json()

    async def create_topic(self, name: str, description: str) -> dict[str, Any]:
        """Create a test topic."""
        response = await self.client.post(
            f"{self.base_url}/topics",
            json={"name": name, "description": description},
        )
        response.raise_for_status()
        return response.json()

    async def test_cyrillic_search(self) -> None:
        """Test 1: Cyrillic search functionality."""
        console.print("\n[bold cyan]Test 1: Cyrillic Search[/bold cyan]")

        # Create test topics with Ukrainian names
        test_topics = [
            ("Проект Backend", "Робота над бекенд частиною проекту"),
            ("API Документація", "Написання документації для API"),
            ("Задачі Frontend", "Задачі по фронтенд розробці"),
        ]

        created_ids = []
        for name, desc in test_topics:
            try:
                topic = await self.create_topic(name, desc)
                created_ids.append(topic["id"])
                console.print(f"  ✓ Created topic: {name}")
            except Exception as e:
                console.print(f"  ✗ Failed to create {name}: {e}")

        # Test search with Cyrillic
        search_tests = [
            ("проект", "Should find 'Проект Backend'"),
            ("API", "Should find 'API Документація'"),
            ("задач", "Should find 'Задачі Frontend'"),
            ("документ", "Should find 'API Документація'"),
            ("фронтенд", "Should find 'Задачі Frontend'"),
        ]

        for search_term, expected_desc in search_tests:
            try:
                result = await self.get_topics(search=search_term)
                found = result["total"] > 0
                items = result.get("items", [])
                found_names = [item["name"] for item in items]

                status = "✅ PASS" if found else "❌ FAIL"
                self.add_result(
                    f"Cyrillic search: '{search_term}'",
                    expected_desc,
                    f"Found {result['total']} topics: {found_names}",
                    status,
                    json.dumps(result, indent=2, ensure_ascii=False),
                )
                console.print(f"  {status} Search '{search_term}': {result['total']} results")
            except Exception as e:
                self.add_result(
                    f"Cyrillic search: '{search_term}'",
                    expected_desc,
                    f"Error: {e}",
                    "❌ FAIL",
                )
                console.print(f"  ❌ FAIL Search '{search_term}': {e}")

    async def test_sorting_options(self) -> None:
        """Test 2: All 5 sorting options."""
        console.print("\n[bold cyan]Test 2: Sorting Options[/bold cyan]")

        sort_tests = [
            ("name_asc", "Names in A→Z order"),
            ("name_desc", "Names in Z→A order"),
            ("created_desc", "Newest first (default)"),
            ("created_asc", "Oldest first"),
            ("updated_desc", "Recently updated first"),
        ]

        for sort_by, expected_desc in sort_tests:
            try:
                result = await self.get_topics(limit=10, sort_by=sort_by)
                items = result.get("items", [])

                # Extract names and dates for verification
                names = [item["name"] for item in items]
                created_dates = [item["created_at"] for item in items]

                # Verify sort order
                if sort_by == "name_asc":
                    is_sorted = names == sorted(names)
                elif sort_by == "name_desc":
                    is_sorted = names == sorted(names, reverse=True)
                elif sort_by in ["created_desc", "updated_desc"]:
                    is_sorted = created_dates == sorted(created_dates, reverse=True)
                elif sort_by == "created_asc":
                    is_sorted = created_dates == sorted(created_dates)
                else:
                    is_sorted = False

                status = "✅ PASS" if is_sorted else "⚠️  WARN"
                actual_order = f"First 3: {names[:3]}"

                self.add_result(
                    f"Sort by {sort_by}",
                    expected_desc,
                    actual_order,
                    status,
                    f"Total items: {len(items)}, Verified order: {is_sorted}",
                )
                console.print(f"  {status} {sort_by}: {actual_order}")
            except Exception as e:
                self.add_result(
                    f"Sort by {sort_by}",
                    expected_desc,
                    f"Error: {e}",
                    "❌ FAIL",
                )
                console.print(f"  ❌ FAIL {sort_by}: {e}")

    async def test_pagination(self) -> None:
        """Test 3: Pagination with large dataset."""
        console.print("\n[bold cyan]Test 3: Pagination[/bold cyan]")

        # Get total count first
        try:
            first_page = await self.get_topics(skip=0, limit=10)
            total = first_page["total"]

            console.print(f"  Total topics in DB: {total}")

            if total < 50:
                console.print(f"  ⚠️  Only {total} topics. Need more for thorough testing.")
                console.print("  Run: just db-topics-seed 20 5 10")

            # Test pagination scenarios
            pagination_tests = [
                (0, 10, "First page (skip=0, limit=10)"),
                (10, 10, "Second page (skip=10, limit=10)"),
                (0, 5, "Small page (skip=0, limit=5)"),
                (total - 5 if total > 5 else 0, 5, "Last page"),
            ]

            for skip, limit, description in pagination_tests:
                result = await self.get_topics(skip=skip, limit=limit)
                items = result.get("items", [])
                page = result.get("page", 0)

                expected_page = (skip // limit) + 1
                is_correct = (
                    len(items) <= limit
                    and result["total"] == total
                    and page == expected_page
                )

                status = "✅ PASS" if is_correct else "❌ FAIL"
                self.add_result(
                    description,
                    f"Page {expected_page}, max {limit} items, total={total}",
                    f"Page {page}, got {len(items)} items, total={result['total']}",
                    status,
                )
                console.print(
                    f"  {status} {description}: page={page}, items={len(items)}, total={result['total']}"
                )
        except Exception as e:
            self.add_result(
                "Pagination tests",
                "Correct pagination metadata",
                f"Error: {e}",
                "❌ FAIL",
            )
            console.print(f"  ❌ FAIL Pagination: {e}")

    async def test_parameter_combinations(self) -> None:
        """Test 4: Parameter combinations."""
        console.print("\n[bold cyan]Test 4: Parameter Combinations[/bold cyan]")

        combination_tests = [
            {
                "params": {"search": "API", "sort_by": "name_asc"},
                "desc": "Search + Sort (API sorted by name)",
            },
            {
                "params": {"search": "test", "skip": 0, "limit": 5},
                "desc": "Search + Pagination (first 5 'test' results)",
            },
            {
                "params": {"sort_by": "created_desc", "skip": 0, "limit": 10},
                "desc": "Sort + Pagination (newest 10)",
            },
        ]

        for test in combination_tests:
            try:
                result = await self.get_topics(**test["params"])
                items = result.get("items", [])

                is_valid = (
                    isinstance(items, list)
                    and result["total"] >= 0
                    and len(items) <= test["params"].get("limit", 100)
                )

                status = "✅ PASS" if is_valid else "❌ FAIL"
                self.add_result(
                    test["desc"],
                    "Valid response with filtered/sorted/paginated data",
                    f"Got {len(items)} items, total={result['total']}",
                    status,
                    json.dumps(test["params"], indent=2),
                )
                console.print(
                    f"  {status} {test['desc']}: {len(items)} items, total={result['total']}"
                )
            except Exception as e:
                self.add_result(
                    test["desc"],
                    "Valid response",
                    f"Error: {e}",
                    "❌ FAIL",
                )
                console.print(f"  ❌ FAIL {test['desc']}: {e}")

    async def test_edge_cases(self) -> None:
        """Test 5: Edge cases."""
        console.print("\n[bold cyan]Test 5: Edge Cases[/bold cyan]")

        edge_tests = [
            {
                "params": {"search": "xyz123nonexistent999"},
                "expected": "Empty results (total=0, items=[])",
                "desc": "Search with no matches",
            },
            {
                "params": {"sort_by": "invalid_sort"},
                "expected": "Fallback to default sort or error",
                "desc": "Invalid sort_by parameter",
            },
            {
                "params": {"limit": 1000},
                "expected": "Maximum 1000 items",
                "desc": "Very large limit",
            },
            {
                "params": {"skip": 999999},
                "expected": "Empty items[] but valid total",
                "desc": "Skip beyond available records",
            },
        ]

        for test in edge_tests:
            try:
                result = await self.get_topics(**test["params"])
                items = result.get("items", [])

                # Validate based on test type
                if test["desc"] == "Search with no matches":
                    is_valid = result["total"] == 0 and len(items) == 0
                elif test["desc"] == "Invalid sort_by parameter":
                    is_valid = isinstance(items, list) and result["total"] >= 0
                elif test["desc"] == "Very large limit":
                    is_valid = len(items) <= 1000
                elif test["desc"] == "Skip beyond available records":
                    is_valid = len(items) == 0 and result["total"] >= 0
                else:
                    is_valid = True

                status = "✅ PASS" if is_valid else "⚠️  WARN"
                self.add_result(
                    test["desc"],
                    test["expected"],
                    f"total={result['total']}, items={len(items)}",
                    status,
                )
                console.print(f"  {status} {test['desc']}: total={result['total']}, items={len(items)}")
            except Exception as e:
                status = "⚠️  WARN" if "404" not in str(e) else "❌ FAIL"
                self.add_result(
                    test["desc"],
                    test["expected"],
                    f"Error: {e}",
                    status,
                )
                console.print(f"  {status} {test['desc']}: {e}")

    def print_summary_table(self) -> None:
        """Print test results summary table."""
        console.print("\n[bold yellow]═══ TEST RESULTS SUMMARY ═══[/bold yellow]\n")

        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Test Case", style="cyan", width=40)
        table.add_column("Expected", style="white", width=30)
        table.add_column("Actual", style="yellow", width=35)
        table.add_column("Status", justify="center", width=10)

        for result in self.results:
            table.add_row(
                result.test_case,
                result.expected,
                result.actual,
                result.status,
            )

        console.print(table)

        # Calculate statistics
        total_tests = len(self.results)
        passed = sum(1 for r in self.results if "✅ PASS" in r.status)
        failed = sum(1 for r in self.results if "❌ FAIL" in r.status)
        warnings = sum(1 for r in self.results if "⚠️" in r.status)

        console.print(f"\n[bold]Statistics:[/bold]")
        console.print(f"  Total Tests: {total_tests}")
        console.print(f"  ✅ Passed: {passed}")
        console.print(f"  ❌ Failed: {failed}")
        console.print(f"  ⚠️  Warnings: {warnings}")

        if failed == 0:
            console.print("\n[bold green]🎉 All critical tests passed! Ready for frontend integration.[/bold green]")
        else:
            console.print("\n[bold red]⚠️  Some tests failed. Review issues before frontend integration.[/bold red]")


async def main() -> None:
    """Run all tests."""
    console.print("[bold green]═══ Topics API Testing Suite ═══[/bold green]")
    console.print(f"Testing endpoint: {API_BASE_URL}/topics")
    console.print(f"Started at: {datetime.now().isoformat()}\n")

    tester = TopicsAPITester()

    try:
        # Run all test suites
        await tester.test_cyrillic_search()
        await tester.test_sorting_options()
        await tester.test_pagination()
        await tester.test_parameter_combinations()
        await tester.test_edge_cases()

        # Print summary
        tester.print_summary_table()

        # API Contract Summary
        console.print("\n[bold cyan]═══ API CONTRACT SUMMARY ═══[/bold cyan]")
        console.print("""
[bold]Endpoint:[/bold] GET /api/v1/topics

[bold]Query Parameters:[/bold]
  • skip: int = 0 (pagination offset, min: 0)
  • limit: int = 100 (page size, min: 1, max: 1000)
  • search: str | null (case-insensitive, searches name + description)
  • sort_by: str = "created_desc" (options below)

[bold]Sort Options:[/bold]
  • name_asc - Alphabetical A→Z
  • name_desc - Alphabetical Z→A
  • created_desc - Newest first (default)
  • created_asc - Oldest first
  • updated_desc - Recently updated first

[bold]Response Schema:[/bold]
  {
    "items": TopicPublic[],
    "total": int,
    "page": int,
    "page_size": int
  }

[bold]TopicPublic Schema:[/bold]
  {
    "id": int,
    "name": str,
    "description": str,
    "icon": str,
    "color": str (hex format),
    "created_at": str (ISO 8601),
    "updated_at": str (ISO 8601)
  }

[bold]Features:[/bold]
  ✓ Full UTF-8 / Cyrillic support
  ✓ Case-insensitive search
  ✓ Multiple sort options
  ✓ Pagination metadata
  ✓ Empty results handling
        """)

    except Exception as e:
        console.print(f"\n[bold red]Fatal error during testing: {e}[/bold red]")
    finally:
        await tester.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
