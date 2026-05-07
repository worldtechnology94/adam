"""
One-off script to analyze ASD-STE_Word.xlsx structure and content.
Run from repo root: python nlp-service/scripts/analyze_xlsx.py
"""
import os
import sys
from pathlib import Path

try:
    import openpyxl
    from openpyxl.utils import get_column_letter
except ImportError:
    print("Install openpyxl: pip install openpyxl")
    sys.exit(1)

# Path to XLSX (script may be run from project root or nlp-service)
ROOT = Path(__file__).resolve().parents[2]
XLSX_PATH = ROOT / "nlp-service" / "ASD-STE_Word.xlsx"
if not XLSX_PATH.exists():
    XLSX_PATH = ROOT / "ASD-STE_Word.xlsx"
if not XLSX_PATH.exists():
    print(f"Not found: {XLSX_PATH}")
    sys.exit(1)

def cell_str(cell):
    v = cell.value
    if v is None:
        return ""
    s = str(v).strip()
    return s[:80] + "..." if len(s) > 80 else s

def main():
    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
    print("=" * 60)
    print("SHEETS")
    print("=" * 60)
    print("Sheet names:", wb.sheetnames)

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        print("\n" + "=" * 60)
        print(f"SHEET: {sheet_name}")
        print("=" * 60)
        print(f"Max row: {ws.max_row}, Max column: {ws.max_column}")

        # Header (first row)
        header = [cell_str(ws.cell(1, c)) for c in range(1, ws.max_column + 1)]
        print("\nColumn indices and headers (row 1):")
        for c, h in enumerate(header, 1):
            let = get_column_letter(c)
            print(f"  {let} (col {c}): {repr(h)}")

        # Sample data rows (2 to 22 only)
        print("\nSample data rows (rows 2-22) — columns A through G:")
        for r in range(2, min(23, ws.max_row + 1)):
            row_vals = [cell_str(ws.cell(r, c)) for c in range(1, min(8, ws.max_column + 1))]
            b_val = ws.cell(r, 2).value
            cont = " [CONTINUATION]" if (b_val is None or str(b_val).strip() == "") else ""
            print(f"  Row {r}:{cont}")
            for c, val in enumerate(row_vals, 1):
                if val:
                    print(f"    {get_column_letter(c)}: {val}")

        # Count by column B and C (limit to first 500 rows for speed)
        if sheet_name == "Word" and ws.max_row > 1:
            headword_count = 0
            continuation_count = 0
            approved_yes = 0
            approved_no = 0
            sample_verbs_with_forms = []
            max_scan = min(ws.max_row + 1, 600)
            for r in range(2, max_scan):
                b = ws.cell(r, 2).value
                c = ws.cell(r, 3).value
                if b is None or str(b).strip() == "":
                    continuation_count += 1
                else:
                    headword_count += 1
                    if c and "yes" in str(c).lower():
                        approved_yes += 1
                    elif c and "no" in str(c).lower():
                        approved_no += 1
                    if b and "," in str(b) and "(" in str(b):
                        sample_verbs_with_forms.append((r, cell_str(ws.cell(r, 2))))

            print("\n--- Word sheet stats (first 598 data rows) ---")
            print(f"Rows with headword (B non-empty): {headword_count}")
            print(f"Continuation rows (B empty): {continuation_count}")
            print(f"Approved Yes: {approved_yes}, Approved No: {approved_no}")
            print(f"Sample verb entries with conjugations in B (first 5):")
            for r, s in sample_verbs_with_forms[:5]:
                print(f"  Row {r}: {s}")
            print(f"Total sheet rows (Word): {ws.max_row}")

    wb.close()
    print("\nDone.")

if __name__ == "__main__":
    main()
