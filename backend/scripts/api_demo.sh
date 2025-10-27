#!/bin/bash
# Visual demonstration of Topics API capabilities

API_URL="http://localhost:8000/api/v1/topics"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          Topics API - Live Demonstration                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Helper function for test headers
test_header() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  $1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 1. Basic listing
test_header "1. Basic Listing - First 5 Topics"
echo "Request: GET /api/v1/topics?limit=5"
echo ""
curl -s "${API_URL}?limit=5" | jq -r '.items[] | "  • \(.name) (ID: \(.id))"'

# 2. Cyrillic search
test_header "2. Cyrillic Search - 'проект'"
echo "Request: GET /api/v1/topics?search=проект"
echo ""
curl -s "${API_URL}?search=%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82" | jq -r '
  "Found \(.total) topic(s):",
  (.items[] | "  • \(.name)\n    Description: \(.description)")
'

# 3. Search with English
test_header "3. Search - 'API'"
echo "Request: GET /api/v1/topics?search=API"
echo ""
curl -s "${API_URL}?search=API&limit=5" | jq -r '
  "Found \(.total) topics:",
  (.items[] | "  • \(.name)")
'

# 4. Sorting - name_asc
test_header "4. Sort by Name (A→Z) - First 5"
echo "Request: GET /api/v1/topics?sort_by=name_asc&limit=5"
echo ""
curl -s "${API_URL}?sort_by=name_asc&limit=5" | jq -r '
  "Sorted alphabetically:",
  (.items[] | "  \(.id). \(.name)")
'

# 5. Sorting - created_desc
test_header "5. Sort by Created (Newest First) - First 5"
echo "Request: GET /api/v1/topics?sort_by=created_desc&limit=5"
echo ""
curl -s "${API_URL}?sort_by=created_desc&limit=5" | jq -r '
  "Newest topics:",
  (.items[] | "  \(.name) - Created: \(.created_at[:10])")
'

# 6. Pagination
test_header "6. Pagination - Page 2 (items 11-20)"
echo "Request: GET /api/v1/topics?skip=10&limit=10"
echo ""
curl -s "${API_URL}?skip=10&limit=10" | jq -r '
  "Page \(.page) of \((.total / .page_size | ceil)) - Showing \(.items | length) of \(.total) total:",
  (.items[] | "  \(.id). \(.name)")
'

# 7. Combination: Search + Sort
test_header "7. Search + Sort - 'test' sorted alphabetically"
echo "Request: GET /api/v1/topics?search=test&sort_by=name_asc&limit=5"
echo ""
curl -s "${API_URL}?search=test&sort_by=name_asc&limit=5" | jq -r '
  "Found \(.total) topics matching \"test\":",
  (.items[] | "  • \(.name)")
'

# 8. Empty results
test_header "8. Empty Results - No matches"
echo "Request: GET /api/v1/topics?search=nonexistent123"
echo ""
curl -s "${API_URL}?search=nonexistent123" | jq -r '
  if .total == 0 then
    "No topics found matching \"nonexistent123\""
  else
    "Found \(.total) topics"
  end
'

# 9. Full response structure
test_header "9. Full Response Structure"
echo "Request: GET /api/v1/topics?limit=2"
echo ""
echo "Response:"
curl -s "${API_URL}?limit=2" | jq '{
  total: .total,
  page: .page,
  page_size: .page_size,
  items_count: (.items | length),
  first_item: .items[0] | {
    id,
    name,
    description: (.description[:50] + "..."),
    icon,
    color,
    created_at,
    updated_at
  }
}'

# Summary
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    Demonstration Complete                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "API Features Demonstrated:"
echo "  ✓ Basic listing with pagination"
echo "  ✓ Cyrillic/UTF-8 search support"
echo "  ✓ English keyword search"
echo "  ✓ Alphabetical sorting (A→Z)"
echo "  ✓ Date-based sorting (newest first)"
echo "  ✓ Pagination (skip/limit)"
echo "  ✓ Parameter combinations (search + sort)"
echo "  ✓ Empty result handling"
echo "  ✓ Complete response structure"
echo ""
echo "API Endpoint: ${API_URL}"
echo "Total Topics: $(curl -s "${API_URL}?limit=1" | jq -r '.total')"
echo ""
