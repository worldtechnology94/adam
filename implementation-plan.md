# ADAM — Implementation Plan
## Automated Document Analysis & Management | ASD-STE100 Compliance Platform

**Document version:** 1.0  
**Date:** March 2026  
**Status:** Planning  
**References:** `adam.md` (Product Requirements), `adam_dictionary_spec.md` (Dictionary & STE-1.1 Logic)

---

## 1. Executive Summary

This plan guides development of **ADAM** from the current baseline (Next.js starter, minimal Prisma schema, and an `nlp-service` folder containing `ASD-STE_Word.xlsx`) to a full ASD-STE100 compliance intelligence platform. Work is ordered so that **foundational layers** (data, dictionary, auth, ingestion) are built first, then **analysis and UI**, and finally **advanced features** (AI assistant, reports, projects, analytics).

The plan is designed to be executed **one step at a time**, with each step yielding a testable outcome and clear acceptance criteria.

---

## 2. Current State vs. Target

| Area | Current State | Target (from adam.md + adam_dictionary_spec.md) |
|------|---------------|-------------------------------------------------|
| **Frontend** | Next.js 16 + single default page (Create Next App boilerplate) | React 18/19 + TypeScript, Zustand, Radix UI, Tailwind, Recharts, full app shell and all modules |
| **Backend** | None (Next.js only) | API layer (Next.js API routes or Fastify); NLP microservice (Python/spaCy); optional WebSocket |
| **Database** | Prisma schema with PostgreSQL datasource only; no models | Full schema: users, projects, documents, violations, STE dictionary tables, custom words |
| **Dictionary** | `ASD-STE_Word.xlsx` present in `nlp-service/` | Parsed JSON + form index; DB seed; lookup service; STE-1.1 rule engine |
| **NLP** | `nlp-service/` has venv + deps (e.g. pandas, FastAPI) but no app code | Tokenizer, POS/NER/lemmatization, sentence classification, integration with dictionary |
| **Auth** | Next-Auth + Prisma adapter in package.json; not wired | JWT + refresh, roles (Viewer / Writer / Reviewer / Admin / Super Admin), SSO later |
| **Document processing** | mammoth, pdf-parse, multer in package.json; not used | Multi-format ingestion (.docx, .pdf, .txt, .md, .xml/.sgml, paste); metadata extraction |

---

## 3. Principles

- **One step at a time:** Complete and verify each step before moving to the next.
- **Dictionary-first:** STE-1.1 (approved words, POS, alternatives) depends on a correct dictionary pipeline; build it early.
- **Incremental value:** Each phase should deliver something demonstrable (e.g. “upload a .txt and see STE-1.1 violations”).
- **Spec alignment:** Frontend/backend behavior and data structures follow `adam.md` and `adam_dictionary_spec.md`.
- **Professional quality:** Clear naming, typed APIs, accessibility (WCAG 2.1 AA), and security by design.

---

## 4. Phase Overview

| Phase | Focus | Outcome |
|-------|--------|---------|
| **Phase 1** | Foundation: DB, dictionary, auth | Schema, seeded STE data, login and roles |
| **Phase 2** | Document ingestion & NLP pipeline | Upload → extract text → sentences → STE-1.1 checks |
| **Phase 3** | Dashboard & Violation Log | Compliance score, violation list, filters, diff view |
| **Phase 4** | Rule Reference Library & Ask ADAM | 60-rule library UI, Claude integration with dictionary context |
| **Phase 5** | Reports, projects, analytics, settings | Export, projects, trends, configuration |

---

## 5. Phase 1 — Foundation (Database, Dictionary, Auth)

**Goal:** Stable data model, STE dictionary loadable and queryable, and authenticated users with roles.

### Step 1.1 — Prisma schema (core entities)

- **Tasks:**
  - Add models: `User`, `Account`, `Session` (for Next-Auth if using Prisma adapter).
  - Add `Organization` (optional for multi-tenant) and link `User` to it.
  - Add `Project` (name, metadata); link to `Organization` and `User` (creator).
  - Add `Document` (file reference, name, word count, sentence count, document type, projectId, upload metadata).
  - Add `AnalysisRun` (documentId, timestamp, compliance score, summary).
  - Add `Violation` (analysisRunId, sentence excerpt, ruleId, sentence type, severity, position, aiSuggestion, raw payload for diff).
  - Add dictionary tables per `adam_dictionary_spec.md` §2.3: `ste_words`, `ste_word_forms`, `ste_meanings`, `ste_examples`, `custom_words`.
- **Acceptance criteria:** `prisma generate` succeeds; migrations run cleanly; schema matches spec for dictionary and app entities.

### Step 1.2 — Parse STE dictionary (XLSX → JSON + form index)

- **Tasks:**
  - Implement Python script in `nlp-service/` (e.g. `scripts/parse_ste_dict.py`) that:
    - Reads `ASD-STE_Word.xlsx`, sheet `Word`.
    - Handles continuation rows (blank column B = same headword, extra meaning/alternative/example).
    - Produces `ste_dictionary.json` (structure per dictionary spec §2.1) and `ste_forms_index.json` (form → headword).
  - Normalize headwords (lowercase), extract POS, approved/not-approved, meanings, alternatives, STE/non-STE examples.
  - For verbs with conjugation forms in column B, add all forms to `ste_forms_index.json`.
- **Acceptance criteria:** Script runs without error; JSON files produced; spot-checks for “abandon”, “about”, “absorb” match spec examples.

### Step 1.3 — Dictionary seed (JSON → PostgreSQL)

- **Tasks:**
  - Add Node script (e.g. `scripts/seed-dictionary.js` or TS) that reads `ste_dictionary.json` and `ste_forms_index.json` and populates `ste_words`, `ste_word_forms`, `ste_meanings`, `ste_examples`.
  - Idempotent where possible (e.g. truncate + insert, or upsert by word).
- **Acceptance criteria:** Seed runs; row counts align with spec (~2,199 headwords, forms); lookup by word and by form works via raw SQL or a small script.

### Step 1.4 — Dictionary API (lookup and search)

- **Tasks:**
  - Expose internal API (Next.js route or Fastify):
    - `GET /api/dictionary/lookup?word=...` → approved, alternatives, examples.
    - `GET /api/dictionary/search?q=...&pos=...` → list of matching entries.
  - Implement lookup using form index then headword; merge with `custom_words` when org/project context exists (can be stub initially).
- **Acceptance criteria:** Lookup returns correct data for “abandon”, “about”, “absorb”; search returns relevant entries.

### Step 1.5 — Auth and roles

- **Tasks:**
  - Configure Next-Auth with Prisma adapter, credentials or OAuth, JWT/session.
  - Add role field to `User` (e.g. `Viewer | Writer | Reviewer | Admin | SuperAdmin`).
  - Protect routes and API handlers by role where applicable.
  - Add minimal sign-in/sign-out UI and session provider.
- **Acceptance criteria:** User can sign in; session available in app; role stored and readable; protected route rejects unauthorized access.

---

## 6. Phase 2 — Document Ingestion & NLP Pipeline

**Goal:** Upload documents, extract text, split into sentences, run STE-1.1 checks using dictionary + NLP.

### Step 2.1 — File ingestion (backend)

- **Tasks:**
  - Implement upload API (e.g. `POST /api/documents/upload`) with multipart support (multer or Next.js equivalent).
  - Support .docx (mammoth), .pdf (pdf-parse), .txt, .md; store file in filesystem or object storage and save `Document` record.
  - Extract plain text and metadata (word count, sentence count); optionally detect document type (procedure / description / warning / mixed) from structure or heuristics.
- **Acceptance criteria:** Upload .docx and .txt; `Document` created with correct text and counts.

### Step 2.2 — NLP microservice (tokenize, POS, NER, lemmatize)

- **Tasks:**
  - In `nlp-service/`, implement FastAPI app that:
    - Accepts text or list of sentences.
    - Uses spaCy (e.g. `en_core_web_sm` or `en_core_web_trf`) to tokenize, POS-tag, NER, dependency parse, lemmatize.
    - Returns per-sentence: tokens with lemma and POS; sentence type (instructional / descriptive / warning-caution) from heuristics or model.
  - Expose e.g. `POST /analyze` with JSON in/out.
- **Acceptance criteria:** Given a sentence, service returns tokens with correct lemmas and POS; sentence type plausible.

### Step 2.3 — STE-1.1 rule engine

- **Tasks:**
  - Implement STE-1.1 logic per `adam_dictionary_spec.md` §3:
    - For each token: normalize, lemmatize, form→headword lookup, dictionary lookup.
    - If not in dictionary → violation (unknown word); if approved=false → violation with alternatives/examples; if approved=true, check POS in context and flag wrong POS.
    - Handle conditionally approved words (e.g. ABOUT) when meaning can be inferred; skip proper nouns, numbers, custom list.
  - Engine can live in Node (using dictionary API + NLP response) or in Python (using dictionary JSON + spaCy); keep one source of truth for dictionary.
- **Acceptance criteria:** Known unapproved word (e.g. “abandon”) produces violation with suggested alternatives; approved word in wrong POS produces violation; approved word in correct POS passes.

### Step 2.4 — End-to-end analysis API

- **Tasks:**
  - Add `POST /api/documents/[id]/analyze` (or similar): load document text → call NLP service → run STE-1.1 engine → persist violations to `Violation` and summary to `AnalysisRun`.
  - Return analysis result (score, violation count, list of violations).
- **Acceptance criteria:** Upload doc → trigger analysis → violations and score stored and returned; dashboard or a simple UI can display count.

---

## 7. Phase 3 — Dashboard & Violation Log

**Goal:** Main dashboard with compliance score and key metrics; detailed violation log with filters and diff view.

### Step 3.1 — App shell and navigation

- **Tasks:**
  - Apply ADAM branding (name, tagline, primary #1A2B4A, accent #F59E0B, success #10B981).
  - Implement app layout: sidebar or top nav for Dashboard, Upload, Violation Log, Rule Library, Ask ADAM, Reports, Settings (placeholders ok for not-yet-built).
  - Ensure theme (light/dark) and WCAG 2.1 AA (contrast, 14px min, keyboard, ARIA).
- **Acceptance criteria:** Navigation works; theme toggles; accessibility baseline met.

### Step 3.2 — Dashboard (home)

- **Tasks:**
  - Compliance score 0–100 with color tiers (Red &lt;60, Amber 60–79, Green 80–100); animated gauge or equivalent.
  - Total violations with breakdown by severity (Critical / Major / Minor).
  - Most violated rules: top 5 as horizontal bar chart (Recharts).
  - Rules found count; sentence type breakdown (pie: Instructional, Descriptive, Warning/Caution); violation distribution (donut per STE rule).
  - Document metadata bar: file name, word count, sentence count, upload time, document type.
  - Recent activity feed (timestamped analyses).
- **Acceptance criteria:** After an analysis, dashboard shows score, counts, and charts consistent with stored data.

### Step 3.3 — Document upload UI

- **Tasks:**
  - Drag-and-drop zone; multi-file batch (e.g. up to 20); file queue with progress.
  - Pre-analysis preview (raw text); optional metadata (project, document type, revision, author).
  - Call upload API and optionally trigger analysis; redirect or refresh to show result on dashboard.
- **Acceptance criteria:** User can drop files, see preview, upload and run analysis; new document appears in dashboard context.

### Step 3.4 — Violation Log (data table)

- **Tasks:**
  - Filterable, sortable table: sentence excerpt, Rule ID, Rule Name, sentence type, word count, severity, AI suggestion.
  - Filter bar: by rule (STE-1.1–STE-10.7), sentence type, severity, keyword.
  - Pagination or virtual scroll for large sets.
- **Acceptance criteria:** All violations for an analysis visible; filters and sort work correctly.

### Step 3.5 — Violation Log (diff view and actions)

- **Tasks:**
  - Inline diff: original sentence vs AI-corrected (red/green highlights).
  - Per-row actions: Accept / Reject / Edit; bulk “accept all for rule” and export selected.
  - Optional: annotation (private notes), expand row for surrounding paragraph, violation heatmap (density per paragraph).
- **Acceptance criteria:** Diff visible and correct; accept/reject persists; bulk actions work.

---

## 8. Phase 4 — Rule Reference Library & Ask ADAM

**Goal:** Full 60-rule reference inside the app; conversational AI assistant with dictionary-aware corrections.

### Step 4.1 — Rule reference data and API

- **Tasks:**
  - Create rule catalog (JSON or DB): all 60 rules with ID, name, topic (STE-1–10), specification text, plain-language explanation, compliant/non-compliant examples.
  - API: list rules, get by ID, search (full-text), filter by topic; optional “favorites” per user.
- **Acceptance criteria:** Every STE-1.1–STE-10.7 represented; search and filter return correct rules.

### Step 4.2 — Rule Reference Library UI

- **Tasks:**
  - Searchable library: rule ID, name, explanation, spec text, examples (compliant / non-compliant with reason).
  - Filter by STE topic; favorites; “Test this rule” sandbox (input sentence → run single rule → show result).
  - Cross-links between rules where relevant (e.g. STE-3.5 ↔ STE-1.6).
- **Acceptance criteria:** User can find any rule, read explanation and examples, and test a sentence against one rule.

### Step 4.3 — Ask ADAM (Claude integration)

- **Tasks:**
  - Backend: endpoint that accepts chat messages and current document context (and optionally violation list); calls Claude (e.g. claude-sonnet-4-6) with system prompt that includes STE-100 rules and dictionary context (approved words, alternatives).
  - System prompt: identify non-STE words, suggest alternatives from dictionary, rewrite with approved words/POS, cite STE-1.1; diff-style output.
  - Persist conversation history per document/session.
- **Acceptance criteria:** User can ask “rewrite this sentence in STE”; response uses dictionary-backed alternatives and cites STE-1.1.

### Step 4.4 — Ask ADAM (chat UI and features)

- **Tasks:**
  - Chat UI: full-screen or side-panel; markdown rendering; copy-to-document on suggested sentences.
  - Modes: rewrite on demand, rule Q&A, compare two sentences, document-aware questions, batch rewrite by rule, training/quiz mode.
- **Acceptance criteria:** User can have a conversation, get rewrites and explanations, and copy corrections into the document workflow.

---

## 9. Phase 5 — Reports, Projects, Analytics, Settings

**Goal:** Export and reporting, project/document management, trends, and configuration.

### Step 5.1 — Reports & export

- **Tasks:**
  - Executive summary (1-page PDF); full compliance audit (PDF/DOCX); rule-by-rule breakdown; corrected document (DOCX with accepted suggestions); delta report (two versions); trend report (score over revisions).
  - Export formats: PDF, DOCX, XLSX (violation log), JSON, HTML.
  - Options: logo/branding, header/footer, rule categories, redaction.
- **Acceptance criteria:** User can generate and download at least one report type (e.g. full audit PDF) and one export format (e.g. XLSX).

### Step 5.2 — Project & document management

- **Tasks:**
  - CRUD for projects; assign documents to projects; project-level compliance score; version control (revisions, score progression); tags (ATA chapter, module type, etc.); activity log; optional team workspace and notifications (score threshold).
- **Acceptance criteria:** User can create a project, assign documents, see project score and history.

### Step 5.3 — Analytics & trends

- **Tasks:**
  - Score trend line; violation heatmap calendar; rule frequency chart; word frequency (flagged words); improvement velocity; sentence complexity distribution; writer metrics (opt-in).
  - Charts interactive (Recharts/D3), exportable (PNG/SVG).
- **Acceptance criteria:** At least two trend/analytics views (e.g. score over time, rule frequency) with correct data.

### Step 5.4 — Settings & configuration

- **Tasks:**
  - User: theme (light/dark/high-contrast), notifications, default export format, UI language.
  - Analysis: toggle rules per project, custom word lists (CSV import), sentence-type sensitivity, severity thresholds.
  - Integrations: REST API for CI/CD, webhooks, SSO (SAML 2.0 / OAuth 2.0) as specified; S1000D/CCMS as later scope.
- **Acceptance criteria:** User can change theme and at least one analysis setting (e.g. custom word list or rule toggle); settings persist.

---

## 10. Phase 6 — Polish, Accessibility, Onboarding

**Goal:** Production-ready UX, compliance, and help.

### Step 6.1 — Accessibility and UX

- **Tasks:**
  - WCAG 2.1 AA: color + icon for violations; keyboard navigation; ARIA labels; 14px min body text; zoom-safe layout.
  - Performance: lazy loading, virtualization for large tables, optional code splitting.
- **Acceptance criteria:** Lighthouse accessibility score acceptable; keyboard-only and screen-reader testing pass.

### Step 6.2 — Onboarding and help

- **Tasks:**
  - First-time walkthrough (skippable); sample document library; tooltips on rule IDs linking to Rule Library; keyboard shortcut reference (e.g. `?`); in-app release notes.
- **Acceptance criteria:** New user can complete walkthrough; rule IDs link to library; shortcut reference available.

---

## 11. Implementation Notes

### 11.1 Technology alignment

- **Frontend:** Next.js 16 + React 19 + TypeScript is acceptable; spec’s “React 18” can be read as minimum. Add Zustand for client state; Radix UI and Tailwind are already in use; add Recharts (and D3 if needed) for charts; CodeMirror 6 for diff/rich text when needed.
- **Backend:** Prefer Next.js API routes for simplicity unless you need a separate Fastify service (e.g. WebSockets); NLP in Python microservice is correct.
- **Database:** PostgreSQL + Prisma as planned; Redis + BullMQ for job queue when batch analysis or async jobs are introduced (Phase 2 or 3).

### 11.2 Dictionary and STE-1.1

- Dictionary JSON and form index are the source of truth for STE-1.1; DB is for persistence and custom words. Ensure the engine always uses the same lookup path (form → headword → entry) and merges `custom_words` when in project/org context.
- Conditionally approved words (e.g. ABOUT) require context; implement simple heuristics first (e.g. “approximately” → use APPROXIMATELY), then refine with NLP/semantics if needed.

### 11.3 Order of execution

- Execute steps in the order given; dependencies are explicit (e.g. 1.1 → 1.2 → 1.3 → 1.4; 2.1 → 2.2 → 2.3 → 2.4).
- Within a phase, complete all steps before moving to the next phase unless a step is explicitly split into sub-deliverables.

---

## 12. Success Criteria (Overall)

- All 60 STE rule categories are represented in the Rule Reference Library; STE-1.1 checking is accurate per dictionary spec.
- Users can upload documents (supported formats), run analysis, see compliance score and violations on the dashboard and in the Violation Log, and act on suggestions (accept/reject/edit).
- Ask ADAM provides dictionary-backed rewrites and rule explanations.
- At least one report type and one export format work end-to-end.
- Projects and basic analytics support multi-document and revision workflows.
- UI is accessible (WCAG 2.1 AA), branded, and usable on desktop.

---

## 13. Document History

| Version | Date | Author | Changes |
|--------|------|--------|---------|
| 1.0 | March 2026 | — | Initial implementation plan from adam.md and adam_dictionary_spec.md |

---

*This plan is the single reference for implementing ADAM from the current codebase. Adjustments should be documented here and communicated to the team.*
