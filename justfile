# Justfile for managing PostgreSQL service and Task Tracker

default:
    @just --list

alias ss := services
alias st := services-stop

# Start services
services:
    @echo "Starting PostgreSQL service..."
    docker compose up -d postgres
    @echo "PostgreSQL service started."

# Stop services
services-stop:
    @echo "Stopping PostgreSQL service..."
    docker compose down
    @echo "PostgreSQL service stopped."

# Run the application
run:
    @echo "Running Task Tracker..."
    uv run python -m src.main

# Run tests
test:
    @echo "Running tests..."
    uv run pytest

# Run tests with coverage
test-cov:
    @echo "Running tests with coverage..."
    uv run pytest --cov=src --cov-report=html --cov-report=term

# Lint the code
lint:
    @echo "Linting code..."
    uv run ruff check src tests

# Format the code
fmt:
    @echo "Formatting code..."
    uv run ruff format src tests

# Type check the code
type-check:
    @echo "Type checking code..."
    uv run mypy src tests