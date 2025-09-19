# Justfile for managing PostgreSQL service and Task Tracker

default:
    @just --list

# Aliases
alias ss := services
alias st := services-stop
alias sc := services-clean
alias sca := services-clean-all

# Список сервісів
SERVICES := "postgres nats worker"

# Start services
services:
    @echo "Starting services ($(SERVICES))..."
    docker compose up -d postgres nats worker
    @echo "Services started."

# Stop services
services-stop:
    @echo "Stopping services..."
    docker compose down postgres nats worker
    @echo "Services stopped."

# Full clean services without volumes
services-clean:
    @echo "Stopping and removing services containers..."
    docker compose down
    @echo "Services containers removed."

# Full clean services with images removal
services-clean-all:
    @echo "Stopping and removing services containers and images..."
    docker compose down --rmi all
    @echo "Services containers and images removed."

# Run the application
run:
    @echo "Running Task Tracker..."
    uv run python -m src.main run

# Run TaskIQ worker
worker:
    @echo "Starting TaskIQ worker..."
    uv run taskiq worker src.taskiq_config:nats_broker src.worker

# Run tests
test:
    @echo "Running tests..."
    uv run python -m pytest

# Run tests with coverage
test-cov:
    @echo "Running tests with coverage..."
    uv run python -m pytest --cov=src --cov-report=html --cov-report=term

# Run integration tests
test-integration:
    @echo "Running integration tests..."
    @echo "Make sure services are running with 'just services' before running this command."
    RUN_INTEGRATION_TESTS=true uv run python -m pytest -k "integration" -v

# Lint the code
lint:
    @echo "Linting code..."
    uv run ruff check src --fix

# Format the code
fmt:
    @echo "Formatting code..."
    uv run ruff format src

# Run all checks
check: lint fmt test

# Install dependencies
install:
    @echo "Installing dependencies..."
    uv sync

# Update dependencies
update:
    @echo "Updating dependencies..."
    uv lock --upgrade --all-groups

# Clean up
clean:
    @echo "Cleaning up..."
    rm -rf .coverage htmlcov .pytest_cache __pycache__ */__pycache__
    @echo "Cleaned up."