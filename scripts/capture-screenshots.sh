#!/bin/bash
# Capture Storybook baseline screenshots using Playwright CLI

set -e

STORYBOOK_URL="http://localhost:6006"
OUTPUT_DIR="screenshots/storybook-baseline"
STORIES_FILE="scripts/storybook-stories.txt"

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

echo "📸 Capturing Storybook screenshots..."
echo "Output: $OUTPUT_DIR"
echo ""

# Read stories and capture screenshots
while IFS='|' read -r story_id filename || [ -n "$story_id" ]; do
    # Skip comments and empty lines
    [[ "$story_id" =~ ^#.* ]] && continue
    [[ -z "$story_id" ]] && continue

    story_url="$STORYBOOK_URL/iframe.html?id=$story_id&viewMode=story"

    # Light theme
    output_file="$OUTPUT_DIR/${filename}-light.png"
    echo "Capturing: ${filename}-light.png"
    npx playwright screenshot "$story_url" "$output_file" --viewport-size=1280,720 || echo "  ❌ Failed"

    # Dark theme (append theme=dark to URL)
    output_file="$OUTPUT_DIR/${filename}-dark.png"
    echo "Capturing: ${filename}-dark.png"
    npx playwright screenshot "${story_url}&theme=dark" "$output_file" --viewport-size=1280,720 || echo "  ❌ Failed"

done < "$STORIES_FILE"

echo ""
echo "✅ Screenshot capture complete"
echo "📁 Output: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR" | wc -l | xargs echo "   Total files:"
