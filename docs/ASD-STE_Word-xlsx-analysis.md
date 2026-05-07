# Deep Analysis: ASD-STE_Word.xlsx

**File:** `nlp-service/ASD-STE_Word.xlsx`  
**Date analyzed:** March 2026  
**Purpose:** Ground truth for implementing the dictionary parser and seed pipeline (thesisplan T1.2, T1.3).

---

## 1. File Overview

| Property | Value |
|----------|--------|
| **Sheets** | `Word` (full detail), `Alternative` (condensed) |
| **Word sheet rows** | 3,029 total (1 header + 2,028 data rows) |
| **Word sheet columns** | 7 (A–G). **Column A is empty.** Data is in B–G. |
| **Headwords** | 2,199 (rows where column B is non-empty) |
| **Continuation rows** | 828 (rows where column B is empty; same headword as previous row) |

The **Alternative** sheet has the same logical content with one fewer column (no separate “Non-STE example” column; combined or omitted). For parsing we use the **Word** sheet only.

---

## 2. Column Layout (Word Sheet)

**Header row is row 2** (row 1 is empty).

| Col | Header in file | Meaning | Example values |
|-----|----------------|---------|----------------|
| A | *(empty)* | Unused | Always empty |
| B | Word (Part of Speech) | Headword + POS; or empty on continuation | `abandon (v)`, `ABSORB (v), ABSORBS, ABSORBED, ABSORBED`, *(empty)* |
| C | bApproved | Approved? (“Yes” / “No”) | `Yes`, `No`, `#VALUE!` on continuation |
| D | Approved meaning | For approved: meaning text. For unapproved: often the alternative word | `Concerned with`, `GO (v)`, `DECREASE (v)` |
| E | ALTERNATIVES | Alternative word(s) or duplicate of D | `GO (v)`, `STOP (v)`, `APPROXIMATELY (adv)` |
| F | STE EXAMPLE | STE-compliant example sentence | `IF THERE IS A FIRE, IMMEDIATELY GO TO A SAFE AREA.` |
| G | Non-STE example | Non-compliant example | `If there is a fire, immediately abandon the area.` |

**Quirk:** Column C header is “bApproved” (likely a typo). Values are `Yes` / `No`. On **continuation rows**, C often contains `#VALUE!` (Excel formula error). Parser must use the **approved** value from the **last row with non-empty B**.

---

## 3. Continuation Rows (Critical)

When **column B is empty**, the row is a **continuation** of the previous headword. It adds:

- Another **meaning** (for approved words), or  
- Another **alternative** (for unapproved words), or  
- Another **example** pair (F/G).

**Examples from the file:**

| Row | B | C | D | E | F | G |
|-----|---|---|---|---|---|---|
| 5 | abandon (v) | No | — | GO (v) | IF THERE IS A FIRE... | If there is a fire... |
| 6 | *(empty)* | #VALUE! | — | STOP (v) | IF THE VALUES ARE INCORRECT... | If the values are incorrect... |

→ **abandon** has two alternatives: GO (v) and STOP (v), each with its own STE / Non-STE example.

| Row | B | C | D | E | F | G |
|-----|---|---|---|---|---|---|
| 14 | ABOUT (prep) | Yes | Concerned with | Concerned with | FOR DATA ABOUT... | — |
| 15 | *(empty)* | #VALUE! | APPROXIMATELY (adv) | APPROXIMATELY (adv) | DRAIN APPROXIMATELY... | Drain about 2 liters... |
| 16 | *(empty)* | #VALUE! | AROUND (prep) | AROUND (prep) | TURN THE SHAFT... | Rotate the shaft about... |

→ **ABOUT** is approved with three meanings: (1) “Concerned with” approved as-is, (2) use APPROXIMATELY (adv), (3) use AROUND (prep).

**Some continuation rows have no D/E/F/G** (e.g. one row for “abnormality” with only `#VALUE!` in C). Parser should skip such rows or attach no extra meaning/alternative.

---

## 4. Verb Conjugations (Column B)

Many verb entries list conjugated forms **in the same cell as the headword**, separated by commas:

| Example (row 28) | Parsed headword | Forms to index |
|------------------|-----------------|----------------|
| `ABSORB (v), ABSORBS, ABSORBED, ABSORBED` | absorb | absorb, absorbs, absorbed |

**Parsing rule:**

1. Take the first segment before the first comma: `ABSORB (v)`.
2. Extract headword and POS: headword = `absorb` (lowercase), pos = `v`.
3. Split the rest by comma; trim and lowercase each token: `absorbs`, `absorbed`, `absorbed`.
4. Build **form index**: each form (including the headword) maps to the headword. So “absorbed” → “absorb” for lookup.

**Special:** “BE (v), IS, WAS, (also ARE, WERE)” — handle parenthetical “(also …)” by adding those forms to the form list.

---

## 5. Approved vs Not Approved

- **C = Yes** (case-insensitive) → word is **approved** (with possible conditional meanings in continuation rows).
- **C = No** → word is **not approved**; alternatives and examples come from D/E and F/G.
- **C = #VALUE!** or empty on continuation → **reuse approved flag from the last headword row**.

---

## 6. Meanings and Alternatives (Columns D and E)

- **Unapproved words:**  
  Alternative word (+ POS) is typically in **D** or **E** (sometimes both same).  
  E.g. “abandon” → D=GO (v), E=GO (v) on first row; D=STOP (v), E=STOP (v) on continuation.  
  Parse as: one alternative per row (D or E, preferring non-empty).

- **Approved words:**  
  D (and sometimes E) carry the **meaning** text.  
  E.g. “ABOUT” → D=“Concerned with”; continuation D=“APPROXIMATELY (adv)” meaning “use APPROXIMATELY instead”.  
  For conditionally approved meanings, parse “WORD (pos)” in D as the alternative when the meaning is not approved as-is.

- **Format “WORD (pos)” in D/E:**  
  Extract word and part of speech for alternatives (e.g. `GO (v)` → word=GO, pos=v).

---

## 7. Examples (F and G)

- **F** = STE-compliant sentence.  
- **G** = Non-STE example (often the “before” version).  
- Either F or G can be missing (e.g. approved words often have only F).  
- Store as pairs: `{ ste_text: F, non_ste_text: G or null }`. One pair per data row (including continuation).

---

## 8. POS Tags

Observed in column B (and inside D/E): `(v)`, `(adj)`, `(n)`, `(adv)`, `(prep)`, `(conj)`, `(pron)`, `(art)`, and special like `(TN)` (e.g. DEFECT (TN)). Normalize to lowercase: `v`, `adj`, `n`, `adv`, `prep`, `conj`, `pron`, `art`, `tn`. Keep `tn` or map to `n` for storage—your choice.

---

## 9. How to Proceed (Implementation)

### Step 1: Parser (T1.2)

Implement **`nlp-service/scripts/parse_ste_dict.py`** that:

1. Opens `ASD-STE_Word.xlsx`, sheet **Word**.
2. Treats **row 2 as header**; **data from row 3**.
3. Iterates rows; tracks “current headword” and “current approved” when B is empty.
4. For each row:
   - **B empty:** treat as continuation; use current headword and approved; append one meaning/alternative and one example (F/G) to the current entry.
   - **B non-empty:** parse headword and POS; parse conjugations if comma present; create new entry; set current headword and approved from C (ignore #VALUE!).
5. Normalize headword to **lowercase** for keys; keep `word_display` from B (original casing).
6. Output:
   - **ste_dictionary.json** — structure per `adam_dictionary_spec.md` §2.1 (one object per headword: word, forms, pos, approved, meanings, alternatives, examples).
   - **ste_forms_index.json** — `{ "form": "headword" }` for every form (including headword and all conjugations).

**Edge cases:**

- Skip or tolerate rows where both D and E are empty and F,G empty (no new meaning/alternative/example).
- Strip `#VALUE!` and empty C; do not treat as “approved”.
- Handle “(also ARE, WERE)” and similar in B by adding those forms to the form index.

### Step 2: Seed (T1.3)

- **scripts/seed-dictionary.ts** (Node/TS): read `ste_dictionary.json` and `ste_forms_index.json`; upsert into `ste_words`, `ste_word_forms`, `ste_meanings`, `ste_examples` (Prisma schema from T1.1). Idempotent (e.g. truncate then insert, or upsert by word).

### Step 3: Validation

- Spot-check in JSON and DB: **abandon** (not approved, alternatives GO, STOP; two example pairs), **about** (approved, three meanings), **absorb** (approved, forms absorbs/absorbed), **utilize** (if present: not approved, alternative use). Compare to spec and to Excel.

---

## 10. Summary Table (Quick Reference)

| Item | Value |
|------|--------|
| Data starts | Row 3 |
| Header row | Row 2 |
| Key column for “new entry” | B non-empty |
| Continuation | B empty; keep previous headword and approved |
| Approved | C = Yes (ignore #VALUE!) |
| Alternatives | D or E, “WORD (pos)” format |
| Examples | F = STE, G = Non-STE |
| Conjugations | In B: “HEAD (pos), FORM1, FORM2, …” |
| Column A | Unused |

---

## 11. ASD-STE_Word.xlsx vs the 60 STE Rules

| Source | Purpose | Used in ADAM |
|--------|---------|--------------|
| **ASD-STE_Word.xlsx** | **Dictionary**: approved word list, parts of speech, alternatives, STE/non-STE examples. | STE-1.1 engine (lookup, suggestions), dictionary API, seed → `ste_dictionary.json` + DB (`ste_words`, etc.). See §1–§10 above. |
| **ASD-STE100 Issue 9** (60 rules) | **Rule catalog**: all 60 STE rule definitions (STE-1.1 through STE-10.7). | Rule Library: `data/ste-rules.json` (generated/expanded from 12 detailed + 48 placeholders), seed → DB `rules` table. See `adam.md` §3 for the topic breakdown. |

The Excel file does **not** contain the 60 rule texts; it only provides the word list that implements **STE-1.1** (and partly STE-1.2). The full 60-rule catalog is sourced from the ASD-STE100 standard; ADAM’s copy is in `data/ste-rules.json` (run `npm run generate:rules` to regenerate, then `npm run seed:rules` to load into the DB).

---

*Analysis produced by script `nlp-service/scripts/analyze_xlsx.py`. Re-run it after any change to the XLSX to refresh stats and samples.*
