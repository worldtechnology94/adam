# ADAM — Analysis Module (T2.1)

This directory implements **text normalization and tokenization** for the STE-1.1 pipeline.

## Contents

| File | Purpose |
|------|--------|
| `types.ts` | Shared types: `Token`, `Sentence`, `TextOffset`, `TokenizedDocument`. |
| `sentence-boundary.ts` | Split text into sentences; avoid splitting on abbreviations, decimals, ellipsis. |
| `tokenize.ts` | `getSentences(text)`, `getTokens(sentence)`, `tokenizeText(text)`; normalization. |
| `pos-heuristic.ts` | Optional POS guess from suffix/pattern; returns `unknown` when no rule matches. |
| `index.ts` | Public API re-exports. |

## Usage

```ts
import { getSentences, getTokens, tokenizeText } from "@/app/lib/analysis";

const sentences = getSentences("First sentence. Second sentence.");
const tokens = getTokens("The technician utilized the tool.");
const doc = tokenizeText("Full text...", { applyPosHeuristic: true });
```

## Acceptance (thesisplan T2.1)

Input: "The technician utilized the tool." → 1 sentence; tokens include technician, utilized, the, tool.

Run: `npm run test:tokenize` or `npx tsx scripts/test-tokenize.ts`.

### T2.2 — STE-1.1 engine

- **Engine:** `runSte11Check(doc, lookup, options)` in `ste11-engine.ts`; uses `createPrismaLookup(prisma)` for DB.
- **Tests:** `npm run test:ste11` or `npx tsx scripts/test-ste11-engine.ts`.
