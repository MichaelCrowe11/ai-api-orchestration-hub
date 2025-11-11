# API Examples

Comprehensive examples for using the AI API Orchestration Hub.

## Table of Contents

- [Basic Requests](#basic-requests)
- [Advanced Usage](#advanced-usage)
- [Error Handling](#error-handling)
- [Cost Optimization](#cost-optimization)
- [Provider-Specific Requests](#provider-specific-requests)
- [Monitoring and Metrics](#monitoring-and-metrics)

## Basic Requests

### Simple Text Completion

```bash
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a haiku about programming",
    "maxTokens": 100
  }'
```

Response:
```json
{
  "id": "openai-1234567890-abc123",
  "provider": "openai",
  "model": "gpt-3.5-turbo",
  "content": "Code flows like water\nBugs hide in silent corners\nDebug and conquer",
  "usage": {
    "promptTokens": 8,
    "completionTokens": 15,
    "totalTokens": 23
  },
  "cost": 0.000035,
  "latency": 892,
  "cached": false,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Chat Conversation

```bash
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful coding assistant."},
      {"role": "user", "content": "How do I reverse a string in Python?"}
    ],
    "maxTokens": 200
  }'
```

### Streaming Response (Future Feature)

```bash
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain machine learning",
    "stream": true,
    "maxTokens": 500
  }'
```

## Advanced Usage

### Multi-Turn Conversation

```typescript
const conversation = [
  { role: "system", content: "You are a helpful assistant." }
];

async function chat(userMessage: string) {
  conversation.push({ role: "user", content: userMessage });

  const response = await fetch('http://localhost:3000/v1/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: conversation,
      maxTokens: 500
    })
  });

  const data = await response.json();
  conversation.push({ role: "assistant", content: data.content });

  return data;
}

// Usage
await chat("What is TypeScript?");
await chat("How is it different from JavaScript?");
await chat("Show me an example");
```

### Temperature Control

```bash
# More creative (temperature = 1.5)
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a creative story about a robot",
    "temperature": 1.5,
    "maxTokens": 500
  }'

# More deterministic (temperature = 0.2)
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is 2+2?",
    "temperature": 0.2,
    "maxTokens": 50
  }'
```

### With Metadata

```bash
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Translate to French: Hello, how are you?",
    "maxTokens": 100,
    "metadata": {
      "userId": "user123",
      "sessionId": "session456",
      "task": "translation"
    }
  }'
```

## Error Handling

### Budget Exceeded

```bash
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a long essay",
    "maxTokens": 10000
  }'
```

Response (429 Too Many Requests):
```json
{
  "error": "Daily budget limit exceeded",
  "code": "BUDGET_EXCEEDED",
  "details": {
    "dailyCost": 100.50,
    "limit": 100.00
  }
}
```

### Invalid Request

```bash
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "maxTokens": 100
  }'
```

Response (400 Bad Request):
```json
{
  "error": "Either prompt or messages must be provided"
}
```

### Provider Failure with Automatic Failover

```typescript
// The hub automatically tries alternative providers
try {
  const response = await fetch('http://localhost:3000/v1/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: "Hello world",
      maxTokens: 100
    })
  });

  const data = await response.json();
  console.log(`Successful with ${data.provider}`);
} catch (error) {
  console.error('All providers failed:', error);
}
```

## Cost Optimization

### Set Maximum Cost Per Request

```bash
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Summarize this article: ...",
    "maxCost": 0.01,
    "maxTokens": 1000
  }'
```

### Cost-Optimized Batch Processing

```python
import requests
from typing import List

def batch_process_with_budget(prompts: List[str], total_budget: float):
    results = []
    spent = 0.0
    cost_per_request = total_budget / len(prompts)

    for prompt in prompts:
        if spent >= total_budget:
            print(f"Budget exhausted at {spent:.2f}")
            break

        response = requests.post(
            'http://localhost:3000/v1/completions',
            json={
                'prompt': prompt,
                'maxCost': cost_per_request,
                'maxTokens': 500
            }
        )

        if response.ok:
            data = response.json()
            results.append(data)
            spent += data['cost']
            print(f"Processed: {prompt[:50]}... Cost: ${data['cost']:.4f}")

    print(f"Total spent: ${spent:.4f} / ${total_budget:.2f}")
    return results

# Process 100 prompts with $10 budget
prompts = [...]  # Your prompts
results = batch_process_with_budget(prompts, 10.0)
```

### Compare Provider Costs

```bash
# Check current metrics to see cost per provider
curl http://localhost:3000/v1/metrics

# Response shows per-provider costs
{
  "totalCost": 5.24,
  "providerStats": {
    "openai": {
      "totalCost": 2.10,
      "requests": 100
    },
    "anthropic": {
      "totalCost": 1.80,
      "requests": 75
    },
    "google": {
      "totalCost": 1.34,
      "requests": 120
    }
  }
}
```

## Provider-Specific Requests

### Force Specific Provider

```bash
# Use OpenAI specifically
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello",
    "provider": "openai",
    "model": "gpt-4"
  }'

# Use Anthropic Claude
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello",
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022"
  }'

# Use Google Gemini
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello",
    "provider": "google",
    "model": "gemini-1.5-flash"
  }'
```

### Auto-Select Best Provider

```bash
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing",
    "provider": "auto",
    "maxTokens": 500
  }'
```

## Monitoring and Metrics

### Get Current Metrics

```bash
curl http://localhost:3000/v1/metrics
```

Response:
```json
{
  "totalRequests": 1543,
  "successfulRequests": 1521,
  "failedRequests": 22,
  "totalCost": 45.67,
  "averageLatency": 1234,
  "cacheHitRate": 0.23,
  "providerStats": {
    "openai": {
      "requests": 650,
      "successes": 645,
      "failures": 5,
      "totalCost": 18.90,
      "averageLatency": 1100
    },
    "anthropic": {
      "requests": 500,
      "successes": 498,
      "failures": 2,
      "totalCost": 15.20,
      "averageLatency": 1350
    },
    "google": {
      "requests": 393,
      "successes": 378,
      "failures": 15,
      "totalCost": 11.57,
      "averageLatency": 1400
    }
  }
}
```

### Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "providers": {
    "openai": true,
    "anthropic": true,
    "google": true,
    "cohere": false
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### List Available Providers

```bash
curl http://localhost:3000/v1/providers
```

Response:
```json
{
  "providers": [
    {
      "name": "openai",
      "enabled": true,
      "healthy": true
    },
    {
      "name": "anthropic",
      "enabled": true,
      "healthy": true
    },
    {
      "name": "google",
      "enabled": true,
      "healthy": true
    },
    {
      "name": "cohere",
      "enabled": true,
      "healthy": false
    }
  ]
}
```

## Real-World Use Cases

### Content Generation Service

```typescript
async function generateBlogPost(topic: string) {
  const outline = await fetch('http://localhost:3000/v1/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `Create a blog post outline about: ${topic}`,
      maxTokens: 300,
      temperature: 0.7
    })
  }).then(r => r.json());

  const content = await fetch('http://localhost:3000/v1/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `Write a blog post based on this outline:\n${outline.content}`,
      maxTokens: 2000,
      maxCost: 0.05
    })
  }).then(r => r.json());

  return {
    outline: outline.content,
    content: content.content,
    totalCost: outline.cost + content.cost
  };
}
```

### Code Review Assistant

```typescript
async function reviewCode(code: string, language: string) {
  const response = await fetch('http://localhost:3000/v1/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        {
          role: 'system',
          content: 'You are an expert code reviewer. Provide constructive feedback.'
        },
        {
          role: 'user',
          content: `Review this ${language} code:\n\n${code}`
        }
      ],
      maxTokens: 1000,
      temperature: 0.3
    })
  });

  return response.json();
}
```

### Customer Support Bot

```typescript
class SupportBot {
  private conversationHistory: Array<{role: string; content: string}> = [];

  async respond(userMessage: string) {
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    const response = await fetch('http://localhost:3000/v1/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful customer support assistant.'
          },
          ...this.conversationHistory
        ],
        maxTokens: 500,
        provider: 'auto'
      })
    });

    const data = await response.json();

    this.conversationHistory.push({
      role: 'assistant',
      content: data.content
    });

    return data;
  }

  reset() {
    this.conversationHistory = [];
  }
}
```

## Performance Optimization

### Leverage Caching

```typescript
// Identical requests will be cached
const requests = [
  { prompt: "What is AI?", maxTokens: 100 },
  { prompt: "What is AI?", maxTokens: 100 },  // Cached
  { prompt: "What is AI?", maxTokens: 100 }   // Cached
];

for (const req of requests) {
  const response = await fetch('http://localhost:3000/v1/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });

  const data = await response.json();
  console.log(`Cached: ${data.cached}, Cost: $${data.cost}`);
}
// First request: Cached: false, Cost: $0.0023
// Second request: Cached: true, Cost: $0.0000
// Third request: Cached: true, Cost: $0.0000
```

### Parallel Processing

```typescript
async function processMultiple(prompts: string[]) {
  const promises = prompts.map(prompt =>
    fetch('http://localhost:3000/v1/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        maxTokens: 500,
        maxCost: 0.01
      })
    }).then(r => r.json())
  );

  return Promise.all(promises);
}

// Process 10 prompts in parallel
const results = await processMultiple([...]);
```
