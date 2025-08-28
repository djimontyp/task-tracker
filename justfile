# Justfile for managing PostgreSQL service

default:
    @just --list

alias ss := start
alias st := stop

# Start PostgreSQL service
start:
    @docker-compose up -d postgres
    @echo "PostgreSQL service started successfully!"

# Stop PostgreSQL service
stop:
    @docker-compose down postgres
    @echo "PostgreSQL service stopped successfully!"

