#!/bin/bash
# Final API validation for Topics endpoint

API_URL="http://localhost:8000/api/v1/topics"

echo "═══ Topics API Final Validation ═══"
echo ""

# Test 1: Cyrillic Search
echo "Test 1: Cyrillic Search"
echo "------------------------"
echo "Search: 'проект' (URL encoded)"
curl -s "${API_URL}?search=%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82&limit=5" | jq '{total, count: (.items | length), names: [.items[].name]}'
echo ""

echo "Search: 'API'"
curl -s "${API_URL}?search=API&limit=5" | jq '{total, count: (.items | length), names: [.items[].name]}'
echo ""

echo "Search: 'задач' (URL encoded)"
curl -s "${API_URL}?search=%D0%B7%D0%B0%D0%B4%D0%B0%D1%87&limit=5" | jq '{total, count: (.items | length), names: [.items[].name]}'
echo ""

# Test 2: Sorting
echo "Test 2: Sorting Options"
echo "-----------------------"
echo "Sort: name_asc (first 3)"
curl -s "${API_URL}?sort_by=name_asc&limit=3" | jq '{names: [.items[].name]}'
echo ""

echo "Sort: name_desc (first 3)"
curl -s "${API_URL}?sort_by=name_desc&limit=3" | jq '{names: [.items[].name]}'
echo ""

echo "Sort: created_desc (first 3)"
curl -s "${API_URL}?sort_by=created_desc&limit=3" | jq '{names: [.items[].name]}'
echo ""

echo "Sort: created_asc (first 3)"
curl -s "${API_URL}?sort_by=created_asc&limit=3" | jq '{names: [.items[].name]}'
echo ""

echo "Sort: updated_desc (first 3)"
curl -s "${API_URL}?sort_by=updated_desc&limit=3" | jq '{names: [.items[].name]}'
echo ""

# Test 3: Pagination
echo "Test 3: Pagination"
echo "------------------"
echo "Page 1 (skip=0, limit=10)"
curl -s "${API_URL}?skip=0&limit=10" | jq '{total, page, page_size, count: (.items | length)}'
echo ""

echo "Page 2 (skip=10, limit=10)"
curl -s "${API_URL}?skip=10&limit=10" | jq '{total, page, page_size, count: (.items | length)}'
echo ""

echo "Page 6 (skip=50, limit=10)"
curl -s "${API_URL}?skip=50&limit=10" | jq '{total, page, page_size, count: (.items | length)}'
echo ""

# Test 4: Combinations
echo "Test 4: Parameter Combinations"
echo "-------------------------------"
echo "Search + Sort (API, name_asc)"
curl -s "${API_URL}?search=API&sort_by=name_asc&limit=5" | jq '{total, names: [.items[].name]}'
echo ""

echo "Search + Pagination (test, skip=0, limit=5)"
curl -s "${API_URL}?search=test&skip=0&limit=5" | jq '{total, page, count: (.items | length)}'
echo ""

# Test 5: Edge Cases
echo "Test 5: Edge Cases"
echo "------------------"
echo "No matches (nonexistent search)"
curl -s "${API_URL}?search=xyz123nonexistent999" | jq '{total, count: (.items | length)}'
echo ""

echo "Invalid sort_by (fallback to default)"
curl -s "${API_URL}?sort_by=invalid_sort&limit=3" | jq '{total, count: (.items | length), first_name: .items[0].name}'
echo ""

echo "Large limit (1000)"
curl -s "${API_URL}?limit=1000" | jq '{total, page_size, count: (.items | length)}'
echo ""

echo "Skip beyond records"
curl -s "${API_URL}?skip=999999&limit=10" | jq '{total, count: (.items | length)}'
echo ""

echo ""
echo "═══ Validation Complete ═══"
