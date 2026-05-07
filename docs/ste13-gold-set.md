# STE-1.3 gold set (manual evaluation)

Small fixed sentences used to report **precision-oriented** behavior of the pattern-based STE-1.3 layer (`runSte13Check`). Automated checks live in `scripts/test-ste13-engine.ts`; this table is for **thesis appendix** / manual re-runs after changing `ste-meaning-patterns.ts`.

| # | Sentence | Expected STE-1.3 | Notes |
|---|----------|------------------|--------|
| 1 | `FOR DATA ABOUT THE ENGINE, REFER TO THE MANUAL.` | None | “Concerned with” sense (dictionary-approved). |
| 2 | `Drain about 2 liters of fuel from the tank.` | 1 × wrong meaning → **APPROXIMATELY** | Matches `about` + numeral pattern. |
| 3 | `Rotate the shaft about its axis.` | 1 × wrong meaning → **AROUND** | Spatial / rotation sense. |
| 4 | `TURN THE SHAFT AROUND ITS AXIS.` | None | Uses approved **AROUND** (no *about* disallowed sense). |

**Metrics (fill in after runs):**

| Date | Build / commit | True positives | False positives | False negatives | Notes |
|------|----------------|-----------------|-----------------|-----------------|-------|
| | | | | | |

**How to verify in the app:** Upload a `.txt` containing sentences 1–4, run analysis, filter violations by rule **STE-1.3**.

**Limitations:** Coverage is limited to headwords listed in `app/lib/analysis/ste-meaning-patterns.ts`. Outside those patterns, no STE-1.3 violation is emitted (strategy **E**).
