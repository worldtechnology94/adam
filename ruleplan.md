# ADAM — Rule Implementation Plan

This document verifies which of the 60 STE rules have **checking logic** implemented in the analysis pipeline and provides a plan to implement the rest. It references **ASD-STE_Word.xlsx** (and its analysis) where the dictionary is the data source.

---

## 1. Verification: Current Implementation Status

### 1.1 What Runs Today

| Component | Location | Purpose |
|-----------|----------|---------|
| **Tokenizer** | `app/lib/analysis/tokenize.ts`, `sentence-boundary.ts` | Splits text into sentences and word tokens; normalizes for lookup. |
| **Dictionary** | From **ASD-STE_Word.xlsx** → `ste_dictionary.json` → DB (`ste_words`, `ste_word_forms`, `ste_meanings`, `ste_examples`) | Source of approved/forbidden words, POS, alternatives, STE/non-STE examples. See `docs/ASD-STE_Word-xlsx-analysis.md`. |
| **Dictionary lookup** | `app/lib/analysis/dictionary-lookup.ts` | Resolves form → headword; returns approved, alternatives, examples, **`meanings[]`**, allowed forms. |
| **Analysis pipeline** | `app/api/documents/[id]/analyze/route.ts` | Extracts text → tokenize → **multiple STE engines** (STE-1.1/1.2/1.5, STE-1.3, STE-5.x, STE-8.x, …) → merge violations → create AnalysisRun + Violation rows. |

### 1.2 Rules With Engine Logic Implemented

| Rule ID | Status | Data source | Engine / logic |
|---------|--------|-------------|----------------|
| **STE-1.1** | ✅ **Implemented** | **ASD-STE_Word.xlsx** (via DB) | `app/lib/analysis/ste11-engine.ts`: for each word token, lookup in dictionary; unknown → violation; not approved → violation (STE-1.2) + alternatives; approved but wrong POS → violation; approved but token not in allowedForms → STE-1.5. Uses batched lookup. See `adam_dictionary_spec.md` §3. |
| **STE-1.3** | ✅ **Implemented** (pattern subset) | Dictionary **`ste_meanings`** + `ste-meaning-patterns.ts` | `app/lib/analysis/ste13-engine.ts`: after STE-1.1 pass, for configured headwords only, sentence-level regexes match **disallowed** meaning rows; **`wrong_meaning`** → STE-1.3. Not full WSD. See `missing-dic-driven.md`, `docs/ste13-gold-set.md`. |
| **STE-8.1** | ✅ **Implemented** | Rule text | `app/lib/analysis/ste81-engine.ts`: scan each sentence for `;`; one violation per occurrence. Called from analyze route; violations merged with STE-1.x. |
| **STE-5.1, STE-5.2** | ✅ **Implemented** | Rule text | `app/lib/analysis/ste5-engine.ts`: sentence type by first-word POS (v → instructional); instructional >20 words → STE-5.1, descriptive >25 → STE-5.2. Violations include sentenceType for DB. |
| **STE-3.2** | ✅ **Implemented** | Rule text | `app/lib/analysis/ste32-engine.ts`: passive voice = be form + past participle (-ed or irregular); one violation per construction. |
| **STE-4.1** | ✅ **Implemented** | Rule text | `app/lib/analysis/ste41-engine.ts`: sentence with should/must/shall but not starting with verb → use imperative (STE-4.1). |
| **STE-4.2** | ✅ **Implemented** (partial) | Rule text | `app/lib/analysis/ste42-engine.ts`: sentence starting with And/But/Or (fragment). Contractions → STE-8.4. |
| **STE-4.5** | ✅ **Implemented** (heuristic) | Rule text | `app/lib/analysis/ste45-engine.ts`: instructional line with imperative + bare noun (no article/demonstrative) → STE-4.5. |
| **STE-7.1** | ✅ **Implemented** | Rule text | `app/lib/analysis/ste71-engine.ts`: warning sentence must start with "WARNING:"; Warning/Caution/Danger (wrong form) → violation. |
| **STE-7.2** | ✅ **Implemented** (heuristic) | Rule text | `app/lib/analysis/ste72-engine.ts`: after WARNING/CAUTION/DANGER, flag weak narrative lead-ins (e.g. Note that, It is important). Not full imperative parsing. |
| **STE-7.3** | ✅ **Implemented** (heuristic) | Rule text | `app/lib/analysis/ste73-engine.ts`: on longer safety lines, expect risk/outcome words or causal phrasing; skips short lines and If/When openers. Shared patterns in `ste7-patterns.ts`. |
| **STE-2.1** | ✅ **Implemented** | Rule text | `app/lib/analysis/ste21-engine.ts`: noun cluster = max run of art/adj/n; length > 3 → violation. |
| **STE-8.2** | ✅ **Implemented** | Heuristic | `app/lib/analysis/ste82-engine.ts`: serial comma in lists; "A, B and C" → add comma before and/or (STE-8.2). |
| **STE-8.3** | ✅ **Implemented** | Heuristic | `app/lib/analysis/ste83-engine.ts`: hyphenate compound numbers (twenty-one through ninety-nine). |
| **STE-8.4** | ✅ **Implemented** | Heuristic | `app/lib/analysis/ste84-engine.ts`: no contractions; suggest full form (e.g. do not for don't). |
| **STE-9.1** | ✅ **Implemented** | Rule text | `app/lib/analysis/ste91-engine.ts`: vague reference ("the section/figure/table" without number) → use exact reference. |
| **STE-9.2** | ✅ **Implemented** | Heuristic | `app/lib/analysis/ste92-engine.ts`: reference label + number → capitalize (Section 4, Figure 2). |
| **STE-10.2** | ✅ **Implemented** | Heuristic | `app/lib/analysis/ste102-engine.ts`: Latin abbreviations (e.g., i.e., etc.) → use full form. |
| **STE-10.3, 10.4, 10.6** | ✅ **Implemented** | Heuristic | `app/lib/analysis/ste10-writing-engine.ts`: 10.3 symbols (&, %); 10.4 British→US spelling; 10.6 ellipsis. 10.5/10.7 doc-level (no check). |

### 1.3 Rules Without Engine Logic (Catalog Only)

Rules **not** listed in §1.2 still exist in the Rule Library (`data/ste-rules.json` + DB `rules` table) for display. Many STE rules **are** implemented (see §1.2); the tables in §3 mark **per-rule** gaps (e.g. STE-1.4, STE-1.6 technical-noun checks not fully automated).

---

## 2. Data Source: ASD-STE_Word.xlsx

- **File:** `nlp-service/ASD-STE_Word.xlsx` (Word sheet).
- **Content:** Headwords, approved (Yes/No), meanings, alternatives, STE/non-STE examples (columns B–G). Continuation rows when B is empty. See `docs/ASD-STE_Word-xlsx-analysis.md` for column layout, continuation rules, and parsing notes.
- **Used by:** STE-1.1 engine (and can be used by STE-1.2). Parsed to `ste_dictionary.json` + `ste_forms_index.json`; seeded to DB via `npm run seed:dict`. The engine uses **form → headword** resolution and **approved / alternatives / examples** from the dictionary.
- **Not in the Excel:** The 60 rule definitions (STE-1.1 text through STE-10.7) come from ASD-STE100 Issue 9; ADAM’s copy is in `data/ste-rules.json`.

---

## 3. Plan Per Rule (or Group)

For each rule, the table below gives: **status**, **data source**, **proposed logic**, and **how to verify**. Use this to implement engines one-by-one and wire them into the analysis pipeline.

### STE-1 — Words (1.1–1.7)

| Rule | Status | Data source | Proposed implementation | Verification |
|------|--------|-------------|------------------------|--------------|
| **STE-1.1** | ✅ Done | **ASD-STE_Word.xlsx** (DB) | Already: tokenize → lookup; unknown word or wrong POS → violation (STE-1.1). | Run analyze on a doc with unknown word or wrong POS; expect STE-1.1. |
| **STE-1.2** | ✅ Done | **ASD-STE_Word.xlsx** (DB) | Same engine: when word is in dictionary and `approved = false` → violation with ruleId **STE-1.2** (Prohibited words), suggestion from alternatives. | Run analyze on a doc with "utilize" / "prior to"; expect STE-1.2 violations with alternatives. |
| **STE-1.3** | ✅ Partial | Dictionary meaning rows | Issue 9: **approved meanings**. Implemented: **`ste13-engine.ts`** + patterns for e.g. *about* (approximation / spatial); extend `ste-meaning-patterns.ts` for more headwords. Wrong POS remains STE-1.1. | `scripts/test-ste13-engine.ts`; `docs/ste13-gold-set.md`. |
| **STE-1.4** | ❌ Not done | ASD-STE100 spec | Technical nouns: likely "use approved technical terms" or allow a technical-word list. Need spec text. | Define rule from spec; add heuristic or allowlist. |
| **STE-1.5** | ✅ Done | Dictionary (forms) | Same engine: lookup returns `allowedForms` (from `ste_word_forms` + headword). For approved words, if token not in `allowedForms` → violation STE-1.5 (Word forms), suggestion lists approved forms. | Unit test: mock returns approved headword with allowedForms excluding token (e.g. "runned" → run with forms run,runs,running,ran) → STE-1.5. |
| **STE-1.6** | ❌ Not done | Issue 9 | **Technical nouns:** unapproved words only as TN or part of TN (not the same as STE-1.3 meaning rows). | Project nomenclature / allowlists; see `data/ste-rules.json` `specText`. |
| **STE-1.7** | ❌ Not done | Issue 9 | Do not use a **technical noun as a verb**. | Parser/heuristics for TN vs verb use. |

### STE-2 — Noun Clusters (2.1–2.3)

| Rule | Status | Data source | Proposed implementation | Verification |
|------|--------|-------------|------------------------|--------------|
| **STE-2.1** | ✅ Done | Rule text | `app/lib/analysis/ste21-engine.ts`: maximal run of tokens with POS art/adj/n; run length > 3 → violation (noun cluster too long). | Unit test: 4-word art+adj+n run → STE-2.1; 3-word → none. |
| **STE-2.2** | ❌ Not done | Spec | Clarity of noun clusters. Need spec. | TBD. |
| **STE-2.3** | ❌ Not done | Spec | Noun cluster requirements. Need spec. | TBD. |

### STE-3 — Verbs & Verb Phrases (3.1–3.9)

| Rule | Status | Data source | Proposed implementation | Verification |
|------|--------|-------------|------------------------|--------------|
| **STE-3.2** | ✅ Done | Rule text | `app/lib/analysis/ste32-engine.ts`: detect "be" form (was, were, is, are, etc.) + past participle (-ed or irregular list); one violation per construction. | Unit test: "was opened" → STE-3.2; "Open the valve" → none. |
| **STE-3.1** | ✅ Done (partial) | Dictionary | Same **wrong_form** path as STE-1.5 for headwords with `pos: v`: violations reported as **STE-3.1** (`ste11-engine.ts`). | `scripts/test-ste11-engine.ts` (runned → STE-3.1). |
| **STE-3.3–3.9** | ❌ Not done | Spec | Gerunds, infinitives, etc. | Define from ASD-STE100; implement in order. |

### STE-4 — Procedures (4.1–4.8)

| Rule | Status | Data source | Proposed implementation | Verification |
|------|--------|-------------|------------------------|--------------|
| **STE-4.1** | ✅ Done | Rule text | `app/lib/analysis/ste41-engine.ts`: if sentence contains "should", "must", or "shall" but does not start with a verb → violation (use imperative). | Unit test: "The technician should open" → STE-4.1; "Open the valve" → pass. |
| **STE-4.2** | ✅ Done (partial) | Rule text | `ste42-engine.ts` — fragment starters And/But/Or; contractions → STE-8.4. | `scripts/test-ste42-engine.ts`. |
| **STE-4.5** | ✅ Done (partial) | Rule text | `ste45-engine.ts` — article/demonstrative before noun (imperative + bare noun). | `scripts/test-ste45-engine.ts`. |
| **STE-4.3** | ✅ Done (partial) | Rule text | `ste43-engine.ts` + `sentence-classifier.ts` — dense instructional sentences (word/comma thresholds); skip list-like lines. | `scripts/test-ste43-engine.ts`. |
| **STE-4.4** | ✅ Done (partial) | Rule text | `ste44-engine.ts` — weak sentence openers after another sentence; repeated “The + noun” across consecutive descriptive sentences. | `scripts/test-ste44-engine.ts`. |
| **STE-4.6** | ✅ Done (partial) | Rule text | `ste46-engine.ts` — lead-in + command comma (Issue 9 rule 5.4 style; subordinator + no comma + command verb). | `scripts/test-ste46-48-engine.ts`. |
| **STE-4.7** | ✅ Done (partial) | Rule text | `ste47-engine.ts` — NOTE: lines that read as instructions (Issue 9 rule 5.5 style). | `scripts/test-ste46-48-engine.ts`. |
| **STE-4.8** | ✅ Done (partial) | Heuristic | `ste48-engine.ts` — TBD/TBC / placeholder markers in instructional sentences. | `scripts/test-ste46-48-engine.ts`. |

### STE-5 — Sentence Length (5.1–5.4)

| Rule | Status | Data source | Proposed implementation | Verification |
|------|--------|-------------|------------------------|--------------|
| **STE-5.1** | ✅ Done | Rule text | `app/lib/analysis/ste5-engine.ts`: max 20 words for instructional; type = first word POS "v" → instructional. | Unit test: long sentence with verb first → STE-5.1. |
| **STE-5.2** | ✅ Done | Rule text | Same engine: max 25 words for descriptive; otherwise descriptive. | Unit test: long sentence with non-verb first → STE-5.2. |
| **STE-5.3** | ✅ Done (partial) | Rule text | `ste53-engine.ts`: **You** + modal + verb at sentence start → prefer imperative. | `scripts/test-ste53-engine.ts`. |
| **STE-5.4** | ❌ Not done | Spec | Other length / word-count rules. | Define from spec. |

### STE-6 — Structure (6.1–6.6)

| Rule | Status | Data source | Proposed implementation | Verification |
|------|--------|-------------|------------------------|--------------|
| **STE-6.1** | ✅ Done (partial) | Rule text | `ste61-engine.ts` + `paragraph.ts` (`getParagraphSpans`): very short first sentence (≤3 words) in a multi-sentence paragraph. | `scripts/test-ste61-engine.ts`. |
| **STE-6.2–6.6** | ❌ Not done | Spec | Lists, paragraph length, logical order. | Define from spec. |

### STE-7 — Warnings & Cautions (7.1–7.5)

| Rule | Status | Data source | Proposed implementation | Verification |
|------|--------|-------------|------------------------|--------------|
| **STE-7.1** | ✅ Done | Rule text | `app/lib/analysis/ste71-engine.ts`: sentence that starts with Warning/Caution/Danger (any case) but not exact "WARNING:" → violation. | Unit test: "WARNING: ..." pass; "Warning:" or "Caution:" → STE-7.1. |
| **STE-7.2** | ✅ Done (partial) | Spec | `ste72-engine.ts` — see §1.2. |
| **STE-7.3** | ✅ Done (partial) | Spec | `ste73-engine.ts` — see §1.2. |
| **STE-7.4** | ✅ Done (partial) | Spec | `ste74-engine.ts`: vague hedging in WARNING/CAUTION/DANGER body. | `scripts/test-ste74-75-engine.ts`. |
| **STE-7.5** | ✅ Done (partial) | Spec | `ste75-engine.ts`: reference-only safety line (See Figure n). | `scripts/test-ste74-75-engine.ts`. |

### STE-8 — Punctuation (8.1–8.7)

| Rule | Status | Data source | Proposed implementation | Verification |
|------|--------|-------------|------------------------|--------------|
| **STE-8.1** | ✅ Done | Rule text | `app/lib/analysis/ste81-engine.ts`: for each sentence, scan for `;`; one violation per occurrence (document offsets for highlighting). Wired in analyze route. | Unit test: sentence with ";" → STE-8.1 violation; no ";" → none. |
| **STE-8.2** | ✅ Done | Rule text / heuristic | `app/lib/analysis/ste82-engine.ts`: serial comma — "word, word and/or word" (no comma before and/or) → violation. | Unit test: "red, white and blue" → STE-8.2; "red, white, and blue" → none. |
| **STE-8.3** | ✅ Done | Heuristic | `app/lib/analysis/ste83-engine.ts`: compound numbers 21–99 hyphenated (e.g. twenty-one); "twenty one" → violation. | Unit test: "twenty one" → STE-8.3; "twenty-one" → none. |
| **STE-8.4** | ✅ Done | Heuristic | `app/lib/analysis/ste84-engine.ts`: do not use contractions; flag tokens like don't, it's, can't and suggest full form. | Unit test: "don't" → STE-8.4; "Do not" → none. |
| **STE-8.5** | ✅ Done (partial) | Heuristic | `ste85-engine.ts`: optional **(s)** plural notation `\w+(s)`. | `scripts/test-ste85-93-87-engine.ts`. |
| **STE-8.6** | ✅ Done (partial) | Heuristic | `ste86-engine.ts`: smart/curly quotes (Unicode). | `scripts/test-ste85-93-87-engine.ts`. |
| **STE-8.7** | ✅ Done (partial) | Heuristic | `ste87-engine.ts`: em dash or spaced `--` as break. | `scripts/test-ste85-93-87-engine.ts`. |

### STE-9 — References (9.1–9.4)

| Rule | Status | Data source | Proposed implementation | Verification |
|------|--------|-------------|------------------------|--------------|
| **STE-9.1** | ✅ Done | Rule text + catalog | `app/lib/analysis/ste91-engine.ts`: vague reference "the section/figure/table" without number → suggest exact reference (e.g. "See Section 4"). | Unit test: "the section that..." → STE-9.1; "Section 4" → none. |
| **STE-9.2** | ✅ Done | Heuristic | `app/lib/analysis/ste92-engine.ts`: reference label (section/figure/table) + number should be capitalized (e.g. "Section 4" not "section 4"). | Unit test: "section 4" → STE-9.2; "Section 4" → none. |
| **STE-9.3** | ✅ Done (partial) | Spec | `ste93-engine.ts`: small phrasal verb denylist (carry out, find out, …); skips **make sure**. | `scripts/test-ste85-93-87-engine.ts`. |
| **STE-9.4** | ❌ Not done | Spec | Terminology consistency across document. | Doc-level / memory. |

### STE-10 — Writing Practices (10.1–10.7)

| Rule | Status | Data source | Proposed implementation | Verification |
|------|--------|-------------|------------------------|--------------|
| **STE-10.1** | ❌ Not done | Rule text | Consistency: same term for same concept (e.g. no synonym swap). Requires document-level term list or similarity check. | Same concept, different words → violation. |
| **STE-10.2** | ✅ Done | Heuristic | `app/lib/analysis/ste102-engine.ts`: Latin abbreviations (e.g., i.e., etc., cf., vs., viz.) → suggest full form. | Unit test: "e.g." → STE-10.2; "for example" → none. |
| **STE-10.3** | ✅ Done | Heuristic | `app/lib/analysis/ste10-writing-engine.ts`: & → "and"; % → "percent". | Unit test: "&" / "%" → STE-10.3. |
| **STE-10.4** | ✅ Done | Heuristic | Same engine: British spelling (colour, centre, etc.) → suggest US (color, center) for consistency. | Unit test: "colour" → STE-10.4. |
| **STE-10.5** | — | Doc-level | Terminology consistency: no sentence-level check in engine. | TBD when spec available. |
| **STE-10.6** | ✅ Done | Heuristic | Same engine: ellipsis "..." → suggest rephrase. | Unit test: "..." → STE-10.6. |
| **STE-10.7** | — | Doc-level | Document consistency: no sentence-level check in engine. | TBD when spec available. |

---

## 4. Implementation Order (Recommended)

1. **STE-1.2** — ✅ Done. Reuse dictionary; forbidden words (approved = false) now tagged with ruleId STE-1.2.
2. **STE-1.5** — ✅ Done. Lookup returns allowedForms; engine flags approved headword when token form not in list (STE-1.5).
3. **STE-8.1** — ✅ Done. `runSte81Check(tokenized)`; one violation per semicolon; merged into analyze route.
4. **STE-5.1 / STE-5.2** — ✅ Done. `runSte5Check(tokenized)`; instructional >20 → STE-5.1, descriptive >25 → STE-5.2; sentenceType stored on violation.
5. **STE-3.2** — ✅ Done. `runSte32Check(tokenized)`; be + past participle → STE-3.2.
6. **STE-4.1** — ✅ Done. `runSte41Check(tokenized)`; modal (should/must/shall) without verb-first → STE-4.1.
6b. **STE-4.2** — ✅ Done. `runSte42Check(tokenized)`; And/But/Or sentence fragment → STE-4.2.
6c. **STE-4.5** — ✅ Done. `runSte45Check(tokenized)`; imperative + bare noun → STE-4.5.
7. **STE-7.1** — ✅ Done. `runSte71Check(tokenized)`; wrong warning label format → STE-7.1.
8. **STE-2.1** — ✅ Done. `runSte21Check(tokenized)`; noun cluster (art/adj/n run) > 3 words → STE-2.1.
9. Remaining rules — After obtaining exact text from ASD-STE100 Issue 9, implement in topic order.

---

## 5. How to Wire a New Rule Into the Pipeline

1. **Add an engine** (e.g. `app/lib/analysis/ste21-engine.ts` for STE-2.1) that takes `TokenizedDocument` (and any other inputs) and returns `{ violations: Array<{ ruleId, ruleName, severity, sentenceExcerpt, positionStart, positionEnd, suggestion, ... }> }`.
2. **In `app/api/documents/[id]/analyze/route.ts`:** after `runSte11Check`, call the new engine on the same `tokenized` (and text if needed); append returned violations to the list; create `Violation` rows for each (same schema: ruleId, ruleName, severity, sentenceExcerpt, positionStart, positionEnd, aiSuggestion, etc.).
3. **Compliance score:** either aggregate all violations across rules into one score or keep per-run summary; current code uses a single score from STE-1.1 only — extend to include new violations.
4. **Tests:** add unit tests (e.g. `scripts/test-ste21-engine.ts`) and, if needed, integration tests that call the analyze API with sample text.

---

## 6. References

- **Extended coverage (STE-4 / 6 / 7 / 3, priorities, prerequisites):** `docs/extended-rule-coverage-plan.md`.
- **Dictionary (STE-1.x):** `docs/ASD-STE_Word-xlsx-analysis.md`, `adam_dictionary_spec.md`, `nlp-service/ASD-STE_Word.xlsx`.
- **Tokenizer / pipeline:** `app/lib/analysis/README.md`, `app/lib/analysis/index.ts`, `app/api/documents/[id]/analyze/route.ts`.
- **60 rule catalog:** `data/ste-rules.json`, `adam.md` §3 (topic breakdown).
- **Rule Library:** `GET /api/rules`, `GET /api/rules/[id]`; seed with `npm run seed:rules`.

---

*Document created to verify rule logic and plan implementation of all 60 STE rules; uses ASD-STE_Word.xlsx where the dictionary is the data source.*
