# Contract Analysis — Upload & AI Review

A self-contained full-stack feature: upload a `.pdf` or `.docx` contract and get an
AI-generated review — contract type, a 0–100 risk score, missing standard clauses,
and plain-English recommendations.

Built for the Ruby Law senior full-stack exam. The full task spec is in
[EXAM.md](./EXAM.md).

---

## Features

- Upload `.pdf` / `.docx` (≤ 10 MB); text extracted server-side (`pdf-parse` / `mammoth`)
- AI classification + risk analysis via OpenAI — single call, structured JSON, **Zod-validated**
- Results UI: contract-type badge, colour-coded risk score (Low / Moderate / High),
  missing-clause list, recommendation list
- **Deep-linkable results** (`/contracts/:id`) — refresh and back/forward work
- **Content-based caching** (SHA-256 of the file): re-uploading the same file returns the
  stored analysis instantly, with no AI call
- Request logging, estimated OpenAI **cost tracking**, and graceful shutdown
- Strict TypeScript (no `any`), ESLint clean, service-layer unit tests with the AI mocked

## Tech stack

| Layer    | Choice |
|----------|--------|
| Backend  | Node 22, Express, TypeScript, OpenAI SDK, Zod, Multer |
| Frontend | React 19, Vite, TypeScript, React Router, SCSS modules |
| Tests    | Vitest |

## Project structure

```text
backend/src
├── index.ts                 # app wiring, middleware order, graceful shutdown
├── container.ts             # composition root — the only place deps are constructed
├── config.ts                # Zod-validated env config (loaded once, injected)
├── errors.ts                # HTTP-agnostic domain errors
├── controllers/             # thin HTTP adapters (happy-path only)
├── routes/                  # multer + route wiring (factories)
├── middlewares/             # errorHandler, requestLogger
├── services/                # contractService (orchestration), aiService, extractorService,
│                            #   contractStore, usageTracker, prompts
└── utils/asyncHandler.ts

frontend/src
├── App.tsx                  # router
├── api/contracts.ts         # fetch client (unwraps the response envelope)
├── hooks/                   # useContractUpload (mutation), useContract (query by id)
├── components/              # UploadForm, AnalysisResults, Spinner, ErrorMessage
├── pages/                   # UploadPage, ResultPage
└── styles/global.scss
```

---

## Quick start

**Prerequisites:** Node.js 22+ and an OpenAI API key.

```bash
# from the repo root
# 1. Backend  ->  http://localhost:3001
cd backend
npm install
cp ../.env.example .env        # then set OPENAI_API_KEY in backend/.env
npm run dev

# 2. Frontend (second terminal)  ->  http://localhost:5173
cd frontend
npm install
cp .env.example .env           # defaults are fine
npm run dev
```

Open **http://localhost:5173** and upload a contract.

> Contract text is parsed in-process by `pdf-parse` / `mammoth` — **no external tools
> required**. The `samples/` folder holds example contracts as `.txt`; since upload
> accepts only `.pdf` / `.docx`, save one as `.pdf`/`.docx` in any word processor, or use
> your own file.

If the OpenAI API is unavailable, the upload fails gracefully with a clear error — the
rest of the app keeps working.

### Run with Docker

Two independent images (backend API + nginx-served frontend), wired with Docker Compose.
`backend/.env` must exist with your `OPENAI_API_KEY` first (see above).

```bash
docker compose up --build
```

Open **http://localhost:8080**. The frontend's nginx serves the built React app and
reverse-proxies `/api` to the backend container, so everything is same-origin (no CORS)
behind a single entry point. Keeping backend and frontend as separate images means they
can be built, deployed, and scaled independently.

### Azure deployment notes

- **Backend** → build the image, push to Azure Container Registry (ACR), deploy to Azure
  Container Apps or App Service (for Containers). Provide `OPENAI_API_KEY` and the other
  vars as app settings / secrets.
- **Frontend** → the `vite build` output is static, so it can go to Azure Static Web Apps
  or Blob Storage + Azure CDN (no nginx needed there); or run the nginx image next to the
  backend.
- `VITE_API_BASE_URL` is a **build-time** variable (Vite inlines it into the bundle), so
  build the frontend with the backend's public URL when they live on different origins,
  and add that origin to the backend's `FRONTEND_URL` for CORS.

---

## Testing & quality

```bash
# Backend
cd backend
npm run lint         # ESLint — no errors
npx tsc --noEmit     # type-check (also runs as part of the build)
npm test             # Vitest — service-layer tests (AI mocked)

# Frontend
cd frontend
npm run lint
npm run build        # tsc + vite build
```

The backend tests cover the service layer with fakes injected through the constructor
(no module mocking): a successful analysis, content-cache behaviour (AI called once for
the same file), and error propagation when the AI is unavailable.

---

## API

Base path: `/api/contracts`

| Method & path        | Body            | Success | Errors |
|----------------------|-----------------|---------|--------|
| `POST /upload`       | multipart `file`| `201` new · `200` from cache | `400` bad/no file · `413` too large · `422` unreadable / invalid AI output · `500` |
| `GET /:id`           | —               | `200`   | `404` not found |

Response envelope:

```jsonc
// success
{ "data": { "id": "…", "filename": "…", "type": "NDA",
            "riskScore": 42, "missingClauses": ["…"], "recommendations": ["…"],
            "createdAt": "…" } }

// error
{ "error": { "code": "DOCUMENT_UNREADABLE", "message": "…" } }
```

---

## Architecture & design decisions

The backend is layered **route → controller → service → store**, wired with
lightweight **constructor dependency injection**. Config is loaded and validated once
(Zod), and all concrete implementations (the store, AI analyzer, and text extractor) are
created and injected in a single composition root (`container.ts`); nothing below it reads
`process.env` or imports its own dependencies, which keeps the service HTTP-agnostic and
trivial to test with fakes.

Errors follow one rule: **services throw HTTP-agnostic domain errors** (e.g.
`DocumentUnreadableError`, `AIUnavailableError`) and the **only** place that knows about
status codes is a single error-handling middleware that maps them (plus Multer errors) to
HTTP responses. Controllers therefore contain only the happy path — an `asyncHandler`
wrapper forwards any thrown/rejected error to that middleware.

Storage is in-memory with a twist: alongside the primary `id → record` map there is an
internal `sha256(file) → id` index. `id` is a UUID (public, and used in the frontend URL
for deep-links); the hash is never exposed. Re-uploading identical bytes returns the
cached analysis with no extraction and no AI call — cheaper, faster, deterministic.

The frontend mirrors this separation: a thin `fetch` client, two small hooks
(`useContractUpload`, `useContract`), presentational components, and two routed pages.
After a successful upload it navigates to `/contracts/:id`, and the result page fetches by
id — so refresh, deep-links, and back/forward all work through one data path.

## AI prompt strategy

A **single** Chat Completions call (`response_format: json_object`, `temperature: 0`)
classifies the contract and returns the full analysis at once. The default system prompt
lives in `services/prompts.ts` (committed and reviewable; overridable via the
`AI_SYSTEM_PROMPT` env var). The model's reply is parsed and validated with a **Zod**
schema — invalid or empty output becomes a `422`, provider/network failures a `500`.
Input text is capped (~60k chars) to bound token cost. The AI provider sits behind the
`AnalyzeFn` DI seam, so switching to Azure OpenAI is a new implementation plus one line in
`container.ts`.

---

## Environment variables

Backend (`backend/.env`, template at repo-root `.env.example`):

| Var | Default | Purpose |
|-----|---------|---------|
| `OPENAI_API_KEY` | — | required |
| `OPENAI_MODEL` | `gpt-4o-mini` | model name |
| `OPENAI_TEMPERATURE` | `0` | sampling temperature (0–2) |
| `OPENAI_MAX_INPUT_CHARS` | `60000` | cap on contract text sent to the model |
| `AI_SYSTEM_PROMPT` | *(empty)* | optional prompt override; empty = use the committed default |
| `PORT` | `3001` | backend port |
| `FRONTEND_URL` | `http://localhost:5173` | CORS origin |
| `MAX_UPLOAD_MB` | `10` | max upload size |

Frontend (`frontend/.env`, template at `frontend/.env.example`):

| Var | Default | Purpose |
|-----|---------|---------|
| `VITE_API_BASE_URL` | *(empty)* | empty → relative `/api` (Vite proxy in dev) |
| `VITE_MAX_UPLOAD_MB` | `10` | client-side pre-validation (backend still enforces) |

---

## Known limitations & possible next steps

- **In-memory** store and cache reset on restart (no database — per the spec).
- **Cost tracking is an estimate** from reported token usage × a static price table, not
  OpenAI's authoritative billing.
- **No auth.** Rate limiting is intentionally omitted: a correct quota belongs at the
  authenticated-account level, and a naive IP limit would false-positive for a whole law
  firm behind one office NAT.
- Production API base assumes same origin (configurable via `VITE_API_BASE_URL`).
- No frontend component tests (the spec requires service-layer tests only).
- Natural extensions: clause-level risk highlighting, SSE streaming of the analysis,
  Dockerfile + Azure deployment notes.
```
