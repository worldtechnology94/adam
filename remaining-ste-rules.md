# ADAM — Remaining STE Rules: Implementation Guide

**Status:** 57 of 60 STE rules implemented. This document covers the 3 remaining rules.\
**Author context:** This is a thesis project. Every rule here needs a production-quality engine that follows the exact same patterns already established in `app/lib/analysis/`.

**Correction from earlier scan:** STE-1.2, STE-1.5, and STE-3.1 are NOT missing engines — they are emitted by `ste11-engine.ts` using different `ruleId` values. The true gaps are STE-5.4, STE-10.5, and STE-10.7.

---

## Implementation Progress

| Topic | Total Rules | Implemented | Gap |
|-------|-------------|-------------|-----|
| 1 — Words | 7 (1.1–1.7) | 7 | — |
| 2 — Noun Clusters | 3 (2.1–2.3) | 3 | — |
| 3 — Verbs & Verb Phrases | 9 (3.1–3.9) | 9 | — |
| 4 — Procedures | 8 (4.1–4.8) | 8 | — |
| 5 — Sentence Length | 4 (5.1–5.4) | 3 | **5.4** |
| 6 — Structure | 6 (6.1–6.6) | 6 | — |
| 7 — Warnings & Cautions | 5 (7.1–7.5) | 5 | — |
| 8 — Punctuation | 7 (8.1–8.7) | 7 | — |
| 9 — References | 4 (9.1–9.4) | 4 | — |
| 10 — Writing Practices | 7 (10.1–10.7) | 5 | **10.5, 10.7** |
| **Total** | **60** | **57** | **3** |

**Notes on Topic 1 and 3:**
- STE-1.2 (prohibited words) is emitted by `ste11-engine.ts` when `approved = false`
- STE-1.5 (wrong word form) is emitted by `ste11-engine.ts` when token is not in `allowedForms`
- STE-3.1 (wrong verb form) is emitted by `ste11-engine.ts` for headwords with `pos: v` + wrong form

---

## Codebase Conventions (read this before coding anything)

### Violation shape — all engines share this

```ts
interface SteXxViolation {
  sentenceIndex:    number;          // 0-based index in doc.sentences
  sentenceExcerpt:  string;          // sentence.text
  tokenRaw:         string;          // original token(s) that triggered the violation
  tokenNormalized:  string;          // normalized/lowercase version
  positionStart:    number;          // sentence.offsetInDocument.start + token.offsetInSentence.start
  positionEnd:      number;          // sentence.offsetInDocument.start + token.offsetInSentence.end
  ruleId:           string;          // e.g. "STE-5.4"
  ruleName:         string;          // human-readable rule name
  severity:         "critical" | "major" | "minor";
  reason:           string;          // machine code (snake_case)
  suggestion:       string;          // human-readable fix
  wordCount:        number;          // sentence.tokens.filter(t => t.isWord).length
}
```

### Engine function signature

```ts
// Synchronous (no dictionary needed)
export function runSteXxCheck(doc: TokenizedDocument): SteXxEngineResult
```

### Offset pattern (critical — always use this)

```ts
const docStart = sentence.offsetInDocument.start;
const positionStart = docStart + token.offsetInSentence.start;
const positionEnd   = docStart + token.offsetInSentence.end;
```

### After creating each engine, register it in two places

1. `app/lib/analysis/index.ts`:
```ts
export { runSteXxCheck } from "./steXx-engine";
export type { SteXxViolation, SteXxEngineResult } from "./steXx-engine";
```

2. `app/api/documents/[id]/analyze/route.ts`: import, call, and spread into `allViolations`.

---

## Implementation Order

1. STE-5.4 — One instruction per sentence (straightforward token scan)
2. STE-10.5 — Terminology consistency (document-level, similar to STE-10.1)
3. STE-10.7 — Document consistency: number and unit formatting (document-level regex scan)

---

---

## STE-5.4 — One Instruction per Sentence

**Engine file:** `app/lib/analysis/ste54-engine.ts`\
**Type:** Synchronous\
**Severity:** `major`

### Rule (ASD-STE100 Issue 9)

Write only one instruction per sentence. Do not combine two instructions using "and" or "or". A reader following a procedure must be able to execute each step without re-reading it to find the next action.

- **Non-STE:** "Open the valve and check the pressure gauge."
- **STE:** "Open the valve. Check the pressure gauge."
- **Non-STE:** "Tighten the bolt and torque to 25 Nm."
- **STE:** "Tighten the bolt. Apply a torque of 25 Nm."
- **Allowed:** "Open the valve and bleed the system." (procedural sequence that cannot logically be split)
  — NOTE: This is still a violation; the engine flags it and the writer decides.

### What is NOT a violation

- Descriptive sentences: "The system monitors pressure and temperature." → not an instruction, skip.
- Coordinated nouns, not verbs: "Remove the nut and bolt." → "bolt" is a noun here, not a second verb → skip.
- Sentences where the second word after "and/or" is NOT a verb: no flag.

### Algorithm

```
for each sentence in doc.sentences:
  words = sentence.tokens.filter(t => t.isWord)
  if words.length < 3: continue

  // Only check instructional sentences (imperative — first word is a verb)
  firstWord = words[0]
  if firstWord.posHeuristic !== "v": continue

  // Scan for "and" or "or" followed by a second imperative verb
  for i = 1 to words.length - 2:
    norm = words[i].normalized.toLowerCase()
    if norm !== "and" && norm !== "or": continue

    // Next word (skipping articles: a, an, the)
    j = i + 1
    if j < words.length && ["a", "an", "the"].includes(words[j].normalized.toLowerCase()):
      j++
    if j >= words.length: continue

    secondVerb = words[j]
    if secondVerb.posHeuristic === "v":
      // Two verbs joined by and/or in an instructional sentence
      emit major violation at words[i] (the "and"/"or" connector)
      break  // one violation per sentence
```

### Test cases

```
FAIL: "Open the valve and check the pressure gauge."      → "and" joins two imperative verbs
FAIL: "Remove the cover or use the access panel."         → "or" joins two imperative verbs
FAIL: "Tighten the bolt and torque to 25 Nm."            → two instructions
PASS: "Remove the nut and bolt."                          → "bolt" is noun, not second verb
PASS: "The system opens and closes the valve."            → descriptive (not imperative)
PASS: "Open the valve."                                   → single instruction
PASS: "Connect the red and blue wires."                   → "blue" is adjective, not verb
```

### Violation fields

```
ruleId:     "STE-5.4"
ruleName:   "Multiple instructions per sentence"
reason:     "multiple_instructions_per_sentence"
severity:   "major"
suggestion: "Write only one instruction per sentence. Split '[sentence]' at '[connector]' 
             into two separate steps."
```

---

## STE-10.5 — Terminology Consistency

**Engine file:** `app/lib/analysis/ste105-engine.ts`\
**Type:** Synchronous (document-level)\
**Severity:** `minor`

### Rule (ASD-STE100 Issue 9)

Use the same technical term for the same part, system, or concept throughout the document. Do not use different spellings, capitalizations, or forms of the same technical term.

This rule complements STE-10.1 (which tracks synonyms from a curated word cluster list). STE-10.5 focuses on **technical names and proper nouns** — multi-word terms, part names, and system names that appear in the document itself.

- **Non-STE:** "the Main Landing Gear Door… the main landing-gear door… the MLG door" (three forms)
- **STE:** Pick one form and use it throughout.

### What to track

Track every **capitalised noun phrase** (Title Case or ALL CAPS) that appears two or more times in the document. When the same base term appears in different surface forms (different capitalisation, hyphenation, or abbreviation pattern), flag the inconsistency.

A "base term" is identified by normalizing: lowercase + remove hyphens + collapse spaces.

### Algorithm

```ts
// Pass 1: collect all capitalised multi-word noun phrases and single Title-Case nouns
// A token qualifies as a TN candidate if:
//   - token.isWord AND
//   - token.raw starts with an uppercase letter AND
//   - it is NOT the first word of its sentence (to exclude sentence-initial caps)
//   OR it is ALL CAPS (acronym/initialism, 2-8 chars)

const ACRONYM_RE = /^[A-Z]{2,8}\d*$/;
const TITLE_RE   = /^[A-Z][a-z]{2,}/;

type TermRecord = { rawForm: string; sentenceIndex: number; positionStart: number; positionEnd: number };
const termMap = new Map<string, TermRecord>();  // normalizedKey → first seen
const violations: Ste105Violation[] = [];

for each sentence:
  words = sentence.tokens.filter(t => t.isWord)
  for i = 0 to words.length - 1:
    token = words[i]
    raw   = token.raw

    // Only track capitalized or ALL-CAPS tokens
    if not (ACRONYM_RE.test(raw) || (TITLE_RE.test(raw) && i > 0)): continue

    // Build a normalised key: lowercase, no hyphens, no spaces
    normKey = raw.toLowerCase().replace(/-/g, "").replace(/\s+/g, "")

    if normKey.length < 3: continue  // skip very short tokens

    if !termMap.has(normKey):
      termMap.set(normKey, { rawForm: raw, sentenceIndex: sentence.index, ... })
    else:
      firstSeen = termMap.get(normKey)!
      if firstSeen.rawForm !== raw:
        // Same concept, different surface form → flag
        emit minor violation at current token
```

### Test cases

```
FAIL: "Install the Main Landing Gear Door." then "Check the main landing-gear door." 
      → "main landing-gear door" vs "Main Landing Gear Door" → flag
FAIL: "Remove the LRU." then "Remove the lru." → case inconsistency → flag
PASS: "Install the Main Landing Gear Door." then "Check the Main Landing Gear Door."
      → consistent → no violation
PASS: Two different capitalized terms that don't share a normalized key → no violation
```

### Violation fields

```
ruleId:     "STE-10.5"
ruleName:   "Terminology consistency"
reason:     "inconsistent_technical_term_form"
severity:   "minor"
suggestion: "Use the same form of this technical term throughout the document. 
             It was first written as '[firstSeen.rawForm]'. 
             Change '[token.raw]' to '[firstSeen.rawForm]'."
```

---

## STE-10.7 — Document Consistency (Numbers and Units)

**Engine file:** `app/lib/analysis/ste107-engine.ts`\
**Type:** Synchronous (document-level)\
**Severity:** `minor`

### Rule (ASD-STE100 Issue 9)

Use a consistent format for numbers and units throughout the document. Do not mix digit formats (e.g. "1,000" and "1000") or unit notations (e.g. "mm" and "millimetres") in the same document.

### What to detect

**Check 1: Inconsistent number separators**
If the document uses comma-grouped numbers (`1,000`) in some places and bare numbers (`1000`) in others, flag the minority form. Detect via regex on `sentence.text`.

**Check 2: Inconsistent unit spelling**
The same physical unit appears both as an abbreviation and spelled out in full, e.g. "mm" vs "millimetres" / "millimeters". Track unit variants seen. Flag the second form when a different variant was already seen.

**Check 3: Inconsistent percentage notation**
The document uses both "%" (which STE-10.3 already flags individually) and "percent". STE-10.3 already catches individual "%" uses. STE-10.7 catches the mix: if "percent" (spelled out) appears and also a `%` appears, flag the minority.

### Unit variant pairs to track

```ts
const UNIT_PAIRS: [string, string[]][] = [
  // [canonical, [variants to track]]
  ["mm",    ["mm", "millimetre", "millimeter", "millimetres", "millimeters"]],
  ["cm",    ["cm", "centimetre", "centimeter", "centimetres", "centimeters"]],
  ["m",     ["m",  "metre", "meter", "metres", "meters"]],
  ["km",    ["km", "kilometre", "kilometer", "kilometres", "kilometers"]],
  ["kg",    ["kg", "kilogram", "kilograms"]],
  ["g",     ["g",  "gram", "grams"]],
  ["l",     ["l",  "litre", "liter", "litres", "liters"]],
  ["ml",    ["ml", "millilitre", "milliliter", "millilitres", "milliliters"]],
  ["nm",    ["nm", "Newton meter", "Newton metre", "Nm"]],
  ["psi",   ["psi", "pounds per square inch"]],
  ["rpm",   ["rpm", "RPM", "revolutions per minute"]],
];
```

### Algorithm

```ts
// Build unit → group map
const unitToGroup = new Map<string, string>();  // unit_normalized → groupKey
for (const [canonical, variants] of UNIT_PAIRS) {
  for (const v of variants) {
    unitToGroup.set(v.toLowerCase(), canonical);
  }
}

// Pass 1: scan document and record first-seen unit form per group
const groupFirstForm = new Map<string, { raw: string; sentenceIndex: number; positionStart: number }>();

for each sentence:
  text = sentence.text
  // Regex: number + optional space + unit word
  const UNIT_RE = /\b(\d[\d.,]*)\s*([A-Za-z]+)\b/g;
  while match = UNIT_RE.exec(text):
    unitRaw  = match[2]
    unitNorm = unitRaw.toLowerCase()
    groupKey = unitToGroup.get(unitNorm)
    if !groupKey: continue

    posStart = sentence.offsetInDocument.start + match.index + match[0].length - unitRaw.length
    posEnd   = posStart + unitRaw.length

    if !groupFirstForm.has(groupKey):
      groupFirstForm.set(groupKey, { raw: unitRaw, sentenceIndex: sentence.index, positionStart: posStart, ... })
    else:
      first = groupFirstForm.get(groupKey)!
      if first.raw !== unitRaw:
        // Different form of same unit → flag
        emit minor violation at current match
```

### Test cases

```
FAIL: "Tighten to 25 Nm." then "Apply 30 Newton metres torque."
      → "Nm" vs "Newton metres" → flag second occurrence
FAIL: "Set gap to 1,000 mm." then "The distance is 2500 mm."
      → mixed comma-group vs bare number (unit same, number format differs)
PASS: "Tighten to 25 Nm." then "Apply 30 Nm." → consistent → no violation
PASS: "Set gap to 1,000 mm." then "The distance is 2,500 mm." → consistent formatting
```

### Violation fields

```
ruleId:     "STE-10.7"
ruleName:   "Document consistency"
reason:     "inconsistent_unit_notation"
severity:   "minor"
suggestion: "Use the same unit notation throughout. This document uses '[first.raw]' elsewhere. 
             Change '[current]' to '[first.raw]'."
```

---

## Summary Table

| Rule | Engine File | Type | Severity | Status |
|------|-------------|------|----------|--------|
| STE-5.4  | `ste54-engine.ts`  | Sync | major | ❌ Not yet built |
| STE-10.5 | `ste105-engine.ts` | Sync, doc-level | minor | ❌ Not yet built |
| STE-10.7 | `ste107-engine.ts` | Sync, doc-level | minor | ❌ Not yet built |

**Total remaining: 3 engines to build**

---

## After each engine: registration checklist

1. Add `export { runSteXxCheck } from "./steXx-engine";` to `app/lib/analysis/index.ts`
2. Add `export type { SteXxViolation, SteXxEngineResult } from "./steXx-engine";` to `index.ts`
3. Wire into the analysis pipeline in `app/api/documents/[id]/analyze/route.ts`
4. Run `npx tsc --noEmit` to confirm zero new errors
