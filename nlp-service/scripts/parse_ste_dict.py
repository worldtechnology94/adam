#!/usr/bin/env python3
"""
Parse ASD-STE_Word.xlsx (Word sheet) into ste_dictionary.json and ste_forms_index.json.
Per docs/ASD-STE_Word-xlsx-analysis.md and adam_dictionary_spec.md §2.1 / §2.2.

Usage (from repo root):
  python nlp-service/scripts/parse_ste_dict.py
  # or
  nlp-service/venv/Scripts/python nlp-service/scripts/parse_ste_dict.py

Outputs:
  nlp-service/data/ste_dictionary.json
  nlp-service/data/ste_forms_index.json
"""

import json
import re
from pathlib import Path

try:
    import openpyxl
except ImportError:
    raise SystemExit("Install openpyxl: pip install openpyxl")

# Paths: run from repo root or from nlp-service
ROOT = Path(__file__).resolve().parents[2]
XLSX_PATH = ROOT / "nlp-service" / "ASD-STE_Word.xlsx"
if not XLSX_PATH.exists():
    XLSX_PATH = ROOT / "ASD-STE_Word.xlsx"
OUT_DIR = ROOT / "nlp-service" / "data"
OUT_DIR.mkdir(parents=True, exist_ok=True)
DICT_PATH = OUT_DIR / "ste_dictionary.json"
FORMS_PATH = OUT_DIR / "ste_forms_index.json"

HEADER_ROW = 2
DATA_START_ROW = 3
COL_B, COL_C, COL_D, COL_E, COL_F, COL_G = 2, 3, 4, 5, 6, 7

# POS in parentheses: (v), (adj), (n), (adv), (prep), (conj), (pron), (art), (TN) etc.
POS_PATTERN = re.compile(r"\s*\(([a-zA-Z0-9]+)\)\s*$")
# Match "WORD (pos)" for alternative
WORD_POS_PATTERN = re.compile(r"^(.+?)\s*\(([a-zA-Z0-9]+)\)\s*$")


def cell(ws, row: int, col: int):
    v = ws.cell(row=row, column=col).value
    if v is None:
        return ""
    return str(v).strip()


def parse_headword_and_pos(cell_b: str):
    """Return (headword_lower, word_display, pos, forms_list).
    cell_b e.g. 'abandon (v)' or 'ABSORB (v), ABSORBS, ABSORBED, ABSORBED' or 'BE (v), IS, WAS, (also ARE, WERE)'.
    """
    if not cell_b:
        return None, None, None, []
    first = cell_b.split(",")[0].strip()
    m = POS_PATTERN.search(first)
    if not m:
        return None, None, None, []
    pos = m.group(1).lower()
    head_raw = first[: m.start()].strip()
    head_lower = head_raw.lower()
    word_display = head_raw

    forms = [head_lower]
    rest = cell_b[m.end() :].strip()
    if rest.startswith(","):
        rest = rest[1:].strip()
    if rest:
        # Split by comma; handle "(also ARE, WERE)" by extracting words inside parentheses
        for part in rest.split(","):
            part = part.strip()
            if not part:
                continue
            if part.startswith("(also ") and part.endswith(")"):
                inner = part[6:-1].strip()
                for w in inner.split(","):
                    w = w.strip().lower()
                    if w and w not in forms:
                        forms.append(w)
            elif part.startswith("(") and part.endswith(")"):
                continue  # skip bare (pos) or similar
            else:
                w = part.lower()
                if w and w not in forms:
                    forms.append(w)
    return head_lower, word_display, pos, forms


def parse_alternative_from_d_e(d: str, e: str):
    """Return { word, pos } or None. Prefer non-empty D or E with WORD (pos) format."""
    for raw in (d, e):
        if not raw:
            continue
        m = WORD_POS_PATTERN.match(raw)
        if m:
            return {"word": m.group(1).strip().upper(), "pos": m.group(2).lower()}
    return None


def is_approved(c_raw: str) -> bool:
    if not c_raw:
        return False
    c = c_raw.upper()
    if c == "YES":
        return True
    if c == "NO" or "#VALUE" in c or "!" in c:
        return False
    return False


def main():
    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
    ws = wb["Word"]
    max_row = ws.max_row

    dictionary = {}
    forms_index = {}

    current_key = None
    current_approved = False
    current_entry = None

    for row in range(DATA_START_ROW, max_row + 1):
        b = cell(ws, row, COL_B)
        c = cell(ws, row, COL_C)
        d = cell(ws, row, COL_D)
        e = cell(ws, row, COL_E)
        f = cell(ws, row, COL_F)
        g = cell(ws, row, COL_G)

        if b:
            # New headword
            parsed = parse_headword_and_pos(b)
            head_lower, word_display, pos, forms = parsed
            if head_lower is None:
                continue
            approved = is_approved(c)
            current_key = head_lower
            current_approved = approved
            if head_lower in dictionary:
                # Duplicate headword (shouldn't happen) — merge or skip; for simplicity overwrite
                current_entry = dictionary[head_lower]
                current_entry["approved"] = approved
                if pos:
                    current_entry["pos"] = pos
                if word_display:
                    current_entry["word_display"] = word_display
                for form in forms:
                    forms_index[form] = head_lower
            else:
                current_entry = {
                    "word": head_lower,
                    "word_display": word_display or head_lower,
                    "forms": list(forms),
                    "pos": pos or "",
                    "approved": approved,
                    "meanings": [],
                    "alternatives": [],
                    "examples": [],
                }
                dictionary[head_lower] = current_entry
                for form in forms:
                    forms_index[form] = head_lower

            # Add first row's meaning/alternative and example
            alt = parse_alternative_from_d_e(d, e)
            if current_approved:
                if alt:
                    current_entry["meanings"].append({
                        "meaning": d or e or "",
                        "approved_as_is": False,
                        "alternative": alt,
                    })
                elif d or e:
                    current_entry["meanings"].append({
                        "meaning": d or e,
                        "approved_as_is": True,
                        "alternative": None,
                    })
            else:
                if alt:
                    current_entry["alternatives"].append(alt)
            if f or g:
                current_entry["examples"].append({"ste": f or None, "non_ste": g or None})
        else:
            # Continuation row
            if current_entry is None:
                continue
            alt = parse_alternative_from_d_e(d, e)
            if current_approved:
                if alt:
                    current_entry["meanings"].append({
                        "meaning": d or e or "",
                        "approved_as_is": False,
                        "alternative": alt,
                    })
                elif d or e:
                    current_entry["meanings"].append({
                        "meaning": d or e,
                        "approved_as_is": True,
                        "alternative": None,
                    })
            else:
                if alt:
                    current_entry["alternatives"].append(alt)
            if f or g:
                current_entry["examples"].append({"ste": f or None, "non_ste": g or None})

    wb.close()

    with open(DICT_PATH, "w", encoding="utf-8") as out:
        json.dump(dictionary, out, indent=2, ensure_ascii=False)

    with open(FORMS_PATH, "w", encoding="utf-8") as out:
        json.dump(forms_index, out, indent=2, ensure_ascii=False)

    print(f"Wrote {len(dictionary)} headwords to {DICT_PATH}")
    print(f"Wrote {len(forms_index)} form mappings to {FORMS_PATH}")
    # Spot-checks
    for key in ("abandon", "about", "absorb"):
        if key in dictionary:
            ent = dictionary[key]
            print(f"  {key}: approved={ent['approved']}, pos={ent['pos']}, alternatives={len(ent['alternatives'])}, meanings={len(ent['meanings'])}, examples={len(ent['examples'])}")


if __name__ == "__main__":
    main()
