# Frontend Documentation

## Architecture Overview

A modern, responsive React TypeScript dashboard for real-time task tracking and management.

## Technology Stack
- React 18.3.1
- TypeScript
- WebSocket for real-time updates
- CSS with adaptive design
- Docker-based development workflow

## Key Features

### UI/UX Design
- **Responsive Layout**: Adaptive design for 2K+ monitors
- **Tab Navigation**:
  - Centered tabs with professional design
  - Adaptive sizing (1.5rem - 2.5rem)
  - Hover animations
  - Mobile-friendly bottom navigation bar

### Dashboard Components
- Real-time task and message display
- WebSocket connection status
- Flexible, expandable message container
- Optimized content hierarchy

## Development Workflow

### Docker Compose Watch
- Live CSS/JS synchronization
- No rebuild required during development
- Automatic file sync from `./frontend/src` to container

### Build Process
- `react-scripts` 5.0.1
- TypeScript compilation
- Static file generation
- Nginx-based production serving

## Development Commands

### Local Development
- `npm start`: Start development server
- `npm run build`: Create production build
- `npm test`: Run test suite

### Docker-specific
- `just services-dev`: Start with live reload
- `just dev dashboard`: Watch frontend service

## Configuration

### Environment Variables
- `REACT_APP_API_URL`: Backend API endpoint
- `REACT_APP_WS_URL`: WebSocket connection URL

## WebSocket Integration
- Real-time message and task updates
- Automatic reconnection
- Connection status tracking

## UI Breakpoints
- Base: Default mobile design
- 2K: Enhanced layout, larger components
- 4K: Ultra-high resolution optimizations

## Current Status

### ✅ Working Components
- Responsive dashboard
- WebSocket connectivity
- Docker watch integration
- Basic task management UI

### 🔄 Planned Improvements
- Enhanced filtering
- More interactive components
- Advanced state management

## Development Guidelines

### Code Quality
- Use TypeScript strict mode
- Implement prop types
- Write unit tests for components
- Follow React best practices

### Performance Optimization
- Lazy loading of components
- Minimal re-renders
- Efficient state management

## Troubleshooting

### Common Issues
- Ensure backend API is running
- Check WebSocket connection
- Verify environment variables

## Last Updated
September 2025