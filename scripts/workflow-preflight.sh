#!/bin/bash
# Workflow Pre-flight Health Check
# Validates all integrations before starting work
#
# Usage:
#   ./scripts/workflow-preflight.sh         # Full check
#   ./scripts/workflow-preflight.sh --quick # Skip slow checks (tests)
#   ./scripts/workflow-preflight.sh --skip  # Skip all (emergency)

# Don't use set -e - we handle errors via ERRORS counter

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
QUICK_MODE=false
SKIP_ALL=false

for arg in "$@"; do
  case $arg in
    --quick|-q)
      QUICK_MODE=true
      ;;
    --skip|-s)
      SKIP_ALL=true
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --quick, -q  Skip slow checks (test collection)"
      echo "  --skip, -s   Skip all checks (emergency mode)"
      echo "  --help, -h   Show this help"
      exit 0
      ;;
  esac
done

if [ "$SKIP_ALL" = true ]; then
  echo -e "${YELLOW}⚠️  Skipping all pre-flight checks (emergency mode)${NC}"
  exit 0
fi

echo -e "${BLUE}🔍 Workflow Pre-flight Check${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ERRORS=0
WARNINGS=0

# Helper function
check_pass() {
  echo -e "  ${GREEN}✓${NC} $1"
}

check_warn() {
  echo -e "  ${YELLOW}⚠${NC} $1"
  ((WARNINGS++))
}

check_fail() {
  echo -e "  ${RED}✗${NC} $1"
  ((ERRORS++))
}

# 1. Git Status
echo ""
echo -e "${BLUE}Git Status${NC}"
if git rev-parse --git-dir > /dev/null 2>&1; then
  check_pass "Git repository detected"

  # Check for uncommitted changes
  if [[ -z $(git status --porcelain) ]]; then
    check_pass "Working tree clean"
  else
    check_warn "Uncommitted changes present"
  fi

  # Check current branch
  BRANCH=$(git branch --show-current)
  check_pass "On branch: $BRANCH"
else
  check_fail "Not a git repository"
fi

# 2. Beads Status
echo ""
echo -e "${BLUE}Beads Issue Tracker${NC}"
if command -v bd &> /dev/null; then
  check_pass "bd CLI installed"

  # Check if beads is initialized
  if [ -f ".beads/issues.jsonl" ]; then
    check_pass "Beads initialized (.beads/issues.jsonl)"

    # Try daemon status
    if bd daemon --status 2>&1 | grep -q "running"; then
      check_pass "Beads daemon running"
    else
      check_warn "Beads daemon not running (will auto-start)"
    fi

    # Count issues
    ISSUE_COUNT=$(bd list --json 2>/dev/null | jq 'length' 2>/dev/null || echo "0")
    check_pass "Issues in tracker: $ISSUE_COUNT"
  else
    check_fail "Beads not initialized (run: bd init)"
  fi
else
  check_fail "bd CLI not installed"
fi

# 3. Obsidian Vault
echo ""
echo -e "${BLUE}Obsidian Vault${NC}"
if [ -d ".obsidian-docs" ]; then
  check_pass "Vault directory exists"

  # Check for vault config
  if [ -d ".obsidian-docs/.obsidian" ]; then
    check_pass "Obsidian config present"
  else
    check_warn "No .obsidian config (vault not opened in Obsidian)"
  fi

  # Count notes
  NOTE_COUNT=$(find .obsidian-docs -name "*.md" | wc -l | tr -d ' ')
  check_pass "Markdown notes: $NOTE_COUNT"

  # Check journal directory
  if [ -d ".obsidian-docs/Workspace/Journal" ]; then
    check_pass "Journal directory exists"
  else
    check_warn "Journal directory missing"
  fi
else
  check_fail "Obsidian vault not found (.obsidian-docs/)"
fi

# 4. Frontend Health
echo ""
echo -e "${BLUE}Frontend Health${NC}"
if [ -d "frontend" ]; then
  check_pass "Frontend directory exists"

  # Check node_modules
  if [ -d "frontend/node_modules" ]; then
    check_pass "Dependencies installed"
  else
    check_warn "node_modules missing (run: cd frontend && npm install)"
  fi

  # TypeScript check (quick)
  if [ "$QUICK_MODE" = false ]; then
    echo -e "  ${BLUE}→${NC} Running TypeScript check..."
    if cd frontend && timeout 60 npx tsc --noEmit > /dev/null 2>&1; then
      check_pass "TypeScript compilation OK"
    else
      check_fail "TypeScript errors (run: cd frontend && npx tsc --noEmit)"
    fi
    cd - > /dev/null
  else
    check_warn "TypeScript check skipped (--quick mode)"
  fi
else
  check_fail "Frontend directory not found"
fi

# 5. Backend Health
echo ""
echo -e "${BLUE}Backend Health${NC}"
if [ -d "backend" ]; then
  check_pass "Backend directory exists"

  # Check venv
  if [ -d ".venv" ]; then
    check_pass "Virtual environment exists"
  else
    check_warn "Virtual environment missing (run: uv venv)"
  fi

  # Pytest collection (quick)
  if [ "$QUICK_MODE" = false ]; then
    echo -e "  ${BLUE}→${NC} Collecting backend tests..."
    if cd backend && timeout 30 uv run pytest --collect-only -q > /dev/null 2>&1; then
      TEST_COUNT=$(cd backend && uv run pytest --collect-only -q 2>/dev/null | tail -1 | grep -oE '[0-9]+' | head -1 || echo "?")
      check_pass "Backend tests collectable: $TEST_COUNT"
    else
      check_warn "Backend test collection issue"
    fi
    cd - > /dev/null 2>&1 || true
  else
    check_warn "Test collection skipped (--quick mode)"
  fi
else
  check_fail "Backend directory not found"
fi

# 6. Services Status (optional)
echo ""
echo -e "${BLUE}Services (Docker)${NC}"
if command -v docker &> /dev/null; then
  check_pass "Docker installed"

  # Check if compose services running
  RUNNING=$(docker compose ps --services --filter "status=running" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$RUNNING" -gt 0 ]; then
    check_pass "Docker services running: $RUNNING"
  else
    check_warn "No Docker services running (run: just services-dev)"
  fi
else
  check_warn "Docker not installed"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}❌ Pre-flight FAILED: $ERRORS errors, $WARNINGS warnings${NC}"
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Pre-flight PASSED with $WARNINGS warnings${NC}"
  exit 0
else
  echo -e "${GREEN}✅ Pre-flight PASSED: All checks OK${NC}"
  exit 0
fi
