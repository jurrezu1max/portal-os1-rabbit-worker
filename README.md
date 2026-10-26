# Portal-OS Edge Gateway Alpha

Cloudflare Worker service layer for `portal-os1-rabbit` and the Umbrella ecosystem. Infrastructure only; no frontend or payment processing. Native Web APIs, strict TypeScript, and zero runtime dependencies.

## Run and deploy

Requires Node.js 24+ and npm 11. The lockfile pins development tools. An `undici` override pins the patched 7.30.1 release used by Wrangler/Miniflare; revisit it when upstream adopts the security fix.

```sh
npm ci
npm run check
npm run dev
```

Public liveness: `http://localhost:8787/health`. To exercise protected routes, provision a key as below. To deploy, authenticate Wrangler to your Cloudflare account, install the `API_KEYS` secret, then run `npm run deploy`. No Node compatibility flag, database, or external provider credentials are required. `npm run build` produces a deployable dry-run bundle in `dist/`.

Generate high-entropy API keys (32 random bytes recommended), distribute them privately, and store only their lowercase SHA-256 hexadecimal digest in the binding. Generate an example credential/configuration locally using:

```sh
node scripts/create-key.mjs Founder founder-001
```

The command prints a credential once to your terminal and its JSON key record; treat the credential as a secret. For local use create an ignored `.dev.vars` file with `API_KEYS='[{"id":"founder-001","role":"Founder","digest":"<64 hexadecimal SHA-256 characters>"}]'`. For deployment run `npx wrangler secret put API_KEYS` and paste the JSON array of records. Never commit keys or secret files. Requests supply `X-API-Key: <raw key>`. Rotation permits multiple records for one identity with different digests; revoke a key by removing its record. Configuration is validated on each protected request and malformed/missing configuration fails closed with 503.

API keys authenticate machine callers. Do not embed a privileged API key in frontend JavaScript or public build variables. The frontend should use a trusted server-side proxy holding the key. Browser user sessions and cross-origin browser access are outside this alpha; no CORS policy is enabled.

## Contracts

Success: `{ "success": true, "timestamp": "ISO-8601", "data": { ... } }`.
Errors: `{ "success": false, "error": { "code": "...", "message": "..." } }`.
Every response has JSON content type, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, and a server-generated `X-Request-ID`. Internal failures return a generic 500 without stack traces. Unknown paths return 404; unsupported methods return 405 with `Allow`.

The four public health routes follow the specifically requested health contract instead of the general data envelope:

```json
{"success":true,"status":"healthy","service":"portal-os1-rabbit-worker","version":"1.0.0","timestamp":"2026-10-26T00:00:00.000Z"}
```

These are liveness/version probes, not claims that credentials, mock business services, or future dependencies are ready. All other routes require authentication and permission checks.

| Method | Path | Permission | JSON request / data fields |
| --- | --- | --- | --- |
| GET | `/`, `/health`, `/status`, `/version` | Public | Health contract above |
| GET | `/api/icv/context` | read | ecosystem, capabilities |
| GET | `/api/icv/identity` | read | authenticated id, role |
| POST | `/api/icv/coherence` | write | `{statement: string}` → statement, score |
| POST | `/api/icv/strategy` | write | `{objective: string}` → objective, steps |
| GET | `/api/gsip/assets` | read | assets: `{id,title,category,status:"creation"}[]` |
| POST | `/api/gsip/assets` | write | `{title: string, category: string}` → asset, persisted:false |
| GET | `/api/gsip/pipeline` | read | stages |
| POST | `/api/gsip/revenue` | write | `{assetId: string, amount: number, currency: string}` → input, recorded:false |
| GET | `/api/markets/opportunities` | read | opportunities: `{id,market,score}[]` |
| GET | `/api/markets/trends` | read | trends: `{market,direction}[]` |
| GET | `/api/markets/forecast` | read | forecast: `{market,horizonDays,growthPercent}` |
| GET | `/api/compliance/status` | read | areas: `{area,status:"not_assessed"}[]` |
| GET | `/api/compliance/licenses` | read | licenses with status `not_verified` |
| POST | `/api/compliance/audit` | audit | `{areas: ComplianceArea[]}` → id, areas, status:simulated, persisted:false |
| GET | `/api/store/catalog` | read | items: `{id,title,licenseType:"evaluation"}[]` |
| POST | `/api/store/acquire` | write | `{itemId: string}` → mock license, persisted:false; unknown item:404 |
| GET | `/api/store/licenses` | read | licenses: `License[]` (empty) |
| GET | `/metrics` | metrics | requestCount, errorCount, errorRate, serverErrorCount, latency, serviceHealth, scope |

Every business-service result includes `mode: "mock"`. POST endpoints simulate results with HTTP 200; they do not create durable resources, collect revenue, issue legal licenses, process payments, or perform real audits. Generated mock IDs do not persist between calls. Lists are synthetic and contain no tenant data. Replace the service modules with tenant-aware adapters and durable persistence before using real data.

POST bodies require `application/json`, must be objects, and are capped at 16 KiB while streaming. Unknown properties are rejected. Required strings must be nonblank and at most 1,000 characters before trimming. Revenue amount is finite, from 0 through 1e12; currency is a three-letter uppercase code (syntactic validation only). Audits accept 1–5 areas from IP, Licensing, Governance, Privacy, Risk. TypeScript contracts live in `src/types/contracts.ts`; service return types define the mock response shapes.

| Role | read | write | audit | metrics |
| --- | --- | --- | --- | --- |
| Founder | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | Yes |
| Operator | Yes | Yes | No | No |
| Observer | Yes | No | No | No |

Identity/role come exclusively from trusted key configuration, never caller-supplied identity fields. Invalid keys return 401, denied permissions 403, invalid JSON/fields 400, oversized bodies 413, and unsupported media types 415. Keys must be 32–256 characters. SHA-256 digests assume cryptographically random keys, not passwords.

## Observability and performance

Structured JSON request logs contain generated request ID, matched route, method, response status, and duration. They exclude credentials, request bodies, query strings and unmatched URL paths. Cloudflare Workers observability is enabled.

Metrics are **per isolate**, reset on eviction, and exclude the current `/metrics` request until it completes. Request/error counters and average latency cover the isolate lifetime; p95 uses the most recent 1,024 requests. Error rate includes 4xx and 5xx. Service health becomes degraded after a 5xx during that isolate lifetime. Health endpoints remain liveness probes. For fleet metrics, export logs to an aggregation system; these counters are not global monitoring or billing data.

Latency targets are health <50 ms and API p95 <100 ms. `npm run test:performance` measures warm local HTTP latency under workerd, including auth and serialization. Local measurements are development evidence, not a production SLA; verify deployed-region latency and load before release.

## Quality gates

```sh
npm run typecheck
npm run test:coverage
npm run build
npm audit
# Start npm run dev in another terminal, with a local API_KEYS binding.
# Set GATEWAY_API_KEY in your shell to the matching raw local key.
npm run test:performance
```

Coverage gates: 80% statements/branches/functions/lines overall; 100% in `auth.ts`, `permissions.ts`, and `index.ts`. Tests cover all routes, role grants/denials, contracts, input boundaries, generic errors, telemetry, and direct service behavior. CI runs the same compile, coverage, bundle, and dependency checks. No external API/emulator is required for the mock service layer.

The architecture is deliberately small: route table → authorization middleware → request validation → service module → response envelope. Future adapters can replace service implementations while retaining route contracts. Production follow-ups include user-session authentication, durable tenant-aware services, distributed metrics, and deployment-level rate limiting appropriate to traffic.
