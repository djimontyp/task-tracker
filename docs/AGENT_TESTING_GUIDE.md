# Agent Testing Guide

## Overview
This guide explains how to configure, test, and troubleshoot AI agents in the Task Tracker system.

## Prerequisites
1. At least one active LLM Provider configured
2. Provider must be validated (status: "connected")
3. API keys properly encrypted in the database

## Creating an Agent

### Step 1: Configure LLM Provider
Before creating agents, ensure you have an active provider:

1. Go to **Providers** page
2. Click "Add Provider"
3. Select provider type (Ollama or OpenAI)
4. Configure:
   - **Ollama**: Provide base_url (e.g., `http://localhost:11434`)
   - **OpenAI**: Provide API key (starts with `sk-`)
5. Save and wait for validation

### Step 2: Create Agent
1. Go to **Agents** page
2. Click "Add Agent"
3. Fill in required fields:
   - **Name**: Unique identifier for the agent
   - **Provider**: Select from active providers
   - **Model Name**: Model to use (e.g., `llama3.2:latest`, `gpt-4`)
   - **System Prompt**: Instructions for the AI
   - **Temperature** (optional): 0.0-1.0, controls randomness
   - **Max Tokens** (optional): Maximum response length
4. Click "Create"

## Testing an Agent

### Using the Test Dialog

1. Find your agent in the Agents list
2. Click the test tube icon (🧪)
3. Enter a test prompt (minimum 50 characters)
4. Click "Test Agent"

The response will show:
- **Response**: AI-generated answer
- **Model**: Model name used
- **Provider**: Provider type (ollama/openai)
- **Execution Time**: Time taken in milliseconds

### Example Prompts
- "Explain quantum computing in simple terms"
- "Write a haiku about programming"
- "Summarize the benefits of async programming"

### Character Limits
- **Minimum**: 50 characters
- **Maximum**: 2000 characters

## Troubleshooting

### Common Errors

#### "Provider is inactive"
**Cause**: The associated LLM provider is disabled
**Solution**: Go to Providers page and activate the provider

#### "Provider not validated"
**Cause**: Provider validation failed or is pending
**Solution**:
1. Check provider configuration (URL, API key)
2. Re-validate the provider
3. Check provider validation error message

#### "Agent not found"
**Cause**: Agent was deleted or ID is incorrect
**Solution**: Refresh the page and try again

#### "Failed to decrypt API key"
**Cause**: Encryption key changed or corrupted
**Solution**: Contact system administrator

#### "LLM request failed"
**Cause**: Network error or LLM service unavailable
**Solution**:
1. Check if LLM service is running (Ollama/OpenAI)
2. Verify network connectivity
3. Check API rate limits (OpenAI)

### Provider-Specific Issues

#### Ollama
- Ensure Ollama is running: `ollama serve`
- Model must be pulled: `ollama pull llama3.2`
- Base URL must be accessible from backend
- Default URL: `http://localhost:11434`

#### OpenAI
- API key must be valid (starts with `sk-`)
- Check API rate limits and quotas
- Verify billing is active
- Model name must exist (e.g., `gpt-4`, `gpt-3.5-turbo`)

## Best Practices

### Agent Configuration
- Use descriptive names (e.g., "Code Review Agent", "Summary Agent")
- Write clear, specific system prompts
- Set appropriate temperature:
  - 0.0-0.3: Deterministic, factual responses
  - 0.4-0.7: Balanced creativity and accuracy
  - 0.8-1.0: Creative, varied responses
- Limit max_tokens for cost control (OpenAI)

### Testing Strategy
1. Start with simple prompts to verify basic functionality
2. Test edge cases (very short/long prompts)
3. Verify temperature affects response variation
4. Check execution time for performance
5. Test with different providers if available

### Security
- Never share API keys
- Rotate OpenAI keys regularly
- Use separate API keys for development/production
- Monitor API usage and costs

## API Integration

Developers can integrate agent testing programmatically:

```typescript
import { agentService } from '@/features/agents/api'

// Test agent
const result = await agentService.testAgent(agentId, "Your prompt here")

console.log(result.response)        // AI response
console.log(result.execution_time_ms) // Time taken
console.log(result.model)            // Model used
console.log(result.provider)         // Provider type
```

## Monitoring

### Metrics to Track
- Execution time trends
- Error rates by provider
- Token usage (OpenAI)
- Response quality

### Logs
Agent testing logs are available in:
- Backend logs: `/backend/logs/` (if configured)
- Provider validation errors: Check provider details

## Advanced Features

### Temperature Tuning
Experiment with temperature values to find optimal settings:
- Classification tasks: 0.1-0.3
- Content generation: 0.5-0.8
- Creative writing: 0.8-1.0

### Prompt Engineering
Effective system prompts:
```
✅ Good: "You are a code reviewer. Analyze code for bugs, performance issues, and best practices. Provide specific, actionable feedback."

❌ Bad: "Review code"
```

### Model Selection
- **Smaller models** (llama3.2): Faster, lower cost, good for simple tasks
- **Larger models** (gpt-4): Higher quality, slower, better for complex reasoning
```