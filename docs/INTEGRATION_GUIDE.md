# Integration Guide

This guide shows how to integrate the AI API Orchestration Hub into your projects.

## Table of Contents

- [Backend Services](#backend-services)
- [Web Applications](#web-applications)
- [Python Projects](#python-projects)
- [Data Pipelines](#data-pipelines)
- [Microservices](#microservices)
- [Client Libraries](#client-libraries)

## Backend Services

### Node.js/Express

```typescript
import express from 'express';
import axios from 'axios';

const app = express();
const aiHub = axios.create({
  baseURL: process.env.AI_HUB_URL || 'http://localhost:3000'
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    const response = await aiHub.post('/v1/completions', {
      messages: [
        { role: 'user', content: message }
      ],
      maxTokens: 500,
      provider: 'auto'
    });

    res.json({
      reply: response.data.content,
      cost: response.data.cost,
      provider: response.data.provider
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### NestJS Service

```typescript
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiOrchestratorService {
  constructor(private httpService: HttpService) {}

  async complete(prompt: string, options?: CompletionOptions) {
    const response = await firstValueFrom(
      this.httpService.post('http://localhost:3000/v1/completions', {
        prompt,
        ...options
      })
    );

    return response.data;
  }

  async chat(messages: Array<{role: string; content: string}>) {
    const response = await firstValueFrom(
      this.httpService.post('http://localhost:3000/v1/completions', {
        messages,
        provider: 'auto'
      })
    );

    return response.data;
  }

  async getMetrics() {
    const response = await firstValueFrom(
      this.httpService.get('http://localhost:3000/v1/metrics')
    );

    return response.data;
  }
}
```

## Web Applications

### React Frontend

```typescript
// services/ai.ts
const AI_HUB_URL = import.meta.env.VITE_AI_HUB_URL || '/api';

export async function getAiCompletion(prompt: string) {
  const response = await fetch(`${AI_HUB_URL}/v1/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      maxTokens: 1000,
      provider: 'auto'
    })
  });

  if (!response.ok) {
    throw new Error('AI request failed');
  }

  return response.json();
}

// Component usage
import { useState } from 'react';
import { getAiCompletion } from './services/ai';

function ChatComponent() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await getAiCompletion(input);
      setResponse(result.content);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask me anything..."
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Thinking...' : 'Send'}
      </button>
      {response && <div>{response}</div>}
    </form>
  );
}
```

### Next.js API Route

```typescript
// app/api/ai/route.ts
import { NextRequest, NextResponse } from 'next/server';

const AI_HUB_URL = process.env.AI_HUB_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const { prompt, maxTokens = 1000 } = await request.json();

    const response = await fetch(`${AI_HUB_URL}/v1/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        maxTokens,
        provider: 'auto'
      })
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
```

## Python Projects

### Basic Python Client

```python
import requests
from typing import Optional, List, Dict

class AIOrchestrator:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url

    def complete(
        self,
        prompt: Optional[str] = None,
        messages: Optional[List[Dict]] = None,
        max_tokens: int = 1000,
        provider: str = "auto",
        max_cost: Optional[float] = None
    ) -> Dict:
        payload = {
            "maxTokens": max_tokens,
            "provider": provider
        }

        if prompt:
            payload["prompt"] = prompt
        elif messages:
            payload["messages"] = messages
        else:
            raise ValueError("Either prompt or messages must be provided")

        if max_cost:
            payload["maxCost"] = max_cost

        response = requests.post(
            f"{self.base_url}/v1/completions",
            json=payload
        )
        response.raise_for_status()
        return response.json()

    def get_metrics(self) -> Dict:
        response = requests.get(f"{self.base_url}/v1/metrics")
        response.raise_for_status()
        return response.json()

    def health_check(self) -> Dict:
        response = requests.get(f"{self.base_url}/health")
        response.raise_for_status()
        return response.json()

# Usage
ai = AIOrchestrator()

# Simple prompt
result = ai.complete(prompt="What is machine learning?", max_tokens=500)
print(result['content'])
print(f"Cost: ${result['cost']:.4f}")

# Chat messages
result = ai.complete(
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain quantum computing"}
    ]
)
print(result['content'])
```

### FastAPI Integration

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx

app = FastAPI()

AI_HUB_URL = "http://localhost:3000"

class ChatRequest(BaseModel):
    message: str
    max_tokens: int = 1000

class ChatResponse(BaseModel):
    content: str
    cost: float
    provider: str
    latency: int

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AI_HUB_URL}/v1/completions",
                json={
                    "prompt": request.message,
                    "maxTokens": request.max_tokens,
                    "provider": "auto"
                }
            )
            response.raise_for_status()
            data = response.json()

            return ChatResponse(
                content=data['content'],
                cost=data['cost'],
                provider=data['provider'],
                latency=data['latency']
            )
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=str(e))
```

## Data Pipelines

### Batch Processing with Pandas

```python
import pandas as pd
from ai_orchestrator import AIOrchestrator
from tqdm import tqdm

ai = AIOrchestrator()

def process_batch(df: pd.DataFrame, prompt_column: str) -> pd.DataFrame:
    """
    Process a batch of prompts and add AI responses
    """
    results = []

    for prompt in tqdm(df[prompt_column]):
        try:
            result = ai.complete(
                prompt=prompt,
                max_tokens=500,
                max_cost=0.01  # Cost-optimized
            )
            results.append({
                'response': result['content'],
                'cost': result['cost'],
                'provider': result['provider']
            })
        except Exception as e:
            results.append({
                'response': None,
                'cost': 0,
                'provider': None,
                'error': str(e)
            })

    result_df = pd.DataFrame(results)
    return pd.concat([df, result_df], axis=1)

# Usage
df = pd.read_csv('prompts.csv')
processed_df = process_batch(df, 'prompt')
processed_df.to_csv('results.csv', index=False)

print(f"Total cost: ${processed_df['cost'].sum():.2f}")
```

## Microservices

### Docker Compose Multi-Service Setup

```yaml
version: '3.8'

services:
  ai-orchestrator:
    image: ai-orchestration-hub:latest
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    networks:
      - microservices

  api-gateway:
    image: your-api-gateway:latest
    environment:
      - AI_HUB_URL=http://ai-orchestrator:3000
    depends_on:
      - ai-orchestrator
    networks:
      - microservices

  content-service:
    image: your-content-service:latest
    environment:
      - AI_HUB_URL=http://ai-orchestrator:3000
    depends_on:
      - ai-orchestrator
    networks:
      - microservices

networks:
  microservices:
    driver: bridge
```

### Kubernetes Deployment

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ai-orchestrator
spec:
  selector:
    app: ai-orchestrator
  ports:
    - port: 3000
      targetPort: 3000
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-orchestrator
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-orchestrator
  template:
    metadata:
      labels:
        app: ai-orchestrator
    spec:
      containers:
      - name: ai-orchestrator
        image: ai-orchestration-hub:latest
        ports:
        - containerPort: 3000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-secrets
              key: openai-key
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-secrets
              key: anthropic-key
```

## Client Libraries

### TypeScript SDK

```typescript
// ai-orchestrator-client.ts
export interface CompletionRequest {
  prompt?: string;
  messages?: Array<{ role: string; content: string }>;
  maxTokens?: number;
  provider?: string;
  maxCost?: number;
}

export interface CompletionResponse {
  id: string;
  provider: string;
  model: string;
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  latency: number;
  cached: boolean;
}

export class AIOrchestrator {
  constructor(private baseUrl: string = 'http://localhost:3000') {}

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const response = await fetch(`${this.baseUrl}/v1/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getMetrics() {
    const response = await fetch(`${this.baseUrl}/v1/metrics`);
    return response.json();
  }

  async healthCheck() {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }
}

// Usage
const ai = new AIOrchestrator();
const result = await ai.complete({ prompt: 'Hello!', maxTokens: 100 });
```

## Best Practices

1. **Use Auto Provider Selection**: Let the hub choose the best provider
2. **Set Cost Limits**: Use `maxCost` to prevent expensive requests
3. **Cache Aggressively**: Enable caching for repeated requests
4. **Monitor Metrics**: Track costs and performance
5. **Handle Errors**: Implement proper error handling
6. **Use Environment Variables**: Keep API URLs configurable
7. **Implement Retries**: Add client-side retries for transient failures

## Performance Tips

1. **Batch Requests**: Process multiple items with cost limits
2. **Use Caching**: Enable Redis for production
3. **Optimize Tokens**: Request only what you need
4. **Monitor Budgets**: Set daily limits
5. **Choose Right Provider**: Use cost-optimized routing

## Security Considerations

1. **Never expose API keys**: Keep them server-side only
2. **Use HTTPS**: In production, always use HTTPS
3. **Rate Limiting**: Configure appropriate limits
4. **Authentication**: Add auth layer for production
5. **Input Validation**: Validate all user inputs
