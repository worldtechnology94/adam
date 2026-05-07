# ADAM — STE Dictionary Integration Specification
### Understanding the ASD-STE100 Word List & Implementation Logic

---

## 1. What the Dictionary Actually Contains

After full analysis of `ASD-STE_Word.xlsx`, here is the ground truth:

| Metric | Value |
|---|---|
| **Total entries** | 2,199 headwords |
| **Approved words** | 880 |
| **Not-approved (forbidden) words** | 1,319 |
| **Entries with conjugation forms listed** | 245 (verbs only) |
| **Continuation rows (multiple alternatives/meanings)** | 670 |
| **Sheets** | `Word` (full detail) + `Alternative` (condensed) |

### Column Structure (Sheet: Word)

| Column | Field | Description |
|---|---|---|
| B | `Word (Part of Speech)` | Headword + POS tag, e.g. `abandon (v)` or `ABSORB (v), ABSORBS, ABSORBED, ABSORBED` |
| C | `Approved` | `Yes` = approved / `No` = forbidden |
| D | `Approved meaning` | For approved words: the specific meaning(s) for which this word is approved. For unapproved: empty |
| E | `ALTERNATIVES` | For unapproved words: the STE-approved replacement(s) to use instead |
| F | `STE EXAMPLE` | A correctly written STE-compliant sentence demonstrating proper usage |
| G | `Non-STE example` | The same idea written incorrectly — the before state |

### Key Structural Insight: Continuation Rows

Many headwords span **multiple rows**. When column B is blank on a row, it is a continuation of the row above, providing an **additional meaning, alternative, or example**. This is critical to parse correctly.

**Example — `abandon (v)` [NOT approved] has 2 alternatives:**
- Row 1: `abandon (v)` → No → alternative: `GO (v)` → example: "IF THERE IS A FIRE, IMMEDIATELY GO TO A SAFE AREA."
- Row 2: *(blank)* → → alternative: `STOP (v)` → example: "IF THE VALUES ARE INCORRECT, STOP THE TEST PROCEDURE."

**Example — `ABOUT (prep)` [approved] has multiple meanings:**
- Meaning 1: "Concerned with" (primary, approved as-is)
- Meaning 2: Use `APPROXIMATELY (adv)` instead when meaning approximation
- Meaning 3: Use `AROUND (prep)` instead when meaning spatial rotation

This means ABOUT is **conditionally approved** — the meaning matters, not just the word itself. ADAM must handle this nuance.

### POS Tag Inventory

| POS | Symbol | Count |
|---|---|---|
| Verb | `v` | 664 entries |
| Adjective | `adj` | 477 entries |
| Noun | `n` | 452 entries |
| Adverb | `adv` | 215 entries |
| Preposition | `prep` | 78 entries |
| Conjunction | `conj` | 31 entries |
| Pronoun | `pron` | 27 entries |
| Article | `art` | 3 entries |

### Conjugation Forms

245 verb entries explicitly list their conjugated forms in the headword cell:

```
ABSORB (v), ABSORBS, ABSORBED, ABSORBED
ACCEPT (v), ACCEPTS, ACCEPTED, ACCEPTED
ADD (v), ADDS, ADDED, ADDED
BE (v), IS, WAS, (also ARE, WERE)
```

These must be indexed as **aliases** — if a user writes "absorbed", ADAM must look up "absorb".

---

## 2. Data Architecture: How to Store It

### 2.1 Recommended JSON Structure (Runtime)

Parse the XLSX once at build time into a clean JSON dictionary. This is the canonical source of truth loaded into memory on server start.

```json
{
  "abandon": {
    "word": "abandon",
    "word_display": "abandon",
    "forms": ["abandon", "abandons", "abandoned"],
    "pos": "v",
    "approved": false,
    "meanings": [],
    "alternatives": [
      { "word": "GO", "pos": "v", "context": "movement away from danger" },
      { "word": "STOP", "pos": "v", "context": "terminating a procedure" }
    ],
    "examples": [
      {
        "ste": "IF THERE IS A FIRE, IMMEDIATELY GO TO A SAFE AREA.",
        "non_ste": "If there is a fire, immediately abandon the area."
      },
      {
        "ste": "IF THE VALUES ARE INCORRECT, STOP THE TEST PROCEDURE.",
        "non_ste": "If the values are incorrect, abandon the test procedure."
      }
    ]
  },
  "about": {
    "word": "about",
    "word_display": "ABOUT",
    "forms": ["about"],
    "pos": "prep",
    "approved": true,
    "meanings": [
      {
        "meaning": "Concerned with",
        "approved_as_is": true,
        "alternative": null
      },
      {
        "meaning": "Approximately",
        "approved_as_is": false,
        "alternative": { "word": "APPROXIMATELY", "pos": "adv" }
      },
      {
        "meaning": "Spatial rotation or axis",
        "approved_as_is": false,
        "alternative": { "word": "AROUND", "pos": "prep" }
      }
    ],
    "examples": [...]
  }
}
```

### 2.2 Two Lookup Indexes (Built at Load Time)

**Index 1 — Headword Lookup** (primary): `{ "abandon": <entry> }`

**Index 2 — Form-to-Headword Map** (for conjugations): 
```json
{
  "absorbs": "absorb",
  "absorbed": "absorb",
  "is": "be",
  "was": "be",
  "are": "be",
  "were": "be",
  "adds": "add"
}
```

This allows the engine to normalize any word form to its dictionary headword before lookup.

### 2.3 Database Schema (PostgreSQL — for persistence & team features)

```sql
-- Core dictionary table
CREATE TABLE ste_words (
  id           SERIAL PRIMARY KEY,
  word         TEXT NOT NULL,         -- normalized lowercase headword
  word_display TEXT,                  -- original casing from dict
  pos          TEXT,                  -- v, adj, n, adv, prep, conj, pron, art
  approved     BOOLEAN NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- Word forms / conjugations
CREATE TABLE ste_word_forms (
  id       SERIAL PRIMARY KEY,
  word_id  INT REFERENCES ste_words(id),
  form     TEXT NOT NULL              -- lowercase conjugated form
);
CREATE INDEX idx_form ON ste_word_forms(form);

-- Approved meanings
CREATE TABLE ste_meanings (
  id               SERIAL PRIMARY KEY,
  word_id          INT REFERENCES ste_words(id),
  meaning          TEXT,
  approved_as_is   BOOLEAN DEFAULT TRUE,
  alternative_word TEXT,
  alternative_pos  TEXT
);

-- Examples
CREATE TABLE ste_examples (
  id          SERIAL PRIMARY KEY,
  word_id     INT REFERENCES ste_words(id),
  ste_text    TEXT,
  non_ste_text TEXT
);

-- Custom org word lists (user-defined approved technical terms)
CREATE TABLE custom_words (
  id          SERIAL PRIMARY KEY,
  org_id      INT,
  word        TEXT NOT NULL,
  pos         TEXT,
  approved    BOOLEAN DEFAULT TRUE,
  note        TEXT
);
```

---

## 3. The Core STE-1.1 Rule Engine Logic

STE Rule 1.1 is the most violated rule (141 violations in the screenshot). It states: **use only approved words in their approved part of speech.** Here is the complete logic tree ADAM must implement:

### 3.1 Word-Level Check Algorithm

```
FOR EACH token in sentence:

  1. NORMALIZE
     - Lowercase the token
     - Strip punctuation
     - Lemmatize using NLP (e.g. spaCy) to get base form
     - Also check form-to-headword map for irregular forms (was → be)

  2. LOOKUP in dictionary
     - If NOT found in dictionary:
         → Flag as VIOLATION (unknown word — possibly unapproved technical term)
         → Severity: MINOR if likely a proper noun/technical name
         → Severity: MAJOR otherwise
         → Suggestion: "Add to custom approved word list if this is a domain term"

     - If found AND approved = FALSE:
         → Flag as VIOLATION (forbidden word)
         → Show alternatives from the alternatives array
         → Provide the matching non-STE/STE example pair
         → Severity: MAJOR

     - If found AND approved = TRUE:
         → Check PART OF SPEECH used in context (via NLP POS tagger)
         → If POS in document MATCHES POS in dictionary → PASS ✅
         → If POS DOES NOT MATCH → Flag as VIOLATION (wrong part of speech)
           Example: using COMPLETE as an adjective when only approved as a verb
         → Severity: MAJOR

  3. FOR CONDITIONALLY APPROVED WORDS (multiple meanings, some with alternatives)
     - Parse context to determine which meaning applies
     - If the applicable meaning has approved_as_is = false:
         → Flag as CONTEXTUAL WARNING
         → Suggest the correct alternative
         → Show the relevant STE example
         → Severity: MINOR (context-dependent)

  4. SKIP:
     - Proper nouns (detected by NLP NER — Named Entity Recognition)
     - Numbers and units
     - Words inside quotation marks (quoted material)
     - Words on the project's custom approved word list
```

### 3.2 Part-of-Speech Conflict Examples

This is subtle but important. The dictionary approves words **only in specific POS roles**:

| Word | Approved As | NOT Approved As | Why It Matters |
|---|---|---|---|
| `COMPLETE` | verb | adjective | "a complete inspection" is wrong — use "a FULL inspection" |
| `ABOUT` | prep (meaning "concerning") | prep (meaning "approximately") | Context-dependent |
| `GOOD` | Not in dict | — | Forbidden; use SATISFACTORY (adj) |
| `RUN` | verb | noun | "do a test run" is wrong; use "do a test" |

The NLP engine must tag each token's POS in context, not just in isolation.

### 3.3 Handling Conjugated Verbs

The NLP engine lemmatizes all verbs before lookup:

```
"absorbed" → lemmatize → "absorb" → lookup "absorb" → approved ✅
"abandoning" → lemmatize → "abandon" → lookup "abandon" → NOT approved ❌ → suggest GO/STOP
"was installed" → passive voice → separate rule (STE-3.x) + "was" → "be" → approved ✅
```

---

## 4. Integration Architecture in ADAM

### 4.1 Processing Pipeline

```
INPUT TEXT
    │
    ▼
[1] TOKENIZER
    Split into sentences → classify as Instructional or Descriptive
    │
    ▼
[2] NLP ENGINE (spaCy en_core_web_sm or trf)
    - Tokenize sentence into words
    - POS tag each token
    - NER (mark proper nouns, avoid false positives)
    - Dependency parse (for noun cluster detection - STE-2.x)
    - Lemmatize all tokens
    │
    ▼
[3] WORD LOOKUP SERVICE
    For each token:
    - Normalize + lemmatize
    - Check form-to-headword map
    - Look up in STE dictionary
    - Run through 4-step algorithm above
    - Merge with custom org word list
    │
    ▼
[4] VIOLATION COLLECTOR
    Aggregate all violations per sentence:
    - {token, position, rule, severity, suggestion, example}
    │
    ▼
[5] VIOLATION DEDUPLICATOR
    If the same word appears 3 times in a document, 
    report 3 separate violations (with positions) 
    but aggregate in the Rule Summary (count: 3)
    │
    ▼
[6] REPORT BUILDER
    Build the full violation report object
    Feed into Dashboard, Violation Log, and AI Assistant context
```

### 4.2 Custom Word Lists (Per Organisation)

Technical writers use domain-specific terminology (part numbers, system names, proprietary terms) that won't be in the STE dictionary. ADAM must handle this:

- **Admin** can add custom approved words per project/org
- Custom words are stored in `custom_words` table and merged with the STE dictionary at lookup time
- Custom words can be assigned a POS to enable POS checking
- Imported as CSV (word, POS, note)
- Example entries: `"APU" (n)`, `"FADEC" (n)`, `"LEAP-1A" (n)`

---

## 5. AI Assistant Enhancement (Ask ADAM)

The Claude API integration for Ask ADAM should be injected with the dictionary context in its system prompt:

```
SYSTEM PROMPT INJECTION:
You have access to the ASD-STE100 approved word list.
When a user submits a sentence for correction:
1. Identify every non-STE word
2. For each: look up its approved alternative(s) from the dictionary
3. Rewrite the sentence using ONLY approved words in their approved POS
4. If a word is contextually approved (multiple meanings), explain which 
   meaning is valid and which requires substitution
5. Always cite the rule number (STE-1.1) in your response
6. Show the original vs corrected sentence as a diff
```

The dictionary JSON is **passed as part of the tool context** or embedded as a retrieval corpus for the AI assistant, allowing it to give accurate, citation-backed corrections rather than hallucinating replacements.

---

## 6. Edge Cases & Gotchas

These are the tricky situations the engine must handle correctly:

| Edge Case | Handling Strategy |
|---|---|
| **Conditionally approved words** (ABOUT, ABOVE) | Flag only when used in the non-approved meaning; requires semantic context |
| **Technical Names (TN)** — e.g., `DEFECT (TN)` in alternatives | TNs are special category — approved only as exact technical terms, not paraphrased |
| **Multi-word alternatives** | Some alternatives are phrases, not single words: "MORE THAN", "AFT OF", "IN ORDER TO" — must detect as a unit |
| **Irregular verbs** | `BE → IS/WAS/ARE/WERE` must be mapped; these appear in the conjugation list |
| **Hyphenated compounds** | `de-ice`, `anti-icing` — treat as single token for lookup |
| **ALL CAPS in source text** | Some STE documents are fully capitalized; normalize before lookup |
| **Numbers inside words** | `S1000D`, `737` — skip numeric tokens entirely |
| **Abbreviations** | `AMM`, `LRU` — skip if on custom approved list |
| **Gerunds as nouns** | `testing (n)` vs `testing (v-gerund)` — different STE rules apply (STE-3.5 for gerunds) |
| **Passive voice** | `was installed` — the word "installed" is approved; the construction is a separate STE-3.x violation |

---

## 7. Build & Deployment Steps

### Step 1 — Parse the XLSX at Build Time

```python
# parse_ste_dict.py — run once, output ste_dictionary.json
import pandas as pd, re, json

df = pd.read_excel('ASD-STE_Word.xlsx', sheet_name='Word', header=None)
# ... (parsing logic as described above)
# Output: ste_dictionary.json + ste_forms_index.json
```

### Step 2 — Load into Memory on Server Start

```javascript
// dictionary.service.js
const dict = require('./ste_dictionary.json');
const formsIndex = require('./ste_forms_index.json');

function lookupWord(token) {
  const normalized = token.toLowerCase().replace(/[^a-z-]/g, '');
  const headword = formsIndex[normalized] || normalized;
  return dict[headword] || null;
}
```

### Step 3 — Expose as Internal API

```
GET /api/dictionary/lookup?word=abandon
→ { approved: false, alternatives: ["GO (v)", "STOP (v)"], examples: [...] }

GET /api/dictionary/search?q=stop&pos=v
→ [ array of matching entries ]

POST /api/dictionary/custom
→ Add custom word to org word list
```

### Step 4 — Database Seed

On first deployment, seed PostgreSQL from the JSON:

```bash
node scripts/seed-dictionary.js
# Inserts 2,199 base entries + 245 conjugation forms + form index
```

---

## 8. Summary: What Makes This Hard (and What ADAM Does Right)

The STE dictionary is deceptively simple on the surface but requires sophisticated handling:

1. **It is not a binary banned-word list.** Words like ABOUT are approved in one context and require substitution in another. The engine must understand context, not just presence.

2. **Part of speech is a first-class constraint.** Using an approved word in the wrong grammatical role is still a violation. The NLP layer is non-negotiable.

3. **Multi-row entries must be reconstructed correctly.** 670 continuation rows mean the parser must track state across rows to build complete entries.

4. **Conjugations must be normalized.** A user writing "was absorbed" must trigger a lookup of "absorb", not a false "unknown word" error.

5. **Custom technical terms are essential for real-world use.** Without domain word lists, ADAM would flag every part number and system acronym as a violation — rendering it useless for actual aerospace documentation.

When all of this is implemented correctly, STE-1.1 checking in ADAM becomes a genuinely intelligent tool — not a dumb grep — and the 141-violation score seen in the dashboard becomes a number writers can trust and act on.

---

*ADAM Dictionary Integration Spec — v1.0 — March 2026*
