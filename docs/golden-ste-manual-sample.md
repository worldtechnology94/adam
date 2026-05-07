# Golden STE test sample (controlled manual text)

**Purpose:** Use this as a **baseline** when testing ADAM. It is short, procedural, and written in **classic STE style** (imperative, short sentences, general-service vocabulary). It is **not** certified by ASD; it is a **test fixture** so you can compare “expected few violations” vs noisy PDFs.

**How to use**

1. Copy the **plain text block** below into a `.txt` file and upload, **or** paste into Word/LibreOffice and export **PDF** to test extraction.
2. Expect **far fewer** STE-1.1 / STE-1.2 hits than for `asd-ste100-issue-9.pdf` or academic papers.
3. If you still see thousands of issues, focus on **dictionary coverage** and **tokenization** (hyphens, numbers), not on “the manual is bad.”

---

## Plain text — fictional maintenance excerpt (STE-style)

```
TITLE: RESERVOIR — CHECK FLUID LEVEL

1. Make sure that the system is not pressurized.

2. Remove the access panel.

3. Check the fluid level in the reservoir.

4. If the level is below the minimum mark, do this:
   a. Get serviceable hydraulic fluid. Use only the fluid that the applicable manual identifies.
   b. Remove the filler cap.
   c. Add fluid until the level is between the minimum mark and the maximum mark.
   d. Install the filler cap.
   e. Install the access panel.

5. If the level is not below the minimum mark, install the access panel.

6. Make sure that the access panel is secure.
```

---

## Why there is no single “perfect” public PDF

| Reality | Implication |
|--------|-------------|
| Real AMM/CMM PDFs are usually **proprietary**. | You cannot rely on a downloadable OEM manual as an open “gold” file. |
| STE compliance depends on **Issue + dictionary build + technical names**. | The same paragraph can differ slightly across tool versions. |
| Full **ASD-STE100** PDF is a **spec**, not a procedure manual. | It will always flood checks (examples, tables, legal text). |

**Best practice:** Keep this file (or a longer internal STE-approved draft) as your **regression sample**, and add **custom words** for your product names if needed.

---

## Optional: longer training-style block (often used in STE courses)

If you want more text in one upload, append STE-style steps similar to **trim tab / cable** exercises from STE training (short lines, one main action per sentence). Your team can extend the block above in the same pattern: **numbered steps, sub-steps a–e, IF/THEN, SEE Figure X** — all in imperative mood.
