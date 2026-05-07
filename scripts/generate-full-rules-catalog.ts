/**
 * Generate the full 60-rule catalog for the Rule Library.
 * Uses existing entries from data/ste-rules.json and fills in missing rules
 * with placeholders based on adam.md (60 STE rule categories).
 *
 * Run: npx tsx scripts/generate-full-rules-catalog.ts
 * Then: npm run seed:rules
 */

import { readFileSync, writeFileSync } from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");
const RULES_PATH = path.join(ROOT, "data", "ste-rules.json");

const TOPIC_NAMES: Record<number, string> = {
  1: "Words",
  2: "Noun Clusters",
  3: "Verbs & Verb Phrases",
  4: "Procedures (Instructions)",
  5: "Sentence Length",
  6: "Structure",
  7: "Warnings & Cautions",
  8: "Punctuation",
  9: "References",
  10: "Writing Practices",
};

// Rule ID ranges per adam.md §3 (60 rules total)
const RANGES: [number, number][] = [
  [1, 7],   // STE-1.1–1.7
  [2, 3],   // STE-2.1–2.3
  [3, 9],   // STE-3.1–3.9
  [4, 8],   // STE-4.1–4.8
  [5, 4],   // STE-5.1–5.4
  [6, 6],   // STE-6.1–6.6
  [7, 5],   // STE-7.1–7.5
  [8, 7],   // STE-8.1–8.7
  [9, 4],   // STE-9.1–9.4
  [10, 7],  // STE-10.1–10.7
];

const PLACEHOLDER_NAMES: Record<string, string> = {
  "STE-1.3": "Parts of speech",
  "STE-1.4": "Technical nouns",
  "STE-1.5": "Word forms",
  "STE-1.6": "Approved meanings",
  "STE-1.7": "Conditional approval",
  "STE-2.2": "Noun cluster clarity",
  "STE-2.3": "Noun cluster requirements",
  "STE-3.1": "Verb tense",
  "STE-3.3": "Gerunds",
  "STE-3.4": "Infinitives",
  "STE-3.5": "Verb consistency",
  "STE-3.6": "Auxiliary verbs",
  "STE-3.7": "Phrasal verbs",
  "STE-3.8": "Verb voice",
  "STE-3.9": "Verb phrases",
  "STE-4.2": "Procedure structure",
  "STE-4.3": "Step sequence",
  "STE-4.4": "Connecting words and phrases",
  "STE-4.5": "One action per step",
  "STE-4.6": "Descriptive lead-in and command (comma)",
  "STE-4.7": "Notes: information only",
  "STE-4.8": "Procedure completeness",
  "STE-5.3": "Sentence length (other)",
  "STE-5.4": "Word count limits",
  "STE-6.2": "List structure",
  "STE-6.3": "Paragraph length",
  "STE-6.4": "Topic sentences",
  "STE-6.5": "Logical order",
  "STE-6.6": "Structure clarity",
  "STE-7.2": "Warning placement",
  "STE-7.3": "Caution format",
  "STE-7.4": "Warning language",
  "STE-7.5": "Warnings and cautions",
  "STE-8.2": "Commas",
  "STE-8.3": "Hyphens",
  "STE-8.4": "Punctuation clarity",
  "STE-8.5": "Optional (s) plural notation",
  "STE-8.6": "Quotation marks",
  "STE-8.7": "Hyphens and dashes",
  "STE-9.2": "Reference format",
  "STE-9.3": "Phrasal verbs",
  "STE-9.4": "Cross-references",
  "STE-10.2": "Abbreviations",
  "STE-10.3": "Symbols",
  "STE-10.4": "Spelling consistency",
  "STE-10.5": "Terminology",
  "STE-10.6": "Writing practices",
  "STE-10.7": "Document consistency",
};

interface RuleEntry {
  id: string;
  name: string;
  topic: number;
  topicName: string;
  description: string;
  specText: string;
  compliantExamples: { text: string }[];
  nonCompliantExamples: { text: string; reason?: string }[];
}

function allRuleIds(): string[] {
  const ids: string[] = [];
  for (const [topic, max] of RANGES) {
    for (let n = 1; n <= max; n++) ids.push(`STE-${topic}.${n}`);
  }
  return ids;
}

function placeholderRule(id: string): RuleEntry {
  const match = id.match(/^STE-(\d+)\.\d+$/);
  const t = match ? parseInt(match[1], 10) : 1;
  const topicName = TOPIC_NAMES[t] ?? "General";
  const name = PLACEHOLDER_NAMES[id] ?? `Rule ${id}`;
  return {
    id,
    name,
    topic: t,
    topicName,
    description: `This rule is part of the ASD-STE100 standard (${topicName}). See ASD-STE100 Issue 9 for the official specification, explanation, and examples.`,
    specText: "See ASD-STE100 Issue 9.",
    compliantExamples: [{ text: "Follow the approved wording and structure for this rule." }],
    nonCompliantExamples: [{ text: "See ASD-STE100 Issue 9 for non-compliant examples.", reason: "Official examples in the specification." }],
  };
}

function main() {
  const existing = JSON.parse(readFileSync(RULES_PATH, "utf-8")) as RuleEntry[];
  const byId = new Map<string, RuleEntry>();
  for (const r of existing) byId.set(r.id, r);

  const ids = allRuleIds();
  if (ids.length !== 60) throw new Error(`Expected 60 rule IDs, got ${ids.length}`);

  const out: RuleEntry[] = ids.map((id) => {
    const ex = byId.get(id);
    if (ex && typeof ex.topic === "number" && ex.topic >= 1 && ex.topic <= 10) return ex;
    return placeholderRule(id);
  });
  writeFileSync(RULES_PATH, JSON.stringify(out, null, 2), "utf-8");
  console.log(`Wrote ${out.length} rules to ${RULES_PATH}. Existing: ${byId.size}, placeholders: ${out.length - byId.size}.`);
}

main();
