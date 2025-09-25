default:
    @just --list

# Aliases
alias ss := services
alias st := services-stop
alias sc := services-clean
alias sca := services-clean-all


# Reinstall UV venv and all deps localy
rds:
    rm -rf .venv
    uv venv --python 3.13
    uv sync --all-groups

# Список сервісів
SERVICES := "postgres nats worker api dashboard nginx"

# Start services (production mode)
services:
    @echo "Starting services (postgres nats worker api dashboard nginx)..."
    docker compose up -d postgres nats worker api dashboard nginx
    @echo "Services started."
    @echo "🌐 Available at: http://localhost"
    @echo "📱 Telegram WebApp: http://localhost/webapp"
    @echo "📊 Dashboard: http://localhost/dashboard"
    @echo "🔗 Webhook URL: http://localhost/webhook/telegram"

# Start services in development mode with watch
services-dev:
    @echo "Starting services in development mode with file watching..."
    docker compose watch

# Start specific service in development mode
dev SERVICE:
    @echo "Starting {{SERVICE}} in development mode..."
    docker compose watch {{SERVICE}}

# Rebuild specific service
rebuild SERVICE:
    @echo "Rebuilding {{SERVICE}}..."
    docker compose build {{SERVICE}} --no-cache
    docker compose up -d {{SERVICE}}


# Stop services
services-stop:
    @echo "Stopping services..."
    docker compose down postgres nats worker api dashboard nginx
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

# Run tests
test:
    @echo "Running tests..."
    uv run python -m pytest

# Lint the code
lint:
    @echo "Linting code..."
    uv run ruff check backend --fix

# Format the code
fmt:
    @echo "Formatting code..."
    uv run ruff format backend

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
