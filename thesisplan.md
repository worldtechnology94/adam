# ADAM — Thesis-Focused Implementation Plan
## From Prototype to Defensible Demo in Logical Steps

**Document version:** 1.0  
**Date:** March 2026  
**Purpose:** A realistic, thesis-oriented roadmap that prioritizes **core contribution** (STE dictionary + rules + analysis logic) and defers or simplifies everything else. No authentication required until the main logic is proven.

**References:** `adam.md`, `adam_dictionary_spec.md`, `backend-implementation-plan.md`, `frontend-implementation-plan.md`

---

## 1. Thesis Positioning

### What This Thesis Demonstrates

- **Primary contribution:** An automated pipeline that checks technical text against the ASD-STE100 approved word list (STE-1.1) and the STE dictionary, producing **actionable violations** with alternatives and examples.
- **Secondary contribution:** A usable web interface (ADAM) where a user can upload a document, run analysis, and review violations with rule references and suggested corrections—demonstrating end-to-end applicability.
- **Optional extension:** Integration of an AI assistant (Ask ADAM) that uses the same dictionary to suggest STE-compliant rewrites, showing how the dictionary can drive both rule-checking and generative help.

### What This Thesis Does *Not* Claim

- A full 60-rule STE checker (focus is STE-1.1 + dictionary as the foundation; other rules can be stubbed or simplified).
- Multi-user enterprise features (auth, roles, organizations).
- Production-grade NLP (sentence segmentation and tokenization can be simple/heuristic for thesis scope).
- Exhaustive evaluation against a gold corpus (a small manual evaluation is enough to argue correctness).

---

## 2. Scope: Must-Have vs Nice-to-Have vs Out of Scope

| Category | In Scope (Thesis) | Nice-to-Have (If Time) | Out of Scope |
|----------|-------------------|-------------------------|---------------|
| **Dictionary** | Parse XLSX → JSON + form index; seed DB; lookup/search API; used by engine | Custom words per project | Multi-tenant dictionary variants |
| **STE-1.1 engine** | Tokenize text → lookup each token → flag unapproved/wrong-POS → suggest alternatives | Conditionally approved words (e.g. ABOUT) with context | Full NER to skip proper nouns (can treat all as checkable) |
| **Document pipeline** | Upload .txt/.docx → extract text → run engine → store violations | .pdf, .md; sentence-type heuristics | Full spaCy pipeline; batch queue |
| **Frontend wiring** | Dashboard, Violations, Rules, Upload use real APIs; mock auth OK | Ask ADAM with Claude + dictionary | Real login; roles; SSO |
| **Rules** | 10–15 rules in DB/JSON; list, detail, search, “Test this rule” (STE-1.1 only) | Full 60 rules seeded | Rule versioning |
| **Reports** | Export violations as CSV/JSON | One PDF report type | Full report suite |
| **Evaluation** | Manual spot-checks + small test set (10–20 sentences) | Precision/recall on larger set | Benchmark dataset |

---

## 3. Phased Implementation (Thesis Order)

Execute in order. Each phase ends with something **demonstrable**.

---

### Phase T1 — Dictionary Foundation (Weeks 1–2)

**Goal:** The STE dictionary is parseable, storable, and queryable. This is the **heart of the thesis**.

#### T1.1 — Prisma schema (dictionary + analysis only)

- **Tasks:**
  - Add **dictionary tables** per `adam_dictionary_spec.md` §2.3: `ste_words`, `ste_word_forms`, `ste_meanings`, `ste_examples`. Optionally `custom_words` (nullable org/project for later).
  - Add **analysis entities** (no user): `Document` (id, name, filePath, mimeType, wordCount, sentenceCount, documentType, revision, author, uploadedAt), `AnalysisRun` (id, documentId, createdAt, complianceScore, totalViolations, summary JSON), `Violation` (id, analysisRunId, sentenceExcerpt, ruleId, ruleName, sentenceType, wordCount, severity, positionStart, positionEnd, aiSuggestion, paragraphContext, status).
  - **Do not add:** User, Account, Session, VerificationToken, Organization.
- **Deliverables:** `prisma/schema.prisma` updated; migration created and applied.
- **Acceptance:** `prisma generate` and `prisma migrate deploy` (or `db push`) succeed; tables exist.

#### T1.2 — Parse STE dictionary (XLSX → JSON + form index)

- **Tasks:**
  - Implement `nlp-service/scripts/parse_ste_dict.py`: read `ASD-STE_Word.xlsx` sheet `Word`, handle continuation rows (blank column B), output `ste_dictionary.json` (per spec §2.1) and `ste_forms_index.json` (form → headword).
  - Extract headword, POS, approved flag, meanings, alternatives, examples (STE / non-STE). For verbs with conjugations in column B, add all forms to form index.
- **Deliverables:** `parse_ste_dict.py`, `ste_dictionary.json`, `ste_forms_index.json` (e.g. under `nlp-service/data/` or project root).
- **Acceptance:** Script runs; JSON structure matches spec; spot-checks for “abandon”, “about”, “absorb” correct.

#### T1.3 — Seed dictionary into PostgreSQL

- **Tasks:**
  - Node/TS script `scripts/seed-dictionary.ts`: read JSON, upsert into `ste_words`, `ste_word_forms`, `ste_meanings`, `ste_examples`. Idempotent (truncate+insert or upsert by word).
- **Deliverables:** `scripts/seed-dictionary.ts`, npm script `seed:dict`.
- **Acceptance:** Seed completes; ~2,199 words; lookups by word and form work via Prisma.

#### T1.4 — Dictionary API

- **Tasks:**
  - `GET /api/dictionary/lookup?word=...` → { approved, alternatives, examples, meanings } from DB (or in-memory JSON for speed).
  - `GET /api/dictionary/search?q=...&pos=...` → list of matching entries (paginated).
- **Acceptance:** Lookup and search return correct data; frontend or Postman can call them.

**Phase T1 demo:** “We can load the official STE dictionary, store it in the database, and query it by word or form. Here is the lookup for ‘utilize’ returning ‘use’ as the approved alternative.”

---

### Phase T2 — STE-1.1 Rule Engine (Weeks 2–3)

**Goal:** Given plain text, the system produces a list of STE-1.1 violations with suggestions.

#### T2.1 — Text normalization and tokenization (simple)

- **Tasks:**
  - Service or in-app module: split text into sentences (period, newline, optional exclamation/question).
  - Tokenize each sentence (split on whitespace + punctuation, keep tokens lowercase for lookup). No need for full NLP yet.
  - Optional: simple POS heuristic (e.g. word ending in -ed → verb) to narrow suggestions; can be “unknown” initially.
- **Deliverables:** `app/lib/analysis/tokenize.ts` (or equivalent) with `getSentences(text)` and `getTokens(sentence)`.
- **Acceptance:** “The technician utilized the tool.” → 2 sentences or 1; tokens include “technician”, “utilized”, “the”, “tool”.

#### T2.2 — STE-1.1 engine (dictionary-driven)

- **Tasks:**
  - For each token: normalize (lowercase), resolve form → headword via `ste_forms_index` (or DB). Lookup in dictionary.
  - Logic per `adam_dictionary_spec.md` §3: unknown word → violation (suggest “check spelling” or leave blank); not approved → violation + alternatives from dictionary; approved but wrong POS → violation (simplified: if we have no POS from tokenizer, skip this for thesis or use heuristic).
  - Output: list of violations (sentence index, token, ruleId STE-1.1, severity, suggestion, examples if available).
- **Deliverables:** `app/lib/analysis/ste11-engine.ts` (or Node service); unit tests with 5–10 hand-picked sentences.
- **Acceptance:** “utilize” → violation, suggestion “use”; “use” in procedural sentence → no violation (or violation if POS wrong, depending on simplification).

#### T2.3 — Engine API (stateless)

- **Tasks:**
  - `POST /api/analysis/check` body `{ "text": "..." }` → { violations[], complianceScore } (score = formula e.g. 100 − penalty per violation, capped).
- **Acceptance:** Postman/curl sends a paragraph; response contains violations and score.

**Phase T2 demo:** “We implemented the STE-1.1 rule engine. Here is a sentence with ‘utilize’ and ‘prior to’ — the engine flags both and suggests ‘use’ and ‘before’.”

---

### Phase T3 — Document Upload & Analysis Pipeline (Week 3–4)

**Goal:** User uploads a file in the UI; backend extracts text, runs STE-1.1, and stores results.

#### T3.1 — File upload and storage

- **Tasks:**
  - `POST /api/documents/upload`: multipart (Next.js route + multer or built-in); accept .docx, .txt (and .md if trivial). Save to disk (e.g. `uploads/demo/<uuid>.<ext>`); create `Document` record (no userId or fixed “demo”).
  - Limit: e.g. max 5 MB, 1 file per request for thesis.
- **Acceptance:** Upload returns document id and metadata; file and DB row exist.

#### T3.2 — Text extraction

- **Tasks:**
  - Service: extract plain text (mammoth for .docx, fs for .txt/.md). Update Document with wordCount, sentenceCount (simple counts).
  - `GET /api/documents/[id]` → metadata; `GET /api/documents/[id]/text` → extracted text (or include in metadata for thesis).
- **Acceptance:** Uploaded .docx and .txt yield correct text and counts.

#### T3.3 — Analysis run

- **Tasks:**
  - `POST /api/documents/[id]/analyze`: load document text → run tokenizer + STE-1.1 engine → create AnalysisRun and Violation rows; compute compliance score.
  - `GET /api/documents/[id]/analysis` or `GET /api/analysis-runs?documentId=...` → latest run with score and violations.
- **Acceptance:** After upload, calling analyze and then fetching analysis returns violations; frontend can show them.

**Phase T3 demo:** “I upload a procedure in .docx; the system extracts the text, runs the STE-1.1 engine, and stores violations. The dashboard and violation log now read from the database.”

---

### Phase T4 — Frontend Integration (Week 4–5)

**Goal:** Existing UI uses real APIs; mock data removed for dashboard, violations, upload, and rules (read-only).

#### T4.1 — Dashboard and violations

- **Tasks:**
  - `GET /api/dashboard/summary?documentId=...` (or last analyzed document): compliance score, violation counts by severity, top rules, sentence-type breakdown, document metadata, recent activity (e.g. last run). Shape matches current frontend mock.
  - `GET /api/violations?documentId=...&analysisRunId=...&ruleId=...&severity=...&keyword=...&page=...&limit=...` → { violations[], total }.
  - Frontend: replace mock dashboard and violation list with these APIs; keep mock auth (no login required).
- **Acceptance:** After analyzing a document, dashboard and violation log show real data.

#### T4.2 — Violation actions (optional for thesis)

- **Tasks:**
  - `PATCH /api/violations/[id]`: status (accepted/rejected), optional note. Store in DB.
  - Frontend: Accept/Reject/Edit update via API.
- **Acceptance:** Changing status persists and reflects in UI.

#### T4.3 — Rules API and wiring

- **Tasks:**
  - Seed 10–15 STE rules (id, name, topic, description, specText, examples) in DB or static JSON.
  - `GET /api/rules`, `GET /api/rules/[id]`; optional `POST /api/rules/[id]/test` body `{ "sentence": "..." }` → run STE-1.1 and return compliant/violation.
  - Frontend: Rule Library reads from API; favorites stay in localStorage; “Test this rule” calls test endpoint for STE-1.1.
- **Acceptance:** Rule list and detail come from backend; test sandbox returns real result for sample sentence.

**Phase T4 demo:** “The full flow works: upload → analyze → dashboard and violation log with real data; rules and dictionary are consistent with the engine.”

---

### Phase T5 — Optional Extensions (If Time Permits)

- **Ask ADAM:** `POST /api/ask-adam/chat` with messages; call Claude with system prompt that includes dictionary context (approved words, common alternatives). Frontend chat uses this instead of mock. *Strong thesis story: “We use the same dictionary for both checking and generative assistance.”*
- **Reports:** One export: e.g. `GET /api/violations/export?documentId=...&format=csv`. Frontend “Export” uses it.
- **Simple evaluation:** 10–20 sentences with known expected violations; run engine; report precision/recall in thesis appendix.

---

## 4. What Stays Simplified (Thesis-Realistic)

| Area | Simplification | Rationale |
|------|----------------|-----------|
| **Auth** | Mock only (current UI); no DB users | Thesis focuses on dictionary + analysis; auth is not the contribution. |
| **Sentence type** | Optional heuristic (e.g. imperative = first verb is base form) or “unknown” | STE-1.1 does not strictly require sentence type; can be added later. |
| **POS** | Heuristic or “unknown”; approved/not approved is enough for core claim | Reduces dependency on full NLP. |
| **NLP** | No spaCy/FastAPI in thesis scope; Node tokenization + dictionary | Keeps stack simple; spaCy can be “future work”. |
| **Other STE rules** | Only STE-1.1 implemented; others stubbed or documented | Thesis contribution is dictionary + STE-1.1; rest is scope of future work. |
| **Projects** | Single “demo” context or no project filter | Avoids project/org model until needed. |
| **File types** | .txt and .docx sufficient | .pdf and others as “future work”. |

---

## 5. Success Criteria for the Thesis

- **Dictionary:** Parsed, seeded, and queryable; engine uses it for every token.
- **STE-1.1 engine:** Produces violations with correct alternatives for a set of hand-checked sentences; described and (optionally) evaluated in thesis.
- **End-to-end:** Upload document → analyze → see violations and score in the UI, with data from the database.
- **Reproducibility:** README with steps to run DB, seed dictionary, run app, and reproduce key results.
- **Defense demo:** 5–10 minute script: show dictionary lookup, run engine on a paragraph, upload a document and show dashboard/violations, optionally show Ask ADAM or export.

---

## 6. Suggested Timeline (Realistic)

| Week | Focus | Deliverable |
|------|--------|-------------|
| 1 | Schema + parse + seed | DB with dictionary; JSON + form index; seed script runs. |
| 2 | Dictionary API + tokenizer + STE-1.1 engine | Lookup/search work; engine returns violations for sample text. |
| 3 | Upload + extract + analyze API | Upload .docx/.txt → analyze → AnalysisRun + Violations in DB. |
| 4 | Dashboard + violations + rules APIs; frontend wiring | UI shows real data; rules from API; optional PATCH violations. |
| 5 | Polish, optional Ask ADAM or export, write-up and demo prep | Thesis-ready demo and documentation. |

---

## 7. Risks and Fallbacks

| Risk | Mitigation |
|------|------------|
| XLSX parsing is messy | Start with a small subset of rows; validate structure before full run; use spec spot-checks. |
| Engine accuracy | Prioritize “approved vs not” and alternatives; defer POS and conditional approval to “simplified” or “future work”. |
| Time overrun | Phase T5 is optional; Ask ADAM and reports can be dropped; core is T1–T4. |
| Frontend breaks when switching to API | Integrate one screen at a time (e.g. violations first); keep mock data switch if needed for dev. |

---

## 8. Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | March 2026 | Initial thesis-focused plan. |

---

*This plan is designed so the **main logic (dictionary + rules + STE-1.1)** is implemented and demonstrable first, without depending on authentication or production-grade NLP.*
