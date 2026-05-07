# ADAM — Backend Implementation Plan
## APIs, Data, NLP & AI | After Frontend Is Complete

**Document version:** 1.0  
**Date:** March 2026  
**Status:** Planning  
**Purpose:** Implement all server-side logic, data, and services so the existing frontend can be wired to real APIs. Execute this plan **after** the frontend is built per `frontend-implementation-plan.md`.

**References:** `adam.md`, `adam_dictionary_spec.md`, `implementation-plan.md`

---

## 1. Executive Summary

This plan covers **everything behind the UI**: database schema, STE dictionary parsing and loading, authentication, document ingestion and storage, NLP microservice (spaCy), STE-1.1 rule engine, analysis pipeline, REST APIs (and optional WebSocket), AI assistant (Claude), reports generation, and background jobs. The frontend will be updated to call these APIs and replace mock data.

**Prerequisites:** Frontend implemented and runnable with mock data; team ready to run PostgreSQL (and optionally Redis).

---

## 2. Principles

- **API-first for frontend:** Every frontend screen has a corresponding set of endpoints; request/response shapes match what the frontend already expects from mocks.
- **Dictionary as source of truth:** STE-1.1 and Ask ADAM use the same dictionary data (JSON + form index, then DB for persistence and custom words).
- **Incremental integration:** Integrate one module at a time (e.g. dashboard API → violations API → upload + analyze) so the app keeps working.
- **Security and roles:** Auth and role checks on every protected route; no sensitive data in client without need.

---

## 3. Tech Stack (Confirmed)

| Layer | Choice | Notes |
|-------|--------|------|
| API | Next.js API Routes (or Fastify) | Same repo as frontend or separate service |
| Database | PostgreSQL + Prisma | Schema in `prisma/schema.prisma` |
| Cache / queue | Redis + BullMQ | Optional for v1; required for batch analysis |
| NLP | Python microservice (FastAPI + spaCy) | `nlp-service/` |
| AI | Anthropic Claude (claude-sonnet-4-6) | Ask ADAM and correction suggestions |
| File storage | Local disk or S3-compatible | Document files and exports |
| Auth | Next-Auth + JWT/session, Prisma adapter | Roles: Viewer, Writer, Reviewer, Admin, Super Admin |

---

## 4. Backend Implementation Steps (Ordered)

Execute in order. Dependencies between steps are explicit.

---

### Phase 1 — Database & Dictionary Foundation

#### Step 1.1 — Prisma schema (core entities)

- **Tasks:**
  - Add `User` (id, email, name, role, emailVerified, image; role enum: Viewer, Writer, Reviewer, Admin, SuperAdmin).
  - Add `Account`, `Session`, `VerificationToken` for Next-Auth Prisma adapter.
  - Add `Organization` (id, name, slug) and link `User` to Organization (optional for v1).
  - Add `Project` (id, name, organizationId, createdById, createdAt, updatedAt).
  - Add `Document` (id, projectId, name, filePath, mimeType, wordCount, sentenceCount, documentType enum, revision, author, uploadedAt, uploadedById).
  - Add `AnalysisRun` (id, documentId, createdAt, complianceScore, totalViolations, summary JSON).
  - Add `Violation` (id, analysisRunId, sentenceExcerpt, ruleId, ruleName, sentenceType, wordCount, severity, positionStart, positionEnd, aiSuggestion, paragraphContext, status enum: pending, accepted, rejected, createdAt).
  - Add dictionary tables per `adam_dictionary_spec.md` §2.3: `ste_words`, `ste_word_forms`, `ste_meanings`, `ste_examples`, `custom_words` (with orgId/projectId for scoping).
- **Deliverables:** `prisma/schema.prisma` updated; migration created and applied.
- **Acceptance criteria:** `prisma generate` and `prisma migrate deploy` succeed; tables exist in PostgreSQL.

#### Step 1.2 — Parse STE dictionary (XLSX → JSON + form index)

- **Tasks:**
  - Implement `nlp-service/scripts/parse_ste_dict.py`: read `ASD-STE_Word.xlsx` sheet `Word`, handle continuation rows (blank column B), output `ste_dictionary.json` (per spec §2.1) and `ste_forms_index.json` (form → headword).
  - Extract: headword, POS, approved flag, meanings (with approved_as_is, alternative), alternatives array, examples (ste_text, non_ste_text). For verbs with conjugations in column B, add all forms to form index.
- **Deliverables:** `parse_ste_dict.py`, `ste_dictionary.json`, `ste_forms_index.json` (under `nlp-service/data/` or project root).
- **Acceptance criteria:** Script runs; JSON structure matches spec; spot-checks for “abandon”, “about”, “absorb” correct.

#### Step 1.3 — Seed dictionary into PostgreSQL

- **Tasks:**
  - Node/TS script `scripts/seed-dictionary.ts`: read JSON, upsert into `ste_words`, `ste_word_forms`, `ste_meanings`, `ste_examples`. Idempotent (truncate + insert or upsert by word).
- **Deliverables:** `scripts/seed-dictionary.ts`, npm script `seed:dict`.
- **Acceptance criteria:** Seed completes; row counts ~2,199 words; lookups by word and form work via Prisma or raw SQL.

#### Step 1.4 — Dictionary API (lookup and search)

- **Tasks:**
  - `GET /api/dictionary/lookup?word=...` → { approved, alternatives, examples, meanings } from DB (or from in-memory JSON for speed).
  - `GET /api/dictionary/search?q=...&pos=...` → list of matching entries (paginated).
  - Optional: load JSON at server startup for fast lookup; merge with `custom_words` when project/org context provided.
- **Acceptance criteria:** Lookup and search return correct data; custom words considered when context given.

#### Step 1.5 — Auth (Next-Auth + roles)

- **Tasks:**
  - Configure Next-Auth with Prisma adapter; credentials or OAuth provider; JWT or database session.
  - Add `role` to User; middleware or helper to require role (e.g. requireWriter, requireReviewer, requireAdmin).
  - Protect API routes: e.g. upload and analyze require Writer; accept/reject require Reviewer; settings require Admin.
  - Session in frontend: useSession(), signIn(), signOut().
- **Acceptance criteria:** User can sign in; session and role available; protected API returns 401/403 when unauthorized.

---

### Phase 2 — Document Ingestion & Analysis Pipeline

#### Step 2.1 — File upload and storage

- **Tasks:**
  - `POST /api/documents/upload`: multipart (Next.js route or Fastify + multer); accept .docx, .doc, .pdf, .txt, .md, .xml, .sgml.
  - Save file to disk (e.g. `uploads/<org>/<project>/<uuid>.<ext>`) or S3; create `Document` record with filePath, mimeType, name; optional projectId, documentType, revision, author from form body.
  - Limit file size and batch count (e.g. max 20 files per request).
- **Acceptance criteria:** Upload returns document id and metadata; file stored; Document row created.

#### Step 2.2 — Text extraction

- **Tasks:**
  - Service: extract plain text from uploaded file (mammoth for .docx, pdf-parse for .pdf, fs read for .txt/.md; .xml/.sgml: strip tags or use parser). Compute word count and sentence count (simple split or NLP).
  - Update Document record with wordCount, sentenceCount; optionally documentType from heuristics.
  - Expose `GET /api/documents/[id]` with metadata and extracted text (or separate `GET /api/documents/[id]/text`).
- **Acceptance criteria:** Text extracted for .docx and .txt; metadata stored and returned.

#### Step 2.3 — NLP microservice (spaCy)

- **Tasks:**
  - FastAPI app in `nlp-service/`: `POST /analyze` body `{ "text": "..." }` or `{ "sentences": ["...", "..."] }`.
  - Run spaCy pipeline: tokenize, POS tag, NER, dependency parse, lemmatize. Return per sentence: tokens (text, lemma, pos), sentence type (instructional / descriptive / warning_caution) from heuristics (e.g. imperative verb, “WARNING”, “CAUTION”).
  - Dockerfile for NLP service; optional docker-compose with app + postgres + redis + nlp.
- **Acceptance criteria:** Given text, service returns tokens with lemma and POS; sentence type assigned; service callable from Node.

#### Step 2.4 — STE-1.1 rule engine

- **Tasks:**
  - Engine (Node or Python): for each token from NLP response, normalize and lemmatize; resolve form → headword via form index; lookup in dictionary. Apply logic from `adam_dictionary_spec.md` §3: unknown word → violation; not approved → violation + alternatives; approved but wrong POS → violation; conditionally approved (e.g. ABOUT) → contextual warning when meaning suggests alternative. Skip proper nouns (NER), numbers, custom words.
  - Input: list of sentences with tokens; output: list of violations (sentence index, token, ruleId STE-1.1, severity, suggestion, examples).
  - Optional: call NLP service from Node via HTTP; run engine in Node after receiving tokens.
- **Acceptance criteria:** “abandon” → violation with GO/STOP; approved word in wrong POS → violation; approved in correct POS → no violation.

#### Step 2.5 — Analysis run API and job

- **Tasks:**
  - `POST /api/documents/[id]/analyze`: load document text → call NLP service → run STE-1.1 engine → create AnalysisRun and Violation rows; compute compliance score (e.g. 100 - penalty per violation or formula per spec).
  - For large documents, optionally queue job (BullMQ); return job id and poll `GET /api/jobs/[id]` or use WebSocket for progress.
  - `GET /api/documents/[id]/analysis` or `GET /api/analysis-runs?documentId=...` → latest run with score and violation count.
- **Acceptance criteria:** Analyze endpoint returns run id and score; violations stored; frontend can trigger analysis and show results.

---

### Phase 3 — APIs for Dashboard, Violations, Rules

#### Step 3.1 — Dashboard and activity API

- **Tasks:**
  - `GET /api/dashboard/summary` (or per document: `GET /api/documents/[id]/dashboard`): compliance score, violation counts by severity, top 5 rules, rules found count, sentence type breakdown, violation distribution (for charts), document metadata, recent activity (last N analysis runs or events).
  - Use current user’s documents or current document/analysis run. Return shape matches frontend mock.
- **Acceptance criteria:** Frontend dashboard can replace mock with this API; charts and counts correct.

#### Step 3.2 — Violations API

- **Tasks:**
  - `GET /api/violations?documentId=...&analysisRunId=...&ruleId=...&sentenceType=...&severity=...&keyword=...&page=...&limit=...`: filterable, sortable, paginated list. Response: { violations[], total }.
  - `PATCH /api/violations/[id]`: status (accepted/rejected), optional note (annotation). Require Reviewer role.
  - `POST /api/violations/bulk-accept`: body { violationIds[] } or { ruleId }; accept all matching. Require Reviewer.
  - `GET /api/violations/export?documentId=...&format=csv|json`: export selected or all violations.
- **Acceptance criteria:** Frontend Violation Log uses these endpoints; filters, sort, accept/reject, bulk, export work.

#### Step 3.3 — Rule reference API

- **Tasks:**
  - Seed or import 60 STE rules (id, name, topic, description, specText, compliantExamples, nonCompliantExamples). Store in DB or static JSON.
  - `GET /api/rules`: list with optional search and topic filter; pagination.
  - `GET /api/rules/[id]`: full rule detail.
  - `POST /api/rules/[id]/favorite`, `DELETE /api/rules/[id]/favorite`: user favorites (table user_rule_favorites).
  - `POST /api/rules/[id]/test`: body `{ "sentence": "..." }` → run single-rule check (e.g. STE-1.1 only) and return compliant/violation.
- **Acceptance criteria:** Rule Library frontend uses these APIs; search, detail, favorites, sandbox work.

---

### Phase 4 — Ask ADAM (Claude)

#### Step 4.1 — Claude integration and system prompt

- **Tasks:**
  - Backend endpoint `POST /api/ask-adam/chat`: body { messages[], documentId? }; call Anthropic API with system prompt that includes: STE-100 rules summary, dictionary context (approved words, alternatives for common violations), instruction to cite STE-1.1 and use only approved words/POS. Include current document summary or violation list in context when documentId provided.
  - Stream response (SSE or WebSocket) for better UX; persist messages to DB (conversation per document/session).
  - Rate limit and auth (Writer or above).
- **Acceptance criteria:** Assistant responds with STE-aware rewrites and citations; context includes document when provided.

#### Step 4.2 — Chat history and document context

- **Tasks:**
  - Store conversation in DB (e.g. conversation, message tables); link to user and optional documentId.
  - `GET /api/ask-adam/conversations?documentId=...` → list of conversations; `GET /api/ask-adam/conversations/[id]` → messages.
  - Frontend passes documentId and optionally violation summary so ADAM can answer “which paragraph has most violations” etc.
- **Acceptance criteria:** History persisted and loadable; document-aware answers when document selected.

---

### Phase 5 — Reports, Projects, Analytics

#### Step 5.1 — Report generation

- **Tasks:**
  - **Executive summary:** 1-page PDF (e.g. Puppeteer or react-pdf) with score, top violations, recommended actions.
  - **Full compliance audit:** PDF/DOCX with all violations, context, corrections (template + data).
  - **Rule-by-rule breakdown:** Tabular (XLSX or PDF table).
  - **Corrected document:** Apply accepted suggestions to original text; export DOCX (e.g. docx lib).
  - **Delta report:** Compare two analysis runs (diff of violations/scores).
  - **Trend report:** Score over time (from AnalysisRun history).
  - Endpoints: `POST /api/reports/generate` body { reportType, documentId?, options }; return job id or file URL; `GET /api/reports/download/[id]`.
- **Acceptance criteria:** At least one report type (e.g. full audit PDF) and one export format (XLSX) work end-to-end.

#### Step 5.2 — Projects and documents API

- **Tasks:**
  - CRUD for projects: `GET /api/projects`, `POST /api/projects`, `PATCH /api/projects/[id]`, `GET /api/projects/[id]/documents`, `GET /api/projects/[id]/summary` (aggregate score, document count).
  - Assign document to project on upload or via `PATCH /api/documents/[id]` (projectId).
  - Versioning: same document name with different revision; list revisions; compare scores.
  - Activity log: table or query of “who ran analysis when” per project; `GET /api/projects/[id]/activity`.
- **Acceptance criteria:** Frontend Projects page uses these APIs; create project, assign documents, see score and activity.

#### Step 5.3 — Analytics API

- **Tasks:**
  - `GET /api/analytics/score-trend?documentId=...|projectId=...&from=...&to=...`: time series of compliance score.
  - `GET /api/analytics/rule-frequency?projectId=...`: counts per rule across documents.
  - `GET /api/analytics/word-frequency?documentId=...|projectId=...`: most flagged words (from violations).
  - Optional: heatmap calendar (analysis activity by day), sentence complexity histogram (from NLP or stored stats).
  - Return data shapes that match frontend charts.
- **Acceptance criteria:** Dashboard and Analytics frontend can use these; trend and rule-frequency charts correct.

#### Step 5.4 — Settings and custom words API

- **Tasks:**
  - User preferences: `GET /api/settings/preferences`, `PATCH /api/settings/preferences` (theme, notifications, defaultExportFormat). Store in User or user_preferences table.
  - Analysis config: `GET /api/projects/[id]/config`, `PATCH` (enabled rules, severity thresholds, sentence-type sensitivity). Store in project_config table.
  - Custom words: `GET /api/projects/[id]/custom-words`, `POST` (word, pos, note), `DELETE`. Used in STE-1.1 lookup merge.
  - CSV import for custom words.
- **Acceptance criteria:** Settings page persists prefs; project config and custom words affect analysis.

---

### Phase 6 — Jobs, Integrations, Hardening

#### Step 6.1 — Background jobs (BullMQ)

- **Tasks:**
  - Redis + BullMQ: queue “analyze document” for large files; worker calls NLP + STE engine, writes AnalysisRun and Violations.
  - Optional: queue “generate report”; worker builds PDF/DOCX and stores in storage, notifies when done.
  - `GET /api/jobs/[id]`: status (pending, processing, completed, failed).
- **Acceptance criteria:** Large document analysis can be queued; frontend can poll or use WebSocket for completion.

#### Step 6.2 — Integrations (placeholders or minimal)

- **Tasks:**
  - REST API key for CI/CD: create API key per org/user; middleware to validate key on selected routes (e.g. upload, analyze).
  - Webhook: on analysis complete, POST to configured URL (payload: documentId, score, violationCount). Config in settings.
  - SSO (SAML 2.0 / OAuth 2.0): configure Next-Auth provider; document in settings. Optional for v1.
  - S1000D / CCMS: document as future; no implementation in this plan.
- **Acceptance criteria:** API key auth works for at least one route; webhook fires when configured.

#### Step 6.3 — Error handling and validation

- **Tasks:**
  - Consistent error response shape: { error: string, code?: string }; 4xx/5xx status codes.
  - Validate all request bodies (Zod or similar); return 400 with validation details.
  - Log errors and optional monitoring (e.g. Sentry); never expose stack to client.
- **Acceptance criteria:** Invalid input returns 400; server errors return 500 and log; no stack in response.

---

## 5. API Contract Summary (for Frontend)

| Area | Methods | Purpose |
|------|---------|---------|
| Auth | Next-Auth endpoints | signIn, signOut, session |
| Dictionary | GET /api/dictionary/lookup, search | word lookup, search |
| Documents | POST /api/documents/upload, GET /api/documents/[id], GET /api/documents/[id]/text | upload, metadata, text |
| Analysis | POST /api/documents/[id]/analyze, GET /api/documents/[id]/analysis | run analysis, get result |
| Dashboard | GET /api/dashboard/summary (or /documents/[id]/dashboard) | score, charts, activity |
| Violations | GET /api/violations, PATCH /api/violations/[id], POST /api/violations/bulk-accept, GET /api/violations/export | list, update, bulk, export |
| Rules | GET /api/rules, GET /api/rules/[id], POST/DELETE favorite, POST /api/rules/[id]/test | list, detail, favorites, sandbox |
| Ask ADAM | POST /api/ask-adam/chat, GET /api/ask-adam/conversations | chat, history |
| Reports | POST /api/reports/generate, GET /api/reports/download/[id] | generate, download |
| Projects | CRUD /api/projects, GET /api/projects/[id]/documents, summary, activity | projects, documents, activity |
| Analytics | GET /api/analytics/score-trend, rule-frequency, word-frequency | charts data |
| Settings | GET/PATCH /api/settings/preferences, GET/PATCH /api/projects/[id]/config, custom-words | user and project config |
| Jobs | GET /api/jobs/[id] | async job status |

---

## 6. Success Criteria (Backend Complete)

- All APIs above implemented and documented (e.g. OpenAPI or README).
- Frontend can run with real auth, upload, analysis, violations, rules, Ask ADAM, reports, projects, analytics, and settings.
- STE-1.1 checking is accurate per dictionary spec; Ask ADAM uses dictionary context in system prompt.
- At least one report type and one export format (e.g. PDF + XLSX) work end-to-end.
- Database and NLP service run in Docker or locally; deployment path (docker-compose / K8s) documented.

---

## 7. Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | March 2026 | Initial backend implementation plan. |

---

*Execute after `frontend-implementation-plan.md` is complete. Use `implementation-plan.md` for the full product view.*
