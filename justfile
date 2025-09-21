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
    uv run python -m src run

# Run tests
test:
    @echo "Running tests..."
    uv run python -m pytest

# Lint the code
lint:
    @echo "Linting code..."
    uv run ruff check src --fix

# Format the code
fmt:
    @echo "Formatting code..."
    uv run ruff format src

# Run lint and format
check: lint fmt

# Install dependencies
install-dev:
    @echo "Installing dependencies..."
    uv sync --all-groups

# Upgrade dependencies
upgrade:
    @echo "Updating dependencies..."
    uv lock --upgrade --all-groups
