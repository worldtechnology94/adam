# Thesis roadmap: evaluation science + error taxonomy (ADAM)

This document freezes **what we need to do** for the Master’s thesis: **primary** (evaluation protocol + taxonomy) and **secondary** (one measured mitigation). It aligns with the ADAM codebase as the **instrument under study**, not only as a product.

---

## 1. Thesis positioning

### 1.1 Primary contribution (the core)

**Anchor the thesis on evaluation science + error taxonomy.**

| Piece | What it means |
|-------|----------------|
| **Reproducible evaluation protocol** | Anyone can repeat the study with the same corpus version, same ADAM build, same annotation guidelines. |
| **Frozen corpus** | Fixed PDFs/text + version hash + extraction settings; no silent drift between runs. |
| **Double annotation + adjudication** | Two independent raters; disagreements resolved by a third pass (adjudication) → **gold standard**. |
| **Sentence-aligned metrics** | Human labels and ADAM outputs aligned **per sentence** (or agreed unit), not only document-level scores. |
| **P / R / F1 per rule family** | Map ADAM `ruleId`s to **families** (Words, Verbs, Procedures, Punctuation, Safety, Writing, …) and report metrics **per family** + micro-average. |
| **Systematic disagreement taxonomy** | Every mismatch between gold and ADAM gets **one** category (see §4) — this is a **scientific** output, not bug triage only. |

**Why this is academic:** ASD-STE100 is a **human** standard; automated checkers need **measurement**, not only features. There is **no standard public STE benchmark**; your **protocol + small gold set + analysis** is a defensible contribution.

### 1.2 Secondary contribution (smaller, evidence-driven)

**One concrete mitigation** motivated by the taxonomy, evaluated on the **same gold set**:

- Examples: **TOC / dot-leader line detection**, **skip or downgrade** certain rules on those lines, or **simple zone tags** (cover / TOC / procedure).
- **Requirement:** **Before/after** tables on the **identical corpus** (same sentences, same gold labels) — only the ADAM policy or preprocessing changes.

This proves the evaluation **drives** engineering, not the reverse.

---

## 2. What we need to deliver (artifacts)

### 2.1 Documentation (repo)

| Artifact | Purpose |
|----------|---------|
| `docs/evaluation-protocol.md` | Inclusion/exclusion for corpus; annotation instructions; rule→family mapping; ethical note on raters. |
| `data/gold-corpus/README.md` | What files are included, licenses, how to cite, **no** redistribution if restricted. |
| **`docs/reccom.md`** (this file) | High-level roadmap and checklist. |

### 2.2 Data (frozen)

| Item | Notes |
|------|--------|
| **Source PDFs** | e.g. public FAA-style handbook excerpt + controlled synthetic PDF from `perfectmanul.md` body. |
| **`manifest.json`** per corpus version | File names, SHA-256, date, ADAM git commit, dictionary/seed version. |
| **Sentence export** | `doc_id`, `sentence_id`, `text` (stable indices from the same tokenizer as analyze). |
| **Rater sheets** | Rater1 / Rater2 columns; **adjudicated** gold column. |
| **ADAM export** | Violations with `sentence_id` (or mappable offsets), `ruleId`, severity, run id. |

### 2.3 Scripts (minimal viable)

| Script | Role |
|--------|------|
| `scripts/export-sentences-for-annotation.ts` (or `.js`) | PDF/DB → `sentences.csv` + manifest. |
| `scripts/compare-adam-to-gold.ts` | Load gold + ADAM predictions → P/R/F1, confusion tables, optional κ script. |
| `data/gold-corpus/rule-family-map.json` | Maps `STE-x.y` → family string for aggregation. |

*(Names can match your repo conventions; the important part is having **one** alignment and **one** scoring path.)*

---

## 3. Corpus: what to include (~20–50 pages)

| Segment | Approx. pages | Role |
|---------|----------------|------|
| Public **maintenance handbook** PDF (e.g. FAA-style) | 15–25 | Real layout, TOC, noise — **ecological validity**. |
| **Synthetic** STE-style manual (`perfectmanul` body → PDF) | 5–15 | **Positive control** — fewer confounders. |
| Optional: short **non-manual** excerpt | 2–5 | **Domain shift** discussion (optional chapter). |

**Total:** 20–50 pages is sufficient if the **protocol** and **taxonomy** are rigorous.

---

## 4. Disagreement taxonomy (codes for thesis tables)

Assign **one** code per analyzed mismatch (gold vs ADAM):

| Code | Label | Meaning |
|------|--------|---------|
| **E1** | Miss | Gold = issue, ADAM = no flag (false negative). |
| **E2** | False alarm | Gold = no issue, ADAM = flag (false positive). |
| **E3** | Family mismatch | Both agree “issue” but **rule family** differs. |
| **E4** | PDF / layout artifact | TOC leaders, headers, broken tokens, column splits. |
| **E5** | POS / heuristic | Wrong part-of-speech or surface heuristic (e.g. THIS, MANUAL in titles). |
| **E6** | Ambiguity / borderline | Raters uncertain; legitimate STE debate (e.g. technical name). |

Use these counts to **justify** the secondary mitigation (e.g. if **E4** is large → TOC handling).

---

## 5. Annotation protocol (human side)

1. **Unit:** Start with **sentence-level** labels (same units as exported `sentence_id`).
2. **Raters:** Two **independent** annotators (can be peers + supervisor guidelines).
3. **Fields (minimum):**  
   - Issue? (Y / N / unclear)  
   - Family (coarse enum aligned with `rule-family-map.json`)  
   - Optional short note.
4. **Adjudication:** Resolve **disagreements** → **gold** column.
5. **Agreement:** Report **Cohen’s κ** (or Fleiss if >2) on **issue Y/N** and optionally on **family**.

---

## 6. Metrics (ADAM vs gold)

- **Sentence-level detection:** Gold “any STE issue” vs ADAM “any violation on sentence” → one P/R/F1 row (summary).
- **Family-level:** For each family, treat gold vs ADAM **per sentence** (e.g. gold says Words-issue; ADAM flags STE-1.1 on that sentence) — define **matching rules** in the protocol (exact family vs partial credit — **pick one** and stick to it).
- **Micro-average** over families for a single headline F1.

Document **limitations:** sentence-level vs span-level; multiple violations per sentence; expert STE vs tool approximation.

---

## 7. Secondary mitigation (after first evaluation pass)

1. Run **taxonomy** → pick **one** dominant, fixable class (often **E4** for PDFs).
2. Implement **minimal** change: e.g. mark TOC lines, skip STE-10.6 / downgrade STE-8.x on those lines only.
3. Re-run **same** `export` + **same** gold labels → new ADAM export → **compare script** again.
4. Thesis **table:** before vs after (overall F1, E2 rate, E4 rate).

Do **not** change gold labels between runs.

---

## 8. Timeline (example for one semester)

| Phase | Weeks | Deliverables |
|-------|-------|----------------|
| **A** Corpus + export | 1–2 | Frozen PDFs, manifest, `sentences.csv` for all docs. |
| **B** Annotation | 3–4 | Rater1 + Rater2 complete. |
| **C** Adjudication + gold lock | 5 | Single `gold.csv` with adjudicated columns. |
| **D** ADAM run + compare | 6 | Metrics tables, κ, per-family P/R/F1. |
| **E** Taxonomy coding | 6–7 | Full E1–E6 assignment for mismatches. |
| **F** Mitigation + re-run | 7–8 | Before/after on same gold. |
| **G** Writing | 8+ | Chapters 3–5, figures, limitations, future work. |

Adjust to your academic calendar.

---

## 9. Checklist (copy into issues / planner)

### Corpus & reproducibility
- [ ] Select and download public PDF(s); verify license / citation.
- [ ] Build synthetic PDF from `perfectmanul.md` (body only for clean control).
- [ ] Write `manifest.json` (hashes, ADAM version, date).
- [ ] Implement or run **sentence export** with stable `sentence_id`.

### Annotation
- [ ] Write **annotation guidelines** (1–2 pages) with examples.
- [ ] Create rater spreadsheet or Label Studio project.
- [ ] Complete **rater 1** and **rater 2**.
- [ ] **Adjudicate** disagreements; freeze **gold** file.

### Evaluation
- [ ] Maintain `rule-family-map.json` from `data/ste-rules.json`.
- [ ] Run ADAM analyze on frozen corpus; export violations with **sentence alignment**.
- [ ] Run **compare** script; compute P/R/F1, κ.
- [ ] Code all mismatches into **E1–E6** taxonomy.

### Secondary contribution
- [ ] Choose mitigation from taxonomy (likely E4/E5).
- [ ] Implement; re-run metrics **without** changing gold.
- [ ] Document before/after in thesis + `evaluation-protocol.md`.

### Thesis writing
- [ ] Methods: corpus, annotators, κ, alignment, metrics definitions.
- [ ] Results: tables + examples (anonymized excerpts).
- [ ] Discussion: limits, ethics, generalization, future work (zones ML optional).

---

## 10. What success looks like

- A **defensible** thesis chapter: “We **evaluated** an ASD-STE100-oriented checker against **human judgments** with **reproducible** steps.”
- **Quantitative** results (κ, F1, taxonomy counts) + **qualitative** examples.
- A **small** engineering change with **measured** impact — not scope creep.

---

## 11. Related files in this repo

- `docs/perfectmanul.md` — synthetic benchmark manual text (control condition).
- `docs/golden-ste-manual-sample.md` — shorter gold-style sample.
- `docs/extended-rule-coverage-plan.md` — rule implementation landscape (background).
- `data/ste-rules.json` — rule IDs for family mapping.

---

*Last updated: aligned with thesis recommendation — evaluation science + error taxonomy (primary), TOC/zone mitigation with before/after (secondary).*
