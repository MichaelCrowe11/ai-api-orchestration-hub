# ai-api-orchestration-hub

Fastify server in TypeScript that routes chat completion requests across the OpenAI, Anthropic, Google and Cohere SDKs with failover, cost tracking and optional Redis caching; it installs and starts, but the typecheck fails and two of three test suites do not load.

## Status

experimental

One commit, dated 2025-11-11, on a branch named `claude/use-case-integration-011CV18s5qqf4g5f3AwYkr3B`, which is also the default branch. There is no `main` branch, no lockfile, no CI and no LICENSE file. On 2026-09-10 the code installed, built and served its health route, so it is kept as experimental rather than archived.

What does not work:

- `npm run typecheck` exits 2 with 18 errors: 10 `TS2769` overload mismatches (pino logger calls in `src/index.ts`, `src/cache/index.ts`, `src/orchestration/orchestrator.ts`, `src/api/server.ts`, and the Anthropic client call in `src/providers/anthropic.ts`), 1 `TS2345` Fastify instance type mismatch in `src/api/server.ts`, and 7 `TS6133` unused parameters. `tsconfig.json` sets `noUnusedLocals` and `noUnusedParameters` but not `noEmitOnError`, so `npm run build` exits 2 and still writes `dist/`.
- `npm test`: `src/cache/__tests__/cache.test.ts` and `src/orchestration/__tests__/orchestrator.test.ts` fail to compile under ts-jest for the same unused-variable errors. Only `src/monitoring/__tests__/metrics.test.ts` runs (6 tests, all pass).
- No `package-lock.json`. Every `npm install` resolves fresh. `Dockerfile` runs `npm ci`, which needs a lockfile, so the Docker build fails as written.
- Dependabot PR #1 (2026-02-03) proposes `fastify` 4.29.1 to 5.7.4, a major bump that nothing here has been tested against.

## Install and first run

Run on 2026-09-10 with Node 26.5.0 and npm 11.17.0:

    npm install
    added 547 packages in 29s

    npm run typecheck
    (18 errors, exit 2; see Status)

    npm run build
    (exit 2; dist/ written anyway)

    npm test
    Test Suites: 2 failed, 1 passed, 3 total
    Tests:       6 passed, 6 total

    PORT=3971 HOST=127.0.0.1 REDIS_ENABLED=false CACHE_ENABLED=false node dist/index.js
    INFO: Cache is disabled
    INFO: Orchestrator initialized
    INFO: Server listening at http://127.0.0.1:3971

    curl http://127.0.0.1:3971/health
    {"status":"unhealthy","providers":{},"timestamp":"2026-09-11T06:57:40.677Z"}

`unhealthy` is the expected answer with no provider keys set; `GET /v1/providers` returned `{"providers":[]}`.

Not run: `docker build` and `docker-compose up` (the Dockerfile's `npm ci` has no lockfile to read; compose also starts Redis), `POST /v1/completions` (it calls a paid vendor and no key was set), `npm run lint`.

## What runs today

- `npm install` from `package.json` (no lockfile; today it resolved `fastify@4.29.1`).
- `node dist/index.js` after `npm run build`: `GET /health`, `GET /v1/providers`, `GET /v1/metrics`, `GET /` answer locally with no keys. `POST /v1/completions` exists in `src/api/routes.ts` and was not exercised.
- `src/monitoring/__tests__/metrics.test.ts`: 6 passing tests for the metrics collector.
- Provider adapters for `openai`, `anthropic`, `google` and `cohere` in `src/providers/`, enabled one by one when the matching `*_API_KEY` is set (`src/config/index.ts`). A load balancer in `src/orchestration/load-balancer.ts` and failover retries in `src/orchestration/orchestrator.ts` exist in code and were not exercised.
- Two guides in `docs/` (`API_EXAMPLES.md`, `INTEGRATION_GUIDE.md`) and a `.env.example` listing every variable the config reads.

## Roadmap

- Commit a `package-lock.json` so `npm ci` and the Dockerfile work.
- Fix the 18 type errors, then make the two skipped test suites compile.
- Decide on the fastify 5 bump in PR #1 and run the tests against it.
- Add a LICENSE file that matches the `MIT` field in `package.json`.

## Limits

- Not a product. It is a one-commit scaffold that has never been merged, released or run against a live provider from this repository.
- The per-token prices in `src/config/index.ts` (`costPer1kPromptTokens`, `costPer1kCompletionTokens`) are constants typed in 2025. They are not fetched from vendors. Do not use the cost tracker for billing or budgets.
- Where a key is set, prompts and completions go to that vendor. No data handling promise is made. `@fastify/helmet` and `@fastify/rate-limit` are wired in; no security review has been done.
- `.env.example`, `README.md` and `docs/` contain placeholder keys of the form `sk-your-openai-key-here`. They are not credentials.
- The Redis cache path (`src/cache/index.ts`) was not run; `REDIS_ENABLED=false` was used today.

## License and contact

No license file. `package.json` says `MIT`; no `LICENSE` file backs it.

Contact: michael@crowelogic.com
