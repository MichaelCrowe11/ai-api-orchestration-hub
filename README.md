# AI API Orchestration Hub

A production-ready, centralized platform for orchestrating and managing multiple AI API services with intelligent load balancing, failover, cost optimization, and caching.

## Features

- **Multi-Provider Support**: Seamlessly work with OpenAI, Anthropic (Claude), Google (Gemini), and Cohere APIs
- **Intelligent Load Balancing**: Distribute requests across providers based on cost, performance, or availability
- **Automatic Failover**: Built-in retry logic with automatic provider switching on failures
- **Cost Management**: Track spending, set budgets, and optimize routing for cost efficiency
- **Redis Caching**: Reduce costs and latency by caching similar requests
- **Rate Limiting**: Protect your APIs with configurable rate limits
- **Real-time Metrics**: Monitor performance, costs, and health across all providers
- **TypeScript**: Fully typed for better developer experience
- **Docker Support**: Easy deployment with Docker and docker-compose

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose (optional)
- Redis (optional, but recommended)
- API keys for at least one provider

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-api-orchestration-hub

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and add your API keys
nano .env
```

### Configuration

Edit `.env` file with your API keys:

```env
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GOOGLE_API_KEY=your-google-key
COHERE_API_KEY=your-cohere-key
```

### Running Locally

```bash
# Development mode with hot reload
npm run dev

# Build and run production
npm run build
npm start
```

### Running with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The API will be available at `http://localhost:3000`

## API Usage

### Health Check

```bash
curl http://localhost:3000/health
```

### Create Completion

```bash
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is the capital of France?",
    "maxTokens": 100,
    "provider": "auto"
  }'
```

### Using Messages Format

```bash
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "What is the capital of France?"}
    ],
    "maxTokens": 100
  }'
```

### Cost-Optimized Request

```bash
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in simple terms",
    "maxCost": 0.01,
    "maxTokens": 500
  }'
```

### Get Metrics

```bash
curl http://localhost:3000/v1/metrics
```

### List Providers

```bash
curl http://localhost:3000/v1/providers
```

## API Reference

### POST /v1/completions

Create a completion request.

**Request Body:**

```typescript
{
  prompt?: string;              // Text prompt (alternative to messages)
  messages?: Array<{            // Chat messages (alternative to prompt)
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;               // Specific model or 'auto' (default: 'auto')
  provider?: string;            // 'openai' | 'anthropic' | 'google' | 'cohere' | 'auto'
  maxTokens?: number;           // Maximum tokens to generate
  temperature?: number;         // 0-2, controls randomness
  topP?: number;                // 0-1, nucleus sampling
  maxCost?: number;             // Maximum cost in dollars
  metadata?: Record<string, unknown>; // Custom metadata
}
```

**Response:**

```typescript
{
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
  timestamp: string;
}
```

### GET /health

Health check endpoint. Returns status of all providers.

### GET /v1/metrics

Returns comprehensive metrics including:
- Total requests and success/failure counts
- Total cost and average latency
- Cache hit rate
- Per-provider statistics

### GET /v1/providers

Returns list of enabled providers and their health status.

## Integration Examples

### Node.js/TypeScript

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' }
});

async function getChatCompletion(prompt: string) {
  const response = await client.post('/v1/completions', {
    prompt,
    maxTokens: 1000,
    provider: 'auto' // Let the hub choose the best provider
  });

  return response.data;
}

// Usage
const result = await getChatCompletion('Explain AI in simple terms');
console.log(result.content);
console.log(`Cost: $${result.cost.toFixed(4)}`);
```

### Python

```python
import requests

def get_completion(prompt, max_tokens=1000):
    response = requests.post(
        'http://localhost:3000/v1/completions',
        json={
            'prompt': prompt,
            'maxTokens': max_tokens,
            'provider': 'auto'
        }
    )
    return response.json()

# Usage
result = get_completion('Explain AI in simple terms')
print(result['content'])
print(f"Cost: ${result['cost']:.4f}")
```

### cURL

```bash
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain AI",
    "maxTokens": 500
  }'
```

## Configuration Options

All configuration is done through environment variables:

### Server Configuration
- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: 0.0.0.0)
- `NODE_ENV` - Environment (development/production)

### Provider API Keys
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `GOOGLE_API_KEY` - Google API key
- `COHERE_API_KEY` - Cohere API key

### Redis Configuration
- `REDIS_HOST` - Redis host (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)
- `REDIS_PASSWORD` - Redis password
- `REDIS_ENABLED` - Enable Redis caching (default: true)

### Cache Settings
- `CACHE_TTL` - Cache time-to-live in seconds (default: 3600)
- `CACHE_ENABLED` - Enable caching (default: true)

### Rate Limiting
- `RATE_LIMIT_MAX` - Max requests per time window (default: 100)
- `RATE_LIMIT_TIME_WINDOW` - Time window in ms (default: 60000)

### Cost Management
- `ENABLE_COST_TRACKING` - Track costs (default: true)
- `MAX_COST_PER_REQUEST` - Max cost per request in dollars (default: 1.00)
- `DAILY_BUDGET_LIMIT` - Daily budget limit in dollars (default: 100.00)

### Load Balancing
- `ENABLE_LOAD_BALANCING` - Enable load balancing (default: true)
- `ENABLE_FAILOVER` - Enable automatic failover (default: true)
- `FAILOVER_RETRY_ATTEMPTS` - Number of retry attempts (default: 3)
- `FAILOVER_RETRY_DELAY` - Delay between retries in ms (default: 1000)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Fastify API Server                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Rate Limiter │  │     CORS     │  │   Helmet     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Orchestration Engine                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Cache     │  │Load Balancer │  │   Metrics    │      │
│  │   Manager    │  │              │  │  Collector   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┬─────────────┐
           ▼               ▼               ▼             ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐  ┌──────────┐
    │  OpenAI  │    │ Anthropic│    │  Google  │  │  Cohere  │
    │ Provider │    │ Provider │    │ Provider │  │ Provider │
    └──────────┘    └──────────┘    └──────────┘  └──────────┘
```

## Load Balancing Strategies

The orchestrator uses intelligent algorithms to select the best provider:

1. **Cost-Optimized**: Selects the cheapest provider that meets requirements
2. **Performance-Based**: Selects provider with lowest latency
3. **Round-Robin**: Distributes requests evenly across providers
4. **Auto**: Automatically selects based on current metrics and health

## Failover Mechanism

When a provider fails:
1. Request is automatically retried with a different provider
2. Up to 3 retry attempts by default
3. Exponential backoff between retries
4. Metrics track failure rates for intelligent routing

## Monitoring

The hub provides comprehensive metrics:

- Request counts (total, successful, failed)
- Cost tracking (per-request and total)
- Latency measurements
- Cache hit rates
- Provider-specific statistics
- Health status for each provider

Access metrics at `/v1/metrics`

## Development

### Project Structure

```
ai-api-orchestration-hub/
├── src/
│   ├── api/              # API server and routes
│   ├── cache/            # Caching layer
│   ├── config/           # Configuration
│   ├── monitoring/       # Logging and metrics
│   ├── orchestration/    # Core orchestration logic
│   ├── providers/        # Provider implementations
│   ├── types/            # TypeScript types
│   └── index.ts          # Entry point
├── Dockerfile
├── docker-compose.yml
└── package.json
```

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Type Checking

```bash
npm run typecheck
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

## License

MIT

## Support

For issues, questions, or contributions, please open an issue on GitHub.
