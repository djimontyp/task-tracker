# Task Tracker Project Documentation

## Project Overview

This is a universal task tracking system that processes messages from various communication channels (Telegram, Slack, etc.) and automatically classifies them as issues/tasks using AI.

## Quick Start

1. **Setup environment**: Copy `.env.example` to `.env` and configure:
   - `TELEGRAM_BOT_TOKEN` - Get from @BotFather on Telegram
2. **Start all services**: `just services` (PostgreSQL, NATS, API, Dashboard, Worker, Nginx)
3. **Alternative - run bot locally**: `just bot` (for development)

## Core Architecture

The system follows a microservices event-driven pattern with the following key components:
1. **Telegram Bot**: Handles message reception and bot commands
2. **FastAPI Backend**: Provides REST API for task management and message processing
3. **React Dashboard**: Web interface for real-time message display and task management
4. **Worker Service**: TaskIQ worker for background processing
5. **Docker Services**: PostgreSQL, NATS, and supporting infrastructure

## Documentation References

See @README for project overview and @justfile for available commands for this project.

- [Backend Documentation](/backend/CLAUDE.md): Detailed backend architecture, API endpoints, database integration
- [Frontend Documentation](/frontend/CLAUDE.md): Frontend React dashboard details, UI/UX, development workflow

# Additional Instructions
- Backend development: @backend/CLAUDE.md
- Frontend development: @frontend/CLAUDE.md

## Development Commands

See specific backend and frontend documentation for detailed command lists.

### Common Project Commands

- `just services`: Start all services via Docker
- `just services-dev`: Start services in development mode with file watching
- `just test`: Run all tests
- `just lint`: Lint code
- `just fmt`: Format code

## Task Delegation and Code Guidelines

### Core Principles

1. **Strict Delegation**: Tasks are delegated to specialized agents whenever possible
2. **Code Quality**: Prioritize clean, maintainable, and well-documented code
3. **Modern Patterns**: Use async programming, dependency injection, and type safety

### Forbidden Actions

- Do not modify dependencies without explicit user approval
- Avoid direct modifications to system or cache directories
- Never commit sensitive information

## License and Contribution

[License details to be added]

## Last Updated

September 2025