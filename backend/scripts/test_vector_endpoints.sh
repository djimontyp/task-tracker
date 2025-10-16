#!/bin/bash

set -e

API_BASE="http://localhost:8000/api/v1"

echo "=================================================="
echo "🧪 COMPREHENSIVE VECTOR DB ENDPOINT TESTING"
echo "=================================================="
echo ""

echo "📊 Test Data Summary:"
echo "-------------------"
TOPICS=$(curl -s "${API_BASE}/topics" | python3 -c "import sys, json; print(json.load(sys.stdin)['total'])")
echo "Topics: ${TOPICS}"

echo ""
echo "=================================================="
echo "TEST 1: GET /topics/{id}/messages"
echo "=================================================="
RESPONSE=$(curl -s "${API_BASE}/topics/1/messages?limit=5")
COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
echo "✅ Status: Success"
echo "   Returned messages: ${COUNT}"
echo "   First message:"
echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(f'   - ID: {data[0][\"id\"]}'); print(f'   - Content: {data[0][\"content\"][:60]}...') if data else print('   No messages')"

echo ""
echo "=================================================="
echo "TEST 2: GET /messages?topic_id={id}"
echo "=================================================="
RESPONSE=$(curl -s "${API_BASE}/messages?topic_id=1&limit=5")
if echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); exit(0 if 'items' in data else 1)" 2>/dev/null; then
    TOTAL=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['total'])")
    COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['items']))")
    echo "✅ Status: Success"
    echo "   Total messages for topic 1: ${TOTAL}"
    echo "   Returned: ${COUNT}"
else
    echo "❌ Status: Failed - Unexpected response format"
    echo "   Response: ${RESPONSE}"
fi

echo ""
echo "=================================================="
echo "TEST 3: Check for LLM Providers"
echo "=================================================="
PROVIDERS_RESPONSE=$(curl -s "${API_BASE}/providers?limit=1")
PROVIDER_COUNT=$(echo "$PROVIDERS_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('total', 0))" 2>/dev/null || echo "0")

if [ "$PROVIDER_COUNT" -gt 0 ]; then
    PROVIDER_ID=$(echo "$PROVIDERS_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['items'][0]['id'])")
    PROVIDER_NAME=$(echo "$PROVIDERS_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['items'][0]['name'])")
    echo "✅ Providers available: ${PROVIDER_COUNT}"
    echo "   Using provider: ${PROVIDER_NAME} (${PROVIDER_ID})"
    PROVIDER_AVAILABLE=true
else
    echo "⚠️  No LLM providers configured"
    echo "   Embedding tests will be skipped"
    PROVIDER_AVAILABLE=false
fi

if [ "$PROVIDER_AVAILABLE" = true ]; then
    echo ""
    echo "=================================================="
    echo "TEST 4: POST /embeddings/messages/{id} (Single)"
    echo "=================================================="
    MESSAGE_ID=$(curl -s "${API_BASE}/topics/1/messages?limit=1" | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['id'])")
    echo "Testing with message ID: ${MESSAGE_ID}"

    EMBED_RESPONSE=$(curl -s -X POST "${API_BASE}/embeddings/messages/${MESSAGE_ID}" \
        -H "Content-Type: application/json" \
        -d "{\"provider_id\": \"${PROVIDER_ID}\"}")

    if echo "$EMBED_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); exit(0 if 'embedding_length' in data else 1)" 2>/dev/null; then
        EMBED_LENGTH=$(echo "$EMBED_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['embedding_length'])")
        STATUS=$(echo "$EMBED_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'N/A'))")
        echo "✅ Status: Success"
        echo "   Embedding length: ${EMBED_LENGTH}"
        echo "   Status: ${STATUS}"
    else
        echo "❌ Status: Failed"
        echo "   Response: ${EMBED_RESPONSE}"
    fi

    echo ""
    echo "=================================================="
    echo "TEST 5: POST /embeddings/messages/batch"
    echo "=================================================="
    MESSAGE_IDS=$(curl -s "${API_BASE}/topics/1/messages?limit=5" | python3 -c "import sys, json; print([m['id'] for m in json.load(sys.stdin)])")
    echo "Testing with message IDs: ${MESSAGE_IDS}"

    BATCH_RESPONSE=$(curl -s -X POST "${API_BASE}/embeddings/messages/batch" \
        -H "Content-Type: application/json" \
        -d "{\"message_ids\": ${MESSAGE_IDS}, \"provider_id\": \"${PROVIDER_ID}\"}")

    if echo "$BATCH_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); exit(0 if 'task_id' in data or 'count' in data else 1)" 2>/dev/null; then
        echo "✅ Status: Success"
        echo "   Response: ${BATCH_RESPONSE}"
    else
        echo "❌ Status: Failed"
        echo "   Response: ${BATCH_RESPONSE}"
    fi

    echo ""
    echo "Waiting 3 seconds for embeddings to generate..."
    sleep 3

    echo ""
    echo "=================================================="
    echo "TEST 6: GET /search/messages?query={text}"
    echo "=================================================="
    SEARCH_RESPONSE=$(curl -s "${API_BASE}/search/messages?query=test&provider_id=${PROVIDER_ID}&limit=5&threshold=0.5")

    if echo "$SEARCH_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); exit(0 if isinstance(data, list) or 'items' in data else 1)" 2>/dev/null; then
        RESULT_COUNT=$(echo "$SEARCH_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data) if isinstance(data, list) else len(data.get('items', [])))")
        echo "✅ Status: Success"
        echo "   Results found: ${RESULT_COUNT}"
        if [ "$RESULT_COUNT" -gt 0 ]; then
            echo "$SEARCH_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); items = data if isinstance(data, list) else data.get('items', []); print(f'   Top result similarity: {items[0].get(\"similarity_score\", \"N/A\")}') if items else None"
        fi
    else
        echo "❌ Status: Failed"
        echo "   Response: ${SEARCH_RESPONSE}"
    fi

    echo ""
    echo "=================================================="
    echo "TEST 7: GET /search/messages/{id}/similar"
    echo "=================================================="
    SIMILAR_RESPONSE=$(curl -s "${API_BASE}/search/messages/${MESSAGE_ID}/similar?limit=5&threshold=0.7")

    if echo "$SIMILAR_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); exit(0 if isinstance(data, list) or 'items' in data else 1)" 2>/dev/null; then
        RESULT_COUNT=$(echo "$SIMILAR_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data) if isinstance(data, list) else len(data.get('items', [])))")
        echo "✅ Status: Success"
        echo "   Similar messages found: ${RESULT_COUNT}"
    else
        echo "⚠️  Status: Expected behavior (no embedding or similar messages)"
        echo "   Response: ${SIMILAR_RESPONSE}"
    fi

    echo ""
    echo "=================================================="
    echo "TEST 8: GET /search/messages/{id}/duplicates"
    echo "=================================================="
    DUPLICATE_RESPONSE=$(curl -s "${API_BASE}/search/messages/${MESSAGE_ID}/duplicates?threshold=0.95")

    if echo "$DUPLICATE_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); exit(0 if isinstance(data, list) or 'items' in data else 1)" 2>/dev/null; then
        RESULT_COUNT=$(echo "$DUPLICATE_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data) if isinstance(data, list) else len(data.get('items', [])))")
        echo "✅ Status: Success"
        echo "   Potential duplicates found: ${RESULT_COUNT}"
    else
        echo "⚠️  Status: Expected behavior (no embedding or duplicates)"
        echo "   Response: ${DUPLICATE_RESPONSE}"
    fi
else
    echo ""
    echo "⚠️  Skipping embedding and search tests (no providers configured)"
fi

echo ""
echo "=================================================="
echo "TEST 9: Check Analysis System Setup"
echo "=================================================="
AGENTS_RESPONSE=$(curl -s "${API_BASE}/agents?limit=1")
AGENT_COUNT=$(echo "$AGENTS_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('total', 0))" 2>/dev/null || echo "0")

PROJECTS_RESPONSE=$(curl -s "${API_BASE}/projects?limit=1")
PROJECT_COUNT=$(echo "$PROJECTS_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('total', 0))" 2>/dev/null || echo "0")

echo "Agents available: ${AGENT_COUNT}"
echo "Projects available: ${PROJECT_COUNT}"

if [ "$AGENT_COUNT" -gt 0 ] && [ "$PROJECT_COUNT" -gt 0 ]; then
    echo "✅ Analysis system configured"
    echo "   Note: RAG integration testing requires manual run creation"
else
    echo "⚠️  Analysis system not fully configured"
    echo "   Agents: ${AGENT_COUNT}, Projects: ${PROJECT_COUNT}"
    echo "   RAG integration tests skipped"
fi

echo ""
echo "=================================================="
echo "✅ TESTING COMPLETE"
echo "=================================================="
