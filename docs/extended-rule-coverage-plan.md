# Extended STE Rule Coverage — Implementation Plan

**Purpose:** Define what remains to **extend ADAM’s checking beyond the current subset** (dictionary, length, passive, imperative cue, warning label, punctuation-heavy rules, etc.), with **priority on rules that are structurally learnable** from the existing **sentence + token + POS-heuristic** model—or from **small, explicit extensions** to that model (paragraphs, lists, sentence role).

**Status:** Planning only — no implementation in this step. Use this document to sequence work; update `ruleplan.md` and check off items as engines ship.

**Authoritative spec:** ASD-STE100 **Issue 9** (rule wording, examples). Do not rely on this note for verbatim rule text; paste from your PDF into `data/ste-rules.json` and engine comments as you implement each rule.

---

## 1. What ADAM Already Implements (Baseline)

Rough inventory (see `ruleplan.md` and `app/api/documents/[id]/analyze/route.ts`):

| Area | Implemented (representative) |
|------|------------------------------|
| **STE-1** | 1.1, 1.2, 1.5, partial **1.3** (pattern layer); **3.1** (verb forms) shares wrong-form path with **1.5** for `pos: v` |
| **STE-2** | 2.1 (noun cluster length) |
| **STE-3** | 3.1 (via ste11 + dictionary forms), 3.2 (passive-style heuristic) |
| **STE-4** | 4.1–4.8 (partial — see `ruleplan.md`) |
| **STE-5** | 5.1, 5.2 (length), **5.3** (You + modal heuristic) |
| **STE-6** | **6.1** (short topic sentence heuristic + `paragraph.ts`) |
| **STE-7** | 7.1–7.5 (partial — see `ruleplan.md`) |
| **STE-8** | 8.1–8.7 (semicolon through **8.7** dash/em-dash heuristic) |
| **STE-9** | 9.1, 9.2, **9.3** (phrasal verb denylist) |
| **STE-10** | 10.2–10.4, 10.6 (via writing-practices engine) |

**Gap theme:** Large blocks of **STE-4.x (procedures)**, **STE-6.x (structure)**, **STE-7.x (warnings beyond label)**, **STE-3.x (verbs)** — and **STE-1.4–1.7** (words / technical nouns) — are mostly **not** implemented or only partially addressed.

---

## 2. Structural “Learnability” — What the Pipeline Can See Today

| Capability | Source | Enables |
|------------|--------|---------|
| Sentence boundaries + text | `tokenizeText` / `TokenizedDocument` | Per-sentence rules (length, passive, imperatives, warning lines, punctuation) |
| Word tokens + offsets | `Token[]` | Spans for violations, dictionary lookup |
| POS heuristic | `inferPOS` | Instructional vs descriptive (STE-5), noun clusters (STE-2.1), verb-first checks (STE-4.1) |
| Batched dictionary lookup | `createBatchedPrismaLookup` | STE-1.x |
| **Not first-class yet** | — | **Paragraphs**, **numbered steps**, **list items**, **section roles** (procedure vs warning block) |

**Implication:** Rules that need **only** sentence-level or token-sequence logic are **Tier A**. Rules that need **paragraph structure**, **lists**, or **multi-sentence coherence** need **Tier B** prerequisites (see §5).

---

## 3. Priority Tiers (Recommended Order)

### Tier A — Sentence-level, high value (do first after planning)

Implement when each rule’s **Issue 9** text is pasted and test cases are drafted.

| Topic | Rules (typical scope) | Why prioritize |
|-------|------------------------|----------------|
| **STE-7.x** | **7.2–7.5** (alongside existing 7.1) | Safety text: command-first, explanation, risk wording — mostly **pattern + sentence classification** (warning/caution lines already partially detectable). |
| **STE-4.x** | **4.2–4.8** | Procedures: notes vs instructions, comma after lead-in, one instruction per sentence, vertical lists — **token/sentence + light structure** (see §5). |
| **STE-3.x** | **3.1, 3.3–3.7** (3.2 done) | Verb forms, **-ing** as TN only, auxiliary verbs, active voice scope — **dictionary + POS + regex** (some overlap with existing engines). |

### Tier B — Needs model extensions (paragraphs / lists / blocks)

| Topic | Rules | Prerequisite work |
|-------|--------|-------------------|
| **STE-6.x** | 6.1–6.6 (structure, lists, paragraphs) | **Paragraph segmentation** from raw text (blank-line or extractor); optional **list-line** detector (`^\s*[-*•]\s` or `(a)\)` patterns); first-sentence-of-paragraph hooks for 6.1-style rules. |
| **STE-4.x** (deep) | Steps numbering, “one topic per paragraph” | **Step ID** regex (`^\d+\.` or `Step \d+`) + paragraph index; may combine with doc templates. |
| **STE-5.3–5.4** | Instruction phrasing | Stronger **sentence-type** classifier (already partially in STE-5). |

### Tier C — Dictionary / project configuration

| Topic | Rules | Notes |
|-------|--------|--------|
| **STE-1.4–1.7** | Technical nouns / verbs | Often needs **project TN/TV lists** (not only Excel); overlap with `CustomWord` / org config. |
| **STE-1.3** | Broader coverage | Extend `ste-meaning-patterns.ts` + optional WSD later. |

### Tier D — Document-level or low automation ROI

| Topic | Rules | Notes |
|-------|--------|--------|
| **STE-9.3–9.4** | Phrasal verbs; consistency | 9.3 partially overlapping with dictionary; 9.4 = consistency → **memory across document** |
| **STE-10.1, 10.5, 10.7** | Terminology / consistency | **Cross-document** or **embedding** / glossary — defer or partial heuristics. |

---

## 4. Per-Topic Backlog (What to Build)

Each item: **paste Issue 9 text** → **engine file** (`ste{NN}-engine.ts` or grouped `ste4-procedures-engine.ts`) → **`scripts/test-steNN-engine.ts`** → **wire `analyze/route.ts`** → **`run-all-ste-tests.ts`** → **update `ruleplan.md`**.

### 4.1 STE-4 — Procedures (4.2–4.8)

**Current:** STE-4.1 only (`ste41-engine.ts`).

| Rule | Work items |
|------|------------|
| **4.2** | Parse Issue 9: omissions / contractions overlap **STE-8.4** — decide single owner or complementary checks. |
| **4.3** | **Vertical lists:** detect list-like lines (leading bullet/number); flag dense prose that should be a list (heuristic — false-positive risk; scope to “procedure” sentences). |
| **4.4** | **Connecting words** between sentences: optional regex allowlist / denylist for weak connectors in procedural chains. |
| **4.5** | **Article / demonstrative before noun:** extend token window checks (already mentioned in Issue 9 table for 4.5 in some issues — confirm number in Issue 9 PDF). |
| **4.6–4.8** | **Partial in ADAM:** 4.6 → lead-in comma (Issue 9 **5.4**-style); 4.7 → NOTE: not instructions (**5.5**-style); 4.8 → TBD/TBC placeholders. Paste Issue 9 verbatim into `ste-rules.json` as needed. |

**Shared prerequisite:** Reliable **`sentenceType`** (`instructional` | `descriptive` | `warning_like`) — reuse STE-5 / STE-7 signals or centralize in `sentence-classifier.ts`.

---

### 4.2 STE-6 — Structure (6.1–6.6)

| Rule | Work items |
|------|------------|
| **General** | Add **`getParagraphs(text)`** (split on `\n\s*\n` + optional heading lines) producing `{ startOffset, endOffset, sentences: Sentence[] }[]` or attach `paragraphIndex` to sentences via offset binary search. |
| **6.1** | Topic sentence: heuristic — first sentence of paragraph contains main noun/verb from title or **bold** line (if extracted) — **low precision**; document as heuristic. |
| **6.2–6.6** | Lists, paragraph length, order — require **paragraph + list** model; implement after §4.2 **4.3** list detection shares code. |

---

### 4.3 STE-7 — Warnings & cautions (7.2–7.5)

**Current:** STE-7.1 only (`ste71-engine.ts`).

| Rule | Work items |
|------|------------|
| **7.2** | Start safety instruction with **clear command or condition** — regex/pattern on lines following WARNING/CAUTION/DANGER; flag narrative-first safety lines. |
| **7.3** | **Explanation of risk** — detect missing “if” / consequence clause after command (hard; start with **minimum pattern** from Issue 9 examples). |
| **7.4–7.5** | Placement / additional formatting — may need **block-level** context (following paragraph). |

**Integration:** Consider **`ste7x-engine.ts`** (single module, multiple `ruleId`s) to avoid seven tiny files; unit-test each rule.

---

### 4.4 STE-3 — Verbs (3.1, 3.3–3.9; 3.2 done)

| Rule | Work items |
|------|------------|
| **3.1** | Only dictionary verb forms — overlap with **STE-1.5** + dictionary; flag forms not in `allowedForms` for verbs. |
| **3.3–3.5** | **-ing**, passive scope, auxiliaries — combine with `ste32-engine` or split to avoid duplicate passive hits; **precedence** table in code comments. |
| **3.6** | Active vs passive **by sentence type** — Issue 9 distinguishes procedural vs descriptive; wire **sentenceType** + passive detector. |
| **3.7** | Approved verb for action — nominalization detection (heuristic: `tion` nouns where verb expected). |

---

### 4.5 STE-2 / STE-5 / STE-8 / STE-9 (remaining)

| Rule | Work items |
|------|------------|
| **2.2–2.3** | Noun cluster clarity / requirements — need Issue 9 examples; may be **phrase parsing** beyond current cluster length. |
| **5.3–5.4** | One instruction per sentence; lead-in comma — **sentence splitting** on comma? + imperative count. |
| **8.5–8.7** | Parentheses, word-count rules — mostly **regex + token count** on sentence. |
| **9.3–9.4** | Phrasal verbs; style consistency — **9.3**: pattern list; **9.4**: defer or n-gram consistency. |

---

## 5. Prerequisites (Engineering Tasks Before / Alongside Rules)

| # | Task | Unblocks |
|---|------|----------|
| P1 | **Central `classifySentence(text, tokens, index)`** | STE-4.x, STE-5.x, STE-3.6, STE-7.x (procedure vs descriptive vs warning) |
| P2 | **`getParagraphs(documentText)`** + map sentences → paragraph id | STE-6.x, block STE-7.x |
| P3 | **List-line detector** (ordered / unordered) | STE-4.3, parts of STE-6.x |
| P4 | **Rule precedence matrix** (e.g. passive: STE-3.2 vs STE-3.6) | Fewer duplicate violations |
| P5 | **Official Issue 9 excerpts** in `data/ste-rules.json` for every implemented rule | Thesis + UI Rule Library |

---

## 6. Implementation Phases (Suggested)

| Phase | Focus | Deliverables |
|-------|--------|--------------|
| **1** | **STE-7.2–7.3** (and 7.4–7.5 if feasible) | `ste7x-engine.ts` or split files; tests; analyze route; `ruleplan` update |
| **2** | **STE-4.2–4.5** + sentence classifier | Extend `ste41-engine` or new `ste4x-engine.ts`; tests |
| **3** | **STE-3.1, 3.3–3.7** (excluding duplicates) | Verb engines; dictionary hooks; precedence with STE-3.2 |
| **4** | **Paragraph + lists** (P2, P3) then **STE-6.1–6.3** | Paragraph-aware tokenization path |
| **5** | **STE-1.4–1.7** as data allows | TN/TV lists, config UI or seed |

---

## 7. Explicit Non-Goals (for This Track)

- **Full NLP** (dependency parsing, coreference) — not required for Tier A; document limitations in thesis.
- **Perfect STE-6.1** “topic sentence” without document metadata — expect heuristic-only.
- **Replacing** human review for safety-critical manuals.

---

## 8. File / Process Checklist (When Starting Implementation)

- [ ] For each new rule: copy **Issue 9** wording into `data/ste-rules.json` (`specText`).
- [ ] Add engine under `app/lib/analysis/`; export from `app/lib/analysis/index.ts`.
- [ ] Add `scripts/test-ste*-engine.ts`; register in `scripts/run-all-ste-tests.ts`.
- [ ] Merge violations in `app/api/documents/[id]/analyze/route.ts` (order: respect **P4** precedence).
- [ ] Update **`ruleplan.md`** §1.2 / §3 tables.
- [ ] Optional: small **gold file** per topic under `docs/` (like `ste13-gold-set.md`).

---

## 9. References

- `ruleplan.md` — per-rule table (sync after implementation).
- `data/ste-rules.json` — 60 rule IDs and placeholders.
- `thesisch3-4.md` — architecture narrative for thesis.
- ASD-STE100 **Issue 9** PDF — sole source for rule semantics and examples.

---

*Next step: pick **Phase 1** (STE-7.x) or **Phase 2** (STE-4.x), paste target rules from Issue 9, then implement one engine at a time.*

---

## 10. Implementation log

| Date | Step | Delivered |
|------|------|-----------|
| 2026-03-01 | Phase 1 — STE-7.2 | `app/lib/analysis/ste72-engine.ts`, `scripts/test-ste72-engine.ts`, wired in `analyze/route.ts`, `data/ste-rules.json` updated, `ruleplan.md` updated. Run `npm run test:ste72` or full `npm run test:ste-rules`. **Next:** STE-7.3 (risk explanation heuristic) or Phase 2 STE-4.x. |
| 2026-03-01 | Phase 1 — STE-7.3 | `ste73-engine.ts`, `ste7-patterns.ts` (shared with `ste72`), `scripts/test-ste73-engine.ts`, analyze route, `ste-rules.json`, `ruleplan.md`. **Next:** STE-7.4/7.5 or Phase 2 (e.g. STE-4.5). |
| 2026-03-01 | Phase 2 — STE-4.5 | `ste45-engine.ts`, `test-ste45-engine.ts`, analyze route (restored `ste73Result` run). `data/ste-rules.json` STE-4.5 corrected (was mislabeled “one action per step”). **Next:** STE-4.2/4.3/4.4 or STE-7.4. |
| 2026-03-01 | Phase 2 — STE-4.2 | `ste42-engine.ts` (And/But/Or fragments); `test-ste42-engine.ts`; contractions remain STE-8.4. **Next:** STE-4.3 (lists) or STE-7.4. |
| 2026-03-01 | Phase 2 — STE-4.3 | `sentence-classifier.ts`, `ste43-engine.ts` (dense instructional → suggest vertical list; skip list-like lines), `test-ste43-engine.ts`; analyze route now runs **STE-4.2** + STE-4.3; `ste-rules.json` STE-4.3 metadata. **Next:** STE-4.4 or STE-7.4 / STE-3.1. |
| 2026-03-01 | Phase 2 — STE-4.4 | `ste44-engine.ts` (weak openers; repeated The+noun pairs), `test-ste44-engine.ts`, analyze route, `ste-rules.json`. **Next:** STE-4.6–4.8 or STE-7.4 / STE-3.1. |
| 2026-03-01 | Phase 2 — STE-4.6–4.8 | `ste46-engine.ts` (5.4-style lead-in comma), `ste47-engine.ts` (5.5-style NOTE: instructions), `ste48-engine.ts` (TBD/TBC placeholders); `test-ste46-48-engine.ts`; analyze route; `ste-rules.json`. **Next:** STE-7.4–7.5 or STE-3.1 / paragraph model. |
| 2026-03-21 | Multi-step rollout | **STE-7.4/7.5** (`ste74`, `ste75`), **STE-3.1** (verb wrong_form → `STE-3.1` in `ste11-engine`), **STE-5.3** (`ste53`), **`paragraph.ts` + STE-6.1** (`ste61`), **STE-8.5–8.7** + **STE-9.3** (`ste85`–`ste87`, `ste93`); tests + `analyze/route` + `ste-rules.json` + `ruleplan.md`. **STE-1.4–1.7** / **STE-9.4** remain **doc-level** or deferred. |
