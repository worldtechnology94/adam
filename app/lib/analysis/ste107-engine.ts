/**
 * ADAM — STE-10.7 rule engine (Document consistency — numbers and units)
 *
 * ASD-STE100 Issue 9: Use a consistent format for numbers and units throughout
 * the document. Do not mix unit abbreviations with spelled-out unit names.
 *
 * Document-level check. For each physical unit group (e.g. mm/millimetre/
 * millimeter), the first notation seen is recorded. Every subsequent occurrence
 * of the same unit group in a different notation emits a violation.
 *
 * Detection: regex scan of sentence.text for number + unit patterns.
 * Position is calculated from match.index within the sentence text.
 *
 * @see ste10-writing-engine.ts — STE-10.3 (% and & symbols)
 * @see remaining-ste-rules.md — STE-10.7
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-1.11";
const RULE_NAME = "Do not use different technical nouns for the same item";

/**
 * Each entry: [groupKey, variants[]].
 * All variants are stored lowercase in the lookup map.
 * The regex matches a bare unit word following a number.
 */
const UNIT_GROUPS: [string, string[]][] = [
  ["mm",  ["mm", "millimetre", "millimeter", "millimetres", "millimeters"]],
  ["cm",  ["cm", "centimetre", "centimeter", "centimetres", "centimeters"]],
  ["m",   ["m",  "metre", "meter", "metres", "meters"]],
  ["km",  ["km", "kilometre", "kilometer", "kilometres", "kilometers"]],
  ["kg",  ["kg", "kilogram", "kilograms"]],
  ["g",   ["g",  "gram", "grams"]],
  ["l",   ["l",  "litre", "liter", "litres", "liters"]],
  ["ml",  ["ml", "millilitre", "milliliter", "millilitres", "milliliters"]],
  ["nm",  ["nm", "Nm", "newton meter", "newton metre", "newton meters", "newton metres"]],
  ["psi", ["psi", "pounds per square inch"]],
  ["rpm", ["rpm", "RPM", "revolutions per minute"]],
  ["bar", ["bar", "bars"]],
  ["kpa", ["kpa", "kPa", "kilopascal", "kilopascals"]],
  ["mpa", ["mpa", "MPa", "megapascal", "megapascals"]],
];

/** Maps unit_lowercase → groupKey */
const UNIT_TO_GROUP = new Map<string, string>();
for (const [groupKey, variants] of UNIT_GROUPS) {
  for (const v of variants) {
    UNIT_TO_GROUP.set(v.toLowerCase(), groupKey);
  }
}

/** Matches: digits (optionally comma/dot formatted) + optional space + letters */
const UNIT_RE = /\b(\d[\d,.]*)\s*([A-Za-z]+(?:\s+per\s+[A-Za-z]+)?)\b/g;

export interface Ste107Violation {
  sentenceIndex:   number;
  sentenceExcerpt: string;
  tokenRaw:        string;
  tokenNormalized: string;
  positionStart:   number;
  positionEnd:     number;
  ruleId:          string;
  ruleName:        string;
  severity:        "critical" | "major" | "minor";
  reason:          string;
  suggestion:      string;
  wordCount:       number;
}

export interface Ste107EngineResult {
  violations: Ste107Violation[];
}

/**
 * Build the UNIT_TO_GROUP map, optionally augmented with rows from SteUnit table.
 * Each DB row adds its symbol as an additional variant for its measureType group.
 */
export function buildUnitLookup(
  dbUnits?: { measureType: string; unitName: string; symbol: string }[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const [groupKey, variants] of UNIT_GROUPS) {
    for (const v of variants) map.set(v.toLowerCase(), groupKey);
  }
  if (dbUnits) {
    for (const u of dbUnits) {
      const group = u.measureType.toLowerCase();
      map.set(u.symbol.toLowerCase(), group);
      map.set(u.unitName.toLowerCase(), group);
    }
  }
  return map;
}

export function runSte107Check(
  doc: TokenizedDocument,
  dbUnits?: { measureType: string; unitName: string; symbol: string }[]
): Ste107EngineResult {
  const unitToGroup = dbUnits ? buildUnitLookup(dbUnits) : UNIT_TO_GROUP;
  const violations: Ste107Violation[] = [];

  /** Maps groupKey → first seen { rawUnit, sentenceIndex } */
  const groupFirstSeen = new Map<string, { rawUnit: string; sentenceIndex: number }>();

  for (const sentence of doc.sentences) {
    const docStart  = sentence.offsetInDocument.start;
    const wordCount = sentence.tokens.filter((t) => t.isWord).length;
    const text      = sentence.text;

    // Reset regex state for each sentence
    UNIT_RE.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = UNIT_RE.exec(text)) !== null) {
      const unitRaw  = match[2]!;
      const unitNorm = unitRaw.toLowerCase();
      const groupKey = unitToGroup.get(unitNorm);
      if (!groupKey) continue;

      // Position of the unit token within the sentence text
      const unitOffset = match.index + match[0].length - unitRaw.length;
      const posStart   = docStart + unitOffset;
      const posEnd     = posStart + unitRaw.length;

      if (!groupFirstSeen.has(groupKey)) {
        groupFirstSeen.set(groupKey, { rawUnit: unitRaw, sentenceIndex: sentence.index });
        continue;
      }

      const first = groupFirstSeen.get(groupKey)!;
      if (first.rawUnit === unitRaw) continue; // same notation — consistent

      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        unitRaw,
        tokenNormalized: unitNorm,
        positionStart:   posStart,
        positionEnd:     posEnd,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "minor",
        reason:          "inconsistent_unit_notation",
        suggestion:
          `Use the same unit notation throughout. This document uses '${first.rawUnit}' elsewhere. ` +
          `Change '${unitRaw}' to '${first.rawUnit}'.`,
        wordCount,
      });
    }
  }

  return { violations };
}
