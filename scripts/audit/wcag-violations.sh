#!/bin/bash
# WCAG Violations Detector - Finds accessibility issues in Card components
# Output: .audit/wcag-violations.csv and .audit/wcag-violations-summary.txt

set -e

FRONTEND_DIR="/Users/maks/PycharmProjects/task-tracker/frontend/src"
AUDIT_DIR="/Users/maks/PycharmProjects/task-tracker/.audit"

mkdir -p "$AUDIT_DIR"

echo "=== WCAG Violations Analysis ==="
echo "Timestamp: $(date)"
echo ""

# Find production Card files (exclude .stories.tsx, .test.tsx)
PROD_CARDS=$(find "$FRONTEND_DIR" -name "*Card*.tsx" -type f ! -name "*.stories.tsx" ! -name "*.test.tsx" ! -name "*Skeleton*")

# CSV Header
echo "file,violation_type,severity,line_number,code_snippet" > "$AUDIT_DIR/wcag-violations.csv"

# Counters
TOTAL_VIOLATIONS=0
CONTRAST_VIOLATIONS=0
FONT_SIZE_VIOLATIONS=0
TOOLTIP_VIOLATIONS=0
TOUCH_TARGET_VIOLATIONS=0
RESPONSIVE_VIOLATIONS=0
HARDCODED_COLOR_VIOLATIONS=0
ICON_LIBRARY_VIOLATIONS=0

for file in $PROD_CARDS; do
    REL_PATH=${file#$FRONTEND_DIR/}

    # 1. Contrast violations - text-muted-foreground on small text
    while IFS=: read -r line_num line_content; do
        if [[ -n "$line_num" ]]; then
            TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + 1))
            CONTRAST_VIOLATIONS=$((CONTRAST_VIOLATIONS + 1))
            # Escape quotes and commas in snippet
            SNIPPET=$(echo "$line_content" | sed 's/"/""/g' | head -c 100)
            echo "\"$REL_PATH\",\"contrast-muted-small\",\"P1\",$line_num,\"$SNIPPET\"" >> "$AUDIT_DIR/wcag-violations.csv"
        fi
    done < <(grep -n "text-muted-foreground.*text-xs\|text-xs.*text-muted-foreground" "$file" 2>/dev/null || true)

    # 2. Font size violations - text-xs for body content (not badges/labels)
    while IFS=: read -r line_num line_content; do
        if [[ -n "$line_num" ]] && [[ ! "$line_content" =~ "Badge" ]] && [[ ! "$line_content" =~ "badge" ]]; then
            TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + 1))
            FONT_SIZE_VIOLATIONS=$((FONT_SIZE_VIOLATIONS + 1))
            SNIPPET=$(echo "$line_content" | sed 's/"/""/g' | head -c 100)
            echo "\"$REL_PATH\",\"font-size-xs-body\",\"P1\",$line_num,\"$SNIPPET\"" >> "$AUDIT_DIR/wcag-violations.csv"
        fi
    done < <(grep -n "className=.*text-xs" "$file" 2>/dev/null | grep -v "Badge\|badge\|Label\|label" || true)

    # 3. Missing tooltips - truncate without Tooltip wrapper
    HAS_TRUNCATE=$(grep -c "truncate\|line-clamp" "$file" 2>/dev/null || echo "0")
    HAS_TOOLTIP=$(grep -c "Tooltip\|tooltip" "$file" 2>/dev/null || echo "0")
    if [[ "$HAS_TRUNCATE" -gt 0 ]] && [[ "$HAS_TOOLTIP" -eq 0 ]]; then
        TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + 1))
        TOOLTIP_VIOLATIONS=$((TOOLTIP_VIOLATIONS + 1))
        echo "\"$REL_PATH\",\"missing-tooltip-truncate\",\"P0\",0,\"Has $HAS_TRUNCATE truncate/line-clamp but no Tooltip\"" >> "$AUDIT_DIR/wcag-violations.csv"
    fi

    # 4. Touch target violations - size="icon" without h-11 w-11
    while IFS=: read -r line_num line_content; do
        if [[ -n "$line_num" ]] && [[ ! "$line_content" =~ "h-11" ]] && [[ ! "$line_content" =~ "w-11" ]]; then
            TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + 1))
            TOUCH_TARGET_VIOLATIONS=$((TOUCH_TARGET_VIOLATIONS + 1))
            SNIPPET=$(echo "$line_content" | sed 's/"/""/g' | head -c 100)
            echo "\"$REL_PATH\",\"touch-target-small\",\"P0\",$line_num,\"$SNIPPET\"" >> "$AUDIT_DIR/wcag-violations.csv"
        fi
    done < <(grep -n 'size="icon"\|size=.icon' "$file" 2>/dev/null || true)

    # 5. Non-responsive cards - cards without responsive classes
    HAS_RESPONSIVE=$(grep -c "sm:\|md:\|lg:" "$file" 2>/dev/null || echo "0")
    if [[ "$HAS_RESPONSIVE" -eq 0 ]]; then
        TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + 1))
        RESPONSIVE_VIOLATIONS=$((RESPONSIVE_VIOLATIONS + 1))
        echo "\"$REL_PATH\",\"non-responsive\",\"P2\",0,\"No responsive breakpoint classes found\"" >> "$AUDIT_DIR/wcag-violations.csv"
    fi

    # 6. Hardcoded colors - bg-red-, text-green-, etc (not semantic)
    while IFS=: read -r line_num line_content; do
        if [[ -n "$line_num" ]]; then
            TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + 1))
            HARDCODED_COLOR_VIOLATIONS=$((HARDCODED_COLOR_VIOLATIONS + 1))
            SNIPPET=$(echo "$line_content" | sed 's/"/""/g' | head -c 100)
            echo "\"$REL_PATH\",\"hardcoded-color\",\"P1\",$line_num,\"$SNIPPET\"" >> "$AUDIT_DIR/wcag-violations.csv"
        fi
    done < <(grep -n "bg-red-\|bg-green-\|bg-blue-\|bg-yellow-\|text-red-\|text-green-\|text-blue-\|text-yellow-\|bg-gray-\|text-gray-" "$file" 2>/dev/null || true)

    # 7. Wrong icon library - @heroicons instead of lucide
    while IFS=: read -r line_num line_content; do
        if [[ -n "$line_num" ]]; then
            TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + 1))
            ICON_LIBRARY_VIOLATIONS=$((ICON_LIBRARY_VIOLATIONS + 1))
            SNIPPET=$(echo "$line_content" | sed 's/"/""/g' | head -c 100)
            echo "\"$REL_PATH\",\"wrong-icon-library\",\"P1\",$line_num,\"$SNIPPET\"" >> "$AUDIT_DIR/wcag-violations.csv"
        fi
    done < <(grep -n "@heroicons" "$file" 2>/dev/null || true)

done

# Summary
cat > "$AUDIT_DIR/wcag-violations-summary.txt" << EOF
=== WCAG Violations Summary ===
Generated: $(date)

TOTAL VIOLATIONS: $TOTAL_VIOLATIONS

BY TYPE:
- P0 Touch target (<44px): $TOUCH_TARGET_VIOLATIONS
- P0 Missing tooltip on truncate: $TOOLTIP_VIOLATIONS
- P1 Contrast (muted + small): $CONTRAST_VIOLATIONS
- P1 Font size (text-xs body): $FONT_SIZE_VIOLATIONS
- P1 Hardcoded colors: $HARDCODED_COLOR_VIOLATIONS
- P1 Wrong icon library: $ICON_LIBRARY_VIOLATIONS
- P2 Non-responsive: $RESPONSIVE_VIOLATIONS

BY PRIORITY:
- P0 (Critical): $((TOUCH_TARGET_VIOLATIONS + TOOLTIP_VIOLATIONS))
- P1 (High): $((CONTRAST_VIOLATIONS + FONT_SIZE_VIOLATIONS + HARDCODED_COLOR_VIOLATIONS + ICON_LIBRARY_VIOLATIONS))
- P2 (Medium): $RESPONSIVE_VIOLATIONS

FILES WITH MOST VIOLATIONS:
EOF

# Count violations per file
cut -d',' -f1 "$AUDIT_DIR/wcag-violations.csv" | tail -n +2 | sort | uniq -c | sort -rn | head -10 >> "$AUDIT_DIR/wcag-violations-summary.txt"

echo ""
echo "Summary saved to: $AUDIT_DIR/wcag-violations-summary.txt"
echo "CSV saved to: $AUDIT_DIR/wcag-violations.csv"
