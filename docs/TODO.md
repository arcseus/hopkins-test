## 0) Repo Init

**Branch:** `chore/init`

### Changes
- Initialize monorepo:
  - `pnpm` (or `npm`) workspace with a single package: `server/`
  - `server/` includes: `tsconfig.json`, ESLint, Prettier
- Dependencies:
  - `fastify`, `fastify-multipart`, `zod`, `openai`, `p-limit`, `adm-zip`, `pdf-parse` (fallback), `mammoth` (`.docx`), `exceljs`, `csv-parse`, `dotenv`, `node-stream-zip`
- Dev Dependencies:
  - `ts-node`, `tsx`, `vitest`, `supertest`, `@types/*`
- NPM Scripts: `dev`, `build`, `start`, `test`
- `README.md` covers environment variables and basic run instructions

### Acceptance
- Running `pnpm dev` boots a health check route.

---

## 1) Types & Shapes (Spec Contracts)

**Branch:** `feat/types`

### Changes
- `server/src/types.ts`:
  - `DocResult`, `AggregateCounts`, `Aggregate`, `AnalyseResponse`
- `server/src/validators.ts`:
  - Strict Zod schemas mirroring the spec (e.g., enum category, max 5 items, max 300 chars/item)
- `server/src/utils/aggregate.ts` (plus tests)
- `server/src/utils/markdown.ts` (stub; returns static for now)

### Acceptance
- Unit tests pass for validation and aggregate math.

---

## 2) `/api/analyse` Skeleton (Zip Upload, Routing)

**Branch:** `feat/analyse-skeleton`

### Changes
- `server/src/index.ts` Fastify app:
  - Routes: `POST /api/analyse`, `POST /api/export` (stub)
  - Fastify-multipart config (limit: 25MB)
  - Handler parses `multipart/form-data` with a single file
  - Returns 400 on:
    - size >25MB
    - non-zip uploads

### Acceptance
- E2E test: rejects bad content-type or size.

---

## 3) Unzip + File Filtering

**Branch:** `feat/zip-extract`

### Changes
- `server/src/extract/zip.ts` using `node-stream-zip`:
  - Protect against path traversal
  - Cap files to ≤50
  - Allow only `.pdf`, `.docx`, `.xlsx`, `.csv`, `.txt`
  - In-memory extraction to Buffers (no disk writes)
  - Returns: `{ filename, ext, buffer }[]`

### Acceptance
- E2E test: sample zip returns list of eligible files; ignores others.

---

## 4) Text Extraction Adapters

**Branch:** `feat/text-extractors`

### Changes
- `server/src/extract/pdf.ts`: Try `pdf-parse` (pure JS); if it fails, mark as `needsReview`
- `server/src/extract/docx.ts`: Use `mammoth` from Buffer
- `server/src/extract/xlsx.ts`: Use `exceljs` (first sheet, up to first 200 rows; join cells row-wise)
- `server/src/extract/csv.ts`: Use `csv-parse/sync` (up to 200 rows)
- `server/src/extract/txt.ts`: As-is
- `server/src/extract/index.ts`: Dispatcher; normalize whitespace; truncate output to 15,000 chars

### Acceptance
- Unit tests: each adapter returns string; xlsx/csv respect 200 row limit.

---

## 5) Heuristic Categorizer

**Branch:** `feat/categorizer`

### Changes
- `server/src/categorize.ts`:
  - Category derived from filename + first 300 chars using keyword maps:
    - financial, legal, commercial, operations; else `other`
  - Returns: `{ category, labelInputs }` (for prompting)

### Acceptance
- Unit tests: keywords map to expected categories.

---

## 6) LLM Per-Document Call (JSON, Retry Once)

**Branch:** `feat/llm-doc`

### Changes
- `server/src/llm/client.ts`: Wrapper around OpenAI (env: `OPENAI_API_KEY`, model name)
- `server/src/llm/prompts.ts`: System + user templates (exact spec text)
- `server/src/llm/docCall.ts`
  - `p-limit` pool: N = min(cpuCount, 6)
  - Call LLM; expect JSON response (`temperature 0`, `max_tokens ~700`)
  - Strict-parse into `DocResult` using Zod
  - On failure: retry once with guard prompt (“Your last output was invalid JSON…”)
  - On second fail: add filename to errors, return stub `{doc, category, facts: [], red_flags: []}`

### Acceptance
- Unit tests:
  - Mock LLM returns valid JSON → parses.
  - First invalid then valid → succeeds.
  - Both invalid → stub + errors records filename.

---

## 7) Wire `/api/analyse` End-to-End

**Branch:** `feat/analyse-end2end`

### Changes
- In handler:
  - Unzip → list
  - Per-file text extraction
  - Categorize
  - Dispatch LLM per-doc (with pool)
  - Aggregate counts by category
  - Store: `docs`, `aggregate`, `errors`
  - Return interim JSON (`summaryText` pending)

### Acceptance
- E2E test: sample zip of small `.txt` files → returns `docs[]`, `aggregate`, `errors: []`, `summaryText: ""`

---

## 8) Final Narrative Call

**Branch:** `feat/llm-summary`

### Changes
- `server/src/llm/summaryCall.ts`:
  - System + user prompt from spec (`temperature 0`, `max_tokens ~500`)
  - Input: JSON array of per-doc results
- Integrate into `/api/analyse`

### Acceptance
- E2E test: mocked LLM returns a 320-word text; response includes `summaryText`.

---

## 9) `/api/export` (Markdown Generation)

**Branch:** `feat/export-markdown`

### Changes
- `server/src/utils/markdown.ts`:
  - Title + date
  - 300–400 word summary (`summaryText`)
  - Aggregate table
  - Per-document sections (Category, Facts, Red Flags)
  - “Needs review” (from errors)
- `POST /api/export`:
  - Accepts body = full `/api/analyse` response or `{ docs, aggregate, summaryText, errors }`
  - Responds: `text/markdown` with `Content-Disposition: attachment; filename="vdr_summary.md"`

### Acceptance
- E2E test: returns downloadable `.md` with all required sections.

---

## 10) Timeouts, Limits, Logging

**Branch:** `chore/hardening`

### Changes
- Per-document LLM timeout: 30s
- Summary call timeout: 20s
- Overall route timeout: 180s
- Limit: only first 20 docs processed; short-circuit if >20
- Basic request logging; redact sensitive keys

### Acceptance
- Tests: simulate long LLM call → timeout respected (mocked LLM).

---

## 11) Minimal CI + Runbook

**Branch:** `chore/ci-readme`

### Changes
- GitHub Actions:
  - Node 20, `pnpm i`, `pnpm test`, `pnpm build`
- `README.md`:
  - Document environment variables
  - Provide curl examples for both endpoints
  - Note performance expectations and known tradeoffs

### Acceptance
- CI passes; curl examples work locally.
