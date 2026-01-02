#!/usr/bin/env python3
"""
Capture Storybook screenshots for visual regression baseline.

Usage:
    python scripts/capture_storybook_baseline.py
"""

import asyncio
import sys
from pathlib import Path
from typing import List, Tuple

from playwright.async_api import async_playwright

# Configuration
STORYBOOK_URL = "http://localhost:6006"
OUTPUT_DIR = Path(__file__).parent.parent / "screenshots" / "storybook-baseline"
STORIES_FILE = Path(__file__).parent / "storybook-stories.txt"
THEMES = ["light", "dark"]


def load_stories() -> List[Tuple[str, str]]:
    """Load stories from stories file."""
    stories = []
    with open(STORIES_FILE) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            story_id, filename = line.split("|")
            stories.append((story_id.strip(), filename.strip()))
    return stories


async def capture_screenshots():
    """Capture all screenshots in both themes."""
    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load stories
    stories = load_stories()
    print(f"📸 Capturing {len(stories)} components in {len(THEMES)} themes...")
    print(f"Output directory: {OUTPUT_DIR}\n")

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={"width": 1280, "height": 720})

        captured_count = 0
        failed = []

        for theme in THEMES:
            print(f"\n🎨 Theme: {theme}")
            page = await context.new_page()

            # Navigate to Storybook and switch theme if needed
            await page.goto(STORYBOOK_URL)
            await page.wait_for_load_state("networkidle")

            if theme == "dark":
                try:
                    # Click theme button in toolbar
                    await page.click('button:has-text("light theme")', timeout=5000)
                    await page.wait_for_timeout(500)
                    print("  ✓ Switched to dark theme")
                except Exception as e:
                    print(f"  ⚠️  Could not switch theme: {e}")

            for story_id, filename in stories:
                story_url = f"{STORYBOOK_URL}/iframe.html?id={story_id}&viewMode=story"
                output_file = OUTPUT_DIR / f"{filename}-{theme}.png"

                try:
                    await page.goto(story_url, wait_until="networkidle")
                    await page.wait_for_timeout(1000)  # Wait for animations

                    # Take screenshot
                    await page.screenshot(path=str(output_file), type="png")
                    print(f"  ✅ {filename}-{theme}.png")
                    captured_count += 1

                except Exception as e:
                    error_msg = f"{story_id} ({theme}): {str(e)}"
                    print(f"  ❌ {error_msg}")
                    failed.append(error_msg)

            await page.close()

        await browser.close()

        # Summary
        print(f"\n{'='*60}")
        print(f"✅ Successfully captured: {captured_count} screenshots")
        print(f"📁 Output directory: {OUTPUT_DIR}")

        if failed:
            print(f"\n❌ Failed ({len(failed)}):")
            for error in failed:
                print(f"  - {error}")
            return 1

        return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(capture_screenshots()))
