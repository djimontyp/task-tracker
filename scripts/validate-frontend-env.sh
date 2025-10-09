#!/bin/bash
# Frontend environment validation script

set -e

echo "🔍 Validating frontend environment variables..."

# Required variables
REQUIRED_VARS=(
  "VITE_API_BASE_URL"
  "VITE_WS_URL"
)

# Check each required variable
MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  else
    echo "✅ $var is set"
  fi
done

# Report missing variables
if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo ""
  echo "❌ Missing required environment variables:"
  for var in "${MISSING_VARS[@]}"; do
    echo "   - $var"
  done
  echo ""
  echo "Please check your .env file or environment configuration."
  exit 1
fi

echo ""
echo "✅ All required environment variables are set!"
