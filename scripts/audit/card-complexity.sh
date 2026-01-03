#!/bin/bash
# Card Complexity Analyzer - Measures code complexity of Card components
# Output: .audit/card-complexity.csv and .audit/card-complexity-summary.txt

set -e

FRONTEND_DIR="/Users/maks/PycharmProjects/task-tracker/frontend/src"
AUDIT_DIR="/Users/maks/PycharmProjects/task-tracker/.audit"

mkdir -p "$AUDIT_DIR"

echo "=== Card Complexity Analysis ==="
echo "Timestamp: $(date)"
echo ""

# Find production Card files (exclude .stories.tsx, .test.tsx)
PROD_CARDS=$(find "$FRONTEND_DIR" -name "*Card*.tsx" -type f ! -name "*.stories.tsx" ! -name "*.test.tsx" ! -name "*Skeleton*")

# CSV Header
echo "file,lines,props_interfaces,use_state,use_effect,use_query,use_mutation,total_hooks,complexity_score" > "$AUDIT_DIR/card-complexity.csv"

for file in $PROD_CARDS; do
    REL_PATH=${file#$FRONTEND_DIR/}

    # Lines of code
    LINES=$(wc -l < "$file" | tr -d ' ')

    # Props interfaces count
    PROPS_COUNT=$(grep -c "interface.*Props\|type.*Props" "$file" 2>/dev/null || echo "0")

    # useState count
    USE_STATE=$(grep -c "useState" "$file" 2>/dev/null || echo "0")

    # useEffect count
    USE_EFFECT=$(grep -c "useEffect" "$file" 2>/dev/null || echo "0")

    # useQuery count
    USE_QUERY=$(grep -c "useQuery" "$file" 2>/dev/null || echo "0")

    # useMutation count
    USE_MUTATION=$(grep -c "useMutation" "$file" 2>/dev/null || echo "0")

    # Total hooks
    TOTAL_HOOKS=$((USE_STATE + USE_EFFECT + USE_QUERY + USE_MUTATION))

    # Complexity score (weighted)
    # Lines: 1 point per 50 lines
    # Hooks: 2 points each
    # Props interfaces: 1 point each
    COMPLEXITY=$((LINES / 50 + TOTAL_HOOKS * 2 + PROPS_COUNT))

    echo "\"$REL_PATH\",$LINES,$PROPS_COUNT,$USE_STATE,$USE_EFFECT,$USE_QUERY,$USE_MUTATION,$TOTAL_HOOKS,$COMPLEXITY" >> "$AUDIT_DIR/card-complexity.csv"
done

# Summary
cat > "$AUDIT_DIR/card-complexity-summary.txt" << EOF
=== Card Complexity Summary ===
Generated: $(date)

MOST COMPLEX CARDS (by score):
EOF

# Sort by complexity score (last column), show top 10
sort -t',' -k9 -rn "$AUDIT_DIR/card-complexity.csv" | head -11 | tail -10 | while IFS=',' read -r file lines props state effect query mutation hooks score; do
    echo "  Score $score: $file (${lines} lines, ${hooks} hooks)" >> "$AUDIT_DIR/card-complexity-summary.txt"
done

cat >> "$AUDIT_DIR/card-complexity-summary.txt" << EOF

LARGEST CARDS (by lines):
EOF

sort -t',' -k2 -rn "$AUDIT_DIR/card-complexity.csv" | head -11 | tail -10 | while IFS=',' read -r file lines props state effect query mutation hooks score; do
    echo "  ${lines} lines: $file" >> "$AUDIT_DIR/card-complexity-summary.txt"
done

cat >> "$AUDIT_DIR/card-complexity-summary.txt" << EOF

CARDS WITH MOST HOOKS:
EOF

sort -t',' -k8 -rn "$AUDIT_DIR/card-complexity.csv" | head -11 | tail -10 | while IFS=',' read -r file lines props state effect query mutation hooks score; do
    if [[ "$hooks" != "total_hooks" ]]; then
        echo "  ${hooks} hooks: $file (state:$state effect:$effect query:$query mutation:$mutation)" >> "$AUDIT_DIR/card-complexity-summary.txt"
    fi
done

# Statistics
TOTAL_CARDS=$(wc -l < "$AUDIT_DIR/card-complexity.csv" | tr -d ' ')
TOTAL_CARDS=$((TOTAL_CARDS - 1))  # Subtract header
TOTAL_LINES=$(awk -F',' 'NR>1 {sum+=$2} END {print sum}' "$AUDIT_DIR/card-complexity.csv")
AVG_LINES=$((TOTAL_LINES / TOTAL_CARDS))

cat >> "$AUDIT_DIR/card-complexity-summary.txt" << EOF

STATISTICS:
- Total production cards: $TOTAL_CARDS
- Total lines of code: $TOTAL_LINES
- Average lines per card: $AVG_LINES
EOF

echo ""
echo "Summary saved to: $AUDIT_DIR/card-complexity-summary.txt"
echo "CSV saved to: $AUDIT_DIR/card-complexity.csv"
