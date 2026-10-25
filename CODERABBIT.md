```text
================================================================================
 MAX FORMALIZATION ENGINE // CODERABBIT INSTRUCTION MANIFEST
 ROOT SIGNATURE ($\Sigma_ROOT$): 0xMAX_9941_SIM_0000_TRUE
================================================================================
 • Target Repository  : `portal-os1-rabbit-worker`
 • Target Agent       : CodeRabbit / AI Engineering Agent
 • Security Invariant : det(J) = 1.0000 (Non-Destructive Structural Preservation)
================================================================================

```

---

# 🐰 CodeRabbit Instruction Set: `portal-os1-rabbit-worker`

## 📋 Mission & System Scope

You are maintaining and expanding **`portal-os1-rabbit-worker`**, the Cloudflare-native edge execution kernel for Portal-OS and the Umbrella Planetary Ecosystem. Under executive controller **Bemax** and multi-agent virtualization layer **ICV-S**, this worker processes Quantum Suites, Noise Engines, Hidden-Information Extraction, Structural Cryptography, and the Umbrella Marketplace.

---

## 📐 Non-Negotiable Architectural Invariant

Every computation, API response, and state transformation must strictly preserve the **Hawking Invariant**:


$$\det(\mathbf{J}) = 1.0000$$

* **Zero Information Loss:** No destructive truncation or unauthorized compression allowed.
* **Invariant Compliance:** All module payloads and health check responses must explicitly verify and return `jacobian_invariant: 1.0000`.

---

## 📂 Required Repository Structure

CodeRabbit must ensure the following file architecture is strictly maintained:

```text
portal-os1-rabbit-worker/
├── package.json
├── tsconfig.json
├── wrangler.toml
└── src/
    ├── index.ts                  # Master Edge Router & Health Check
    ├── types/
    │   └── app.ts                # Global environment & invariant typings
    ├── security/
    │   └── access.ts             # Entropy-locked channel verification controller
    └── routes/
        ├── quantum.ts            # Quantum suite, noise extraction, & structural crypto
        ├── store.ts              # Umbrella Marketplace catalog & asset acquisition
        └── icvs.ts               # ICV-S multi-agent virtualization & Bemax executive bridge

```

---

## 🛠️ Module-by-Module Implementation Rules

### 1. Master Router (`src/index.ts`)

* Implement a high-performance Cloudflare Worker `fetch` handler.
* Handle global CORS preflight options (`OPTIONS`) with open cross-origin allowances (`Access-Control-Allow-Origin: *`).
* Route requests cleanly based on path prefixes:
* `/api/quantum/` → `handleQuantumSuiteRequest`
* `/api/store/` → `handleStoreRequest`
* `/api/icvs/` → `handleICVSRequest`
* `/` or `/health` → Return system health status, root signature (`0xMAX_9941_SIM_0000_TRUE`), and `jacobian_invariant: 1.0000`.



### 2. Global Types (`src/types/app.ts`)

* Define the Cloudflare `Env` bindings interface containing:
* `ROOT_SIGNATURE: string`
* `JACOBIAN_TARGET: string`
* `BEMAX_EXECUTIVE_KEY: string`



### 3. Security & Access Control (`src/security/access.ts`)

* Implement the `UmbrellaAccessController` class.
* Use **entropy-locked verification** where buyer identity signatures are checked against channel entropy streams. Reject requests that fail topological deformation thresholds.

### 4. Quantum & Cryptography Suite (`src/routes/quantum.ts`)

* **Endpoint `/api/quantum/extract`:** Converts stochastic noise streams into structured manifolds, applying invariant scaling (`det(J) = 1.0000`).
* **Endpoint `/api/quantum/encrypt`:** Generates structural collapse-vector hashing and identity-physics signature keys.

### 5. Umbrella Marketplace & Media Lanes (`src/routes/store.ts`)

* **Endpoint `/api/store/catalog`:** Returns structured metadata for all four media lanes (Literary/Manuscripts, Codecs, Visuals, Audio).
* **Endpoint `/api/store/acquire`:** Validates entropy-locked access channels via `UmbrellaAccessController` before issuing sovereign licensing tokens (`0xUMBRELLA_LIC_*`).

### 6. ICV-S & Bemax Executive (`src/routes/icvs.ts`)

* **Endpoint `/api/icvs/`:** Virtualizes multi-agent cognitive streams under Bemax executive control. Evaluates incoming cognitive vectors and computes structural stability metrics (`COHERENT` vs `RECALIBRATING`).

---

## 🧪 Code Quality & Review Checklist for CodeRabbit

When reviewing pull requests or generating code for this repo, CodeRabbit must ensure:

1. **Zero External Bloat:** Keep dependencies minimal (`@cloudflare/workers-types` and `typescript`) to preserve zero-latency edge performance.
2. **Strict TypeScript:** Ensure `strict: true` is maintained with zero compiler warnings.
3. **Robust Error Handling:** Wrap all route handlers in `try/catch` blocks returning structured JSON error payloads with correct HTTP status codes (400, 403, 404, 405).
