#!/bin/bash
# Card Inventory Script - Analyzes all Card components in frontend
# Output: .audit/card-inventory.csv and .audit/card-inventory-summary.txt

set -e

FRONTEND_DIR="/Users/maks/PycharmProjects/task-tracker/frontend/src"
AUDIT_DIR="/Users/maks/PycharmProjects/task-tracker/.audit"

mkdir -p "$AUDIT_DIR"

echo "=== Card Inventory Analysis ==="
echo "Timestamp: $(date)"
echo ""

# Find all Card files
ALL_CARDS=$(find "$FRONTEND_DIR" -name "*Card*.tsx" -type f)

# Counters
TOTAL=0
PRODUCTION=0
STORIES=0
TESTS=0
SKELETONS=0

# CSV Header
echo "file_path,category,type,feature,lines" > "$AUDIT_DIR/card-inventory.csv"

for file in $ALL_CARDS; do
    TOTAL=$((TOTAL + 1))

    # Get relative path
    REL_PATH=${file#$FRONTEND_DIR/}

    # Determine type
    if [[ "$file" == *".stories.tsx" ]]; then
        TYPE="story"
        STORIES=$((STORIES + 1))
    elif [[ "$file" == *".test.tsx" ]]; then
        TYPE="test"
        TESTS=$((TESTS + 1))
    elif [[ "$file" == *"Skeleton"* ]]; then
        TYPE="skeleton"
        SKELETONS=$((SKELETONS + 1))
    else
        TYPE="production"
        PRODUCTION=$((PRODUCTION + 1))
    fi

    # Determine feature/category
    if [[ "$REL_PATH" == features/* ]]; then
        FEATURE=$(echo "$REL_PATH" | cut -d'/' -f2)
        CATEGORY="feature"
    elif [[ "$REL_PATH" == pages/* ]]; then
        FEATURE=$(echo "$REL_PATH" | cut -d'/' -f2)
        CATEGORY="page"
    elif [[ "$REL_PATH" == shared/* ]]; then
        FEATURE=$(echo "$REL_PATH" | cut -d'/' -f2)
        CATEGORY="shared"
    else
        FEATURE="other"
        CATEGORY="other"
    fi

    # Count lines
    LINES=$(wc -l < "$file" | tr -d ' ')

    echo "$REL_PATH,$CATEGORY,$TYPE,$FEATURE,$LINES" >> "$AUDIT_DIR/card-inventory.csv"
done

# Summary
cat > "$AUDIT_DIR/card-inventory-summary.txt" << EOF
=== Card Inventory Summary ===
Generated: $(date)

TOTALS:
- Total Card files: $TOTAL
- Production components: $PRODUCTION
- Story files: $STORIES
- Test files: $TESTS
- Skeleton components: $SKELETONS

PRODUCTION CARDS BY FEATURE:
EOF

# Count production cards by feature
grep ",production," "$AUDIT_DIR/card-inventory.csv" | cut -d',' -f4 | sort | uniq -c | sort -rn >> "$AUDIT_DIR/card-inventory-summary.txt"

echo "" >> "$AUDIT_DIR/card-inventory-summary.txt"
echo "PRODUCTION CARD FILES:" >> "$AUDIT_DIR/card-inventory-summary.txt"
grep ",production," "$AUDIT_DIR/card-inventory.csv" | cut -d',' -f1 >> "$AUDIT_DIR/card-inventory-summary.txt"

echo ""
echo "Summary saved to: $AUDIT_DIR/card-inventory-summary.txt"
echo "CSV saved to: $AUDIT_DIR/card-inventory.csv"
