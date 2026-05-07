/**
 * Mock STE rule reference for ADAM — Phase E (UI only).
 * Subset of 60 rules with full detail for Rule Reference Library.
 */

export type SteTopicId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface RuleExample {
  text: string;
  reason?: string; // for non-compliant: why it fails
}

export interface SteRule {
  id: string;
  name: string;
  topic: SteTopicId;
  topicName: string;
  description: string;
  specText: string;
  compliantExamples: RuleExample[];
  nonCompliantExamples: RuleExample[];
}

export const STE_TOPIC_NAMES: Record<SteTopicId, string> = {
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

export const MOCK_RULES: SteRule[] = [
  {
    id: "STE-1.1",
    name: "Approved words only",
    topic: 1,
    topicName: "Words",
    description:
      "Use only words that are on the official STE approved word list, and use each word only in the part of speech (noun, verb, adjective, etc.) for which it is approved. If you need a meaning that is not approved, use a different word or phrase from the list.",
    specText:
      "Use only approved words in their approved part of speech. See the dictionary.",
    compliantExamples: [
      { text: "Remove the cover." },
      { text: "The pressure is correct." },
    ],
    nonCompliantExamples: [
      { text: "Utilize the correct tool.", reason: "'Utilize' is not on the approved list; use 'Use'." },
      { text: "The pressure was observed to be correct.", reason: "Passive and wordy; use active, approved words." },
    ],
  },
  {
    id: "STE-1.2",
    name: "Prohibited words",
    topic: 1,
    topicName: "Words",
    description:
      "Do not use words that are explicitly listed as not approved. The dictionary gives approved alternatives for each.",
    specText: "Do not use words that are not in the approved word list.",
    compliantExamples: [
      { text: "Before you start, check the oil level." },
    ],
    nonCompliantExamples: [
      { text: "Prior to starting the engine, check the oil.", reason: "'Prior to' is not approved; use 'Before'." },
    ],
  },
  {
    id: "STE-2.1",
    name: "Noun clusters (max 3 words)",
    topic: 2,
    topicName: "Noun Clusters",
    description:
      "Do not use more than three words in a row as a noun cluster (e.g. 'the hydraulic pressure pump assembly' is four words). Break into shorter phrases or use the dictionary-approved terms.",
    specText: "Use a maximum of three words in a noun cluster.",
    compliantExamples: [
      { text: "Remove the fuel pump." },
      { text: "The hydraulic pump is on the left." },
    ],
    nonCompliantExamples: [
      { text: "Remove the high-pressure fuel pump assembly component.", reason: "Noun cluster has more than three words." },
    ],
  },
  {
    id: "STE-3.2",
    name: "Passive voice",
    topic: 3,
    topicName: "Verbs & Verb Phrases",
    description:
      "In procedures, use active voice so the reader knows who performs the action. In descriptive text, passive is sometimes allowed but prefer active when possible.",
    specText: "Do not use passive voice in procedural sentences.",
    compliantExamples: [
      { text: "Install the new seal." },
      { text: "The technician checks the pressure." },
    ],
    nonCompliantExamples: [
      { text: "The seal was installed.", reason: "Passive voice; use 'Install the seal' or 'The technician installed the seal'." },
    ],
  },
  {
    id: "STE-4.1",
    name: "Active voice (procedures)",
    topic: 4,
    topicName: "Procedures (Instructions)",
    description:
      "Write procedural steps in active voice with the imperative form (e.g. 'Remove the cap', not 'The cap should be removed').",
    specText: "Use the imperative form in procedural sentences.",
    compliantExamples: [
      { text: "Open the valve. Check the pressure." },
    ],
    nonCompliantExamples: [
      { text: "The technician should open the valve.", reason: "Use imperative: 'Open the valve'." },
    ],
  },
  {
    id: "STE-5.1",
    name: "Sentence length (instruction)",
    topic: 5,
    topicName: "Sentence Length",
    description:
      "Keep procedural sentences to a maximum of 20 words. Short sentences are easier to follow and reduce the risk of misunderstanding.",
    specText: "Use a maximum of 20 words in an instructional sentence.",
    compliantExamples: [
      { text: "Remove the four bolts. Discard the seal." },
    ],
    nonCompliantExamples: [
      { text: "You must remove the four bolts that hold the cover in place and then discard the old seal before you install the new one.", reason: "Sentence exceeds 20 words." },
    ],
  },
  {
    id: "STE-5.2",
    name: "Sentence length (descriptive)",
    topic: 5,
    topicName: "Sentence Length",
    description:
      "In descriptive text, use a maximum of 25 words per sentence.",
    specText: "Use a maximum of 25 words in a descriptive sentence.",
    compliantExamples: [
      { text: "The pump is on the left side of the unit. It has a red cap." },
    ],
    nonCompliantExamples: [
      { text: "The pump that supplies hydraulic fluid to the system is located on the left side of the unit and has a red cap that must be removed before maintenance.", reason: "More than 25 words." },
    ],
  },
  {
    id: "STE-6.1",
    name: "Paragraph structure",
    topic: 6,
    topicName: "Structure",
    description:
      "Start each paragraph with a topic sentence that states the main idea. One main idea per paragraph.",
    specText: "Start each paragraph with a topic sentence.",
    compliantExamples: [
      { text: "The filter must be replaced every 500 hours. Remove the cover to get access." },
    ],
    nonCompliantExamples: [
      { text: "Remove the cover. The filter is inside. Replace it every 500 hours.", reason: "Topic sentence should introduce the main idea first." },
    ],
  },
  {
    id: "STE-7.1",
    name: "Warnings format",
    topic: 7,
    topicName: "Warnings & Cautions",
    description:
      "Start warnings with the word WARNING in capital letters. Use approved words only and keep the message clear.",
    specText: "Start a warning with the word WARNING in capital letters.",
    compliantExamples: [
      { text: "WARNING: Do not touch the hot surface. You can get burned." },
    ],
    nonCompliantExamples: [
      { text: "Caution: The surface might be extremely hot during operation.", reason: "Use 'WARNING' and approved words (e.g. 'can be very hot')." },
    ],
  },
  {
    id: "STE-8.1",
    name: "Semicolons",
    topic: 8,
    topicName: "Punctuation",
    description:
      "Do not use semicolons in STE. Use a full stop and a new sentence, or use 'and' or 'or' where appropriate.",
    specText: "Do not use semicolons.",
    compliantExamples: [
      { text: "Before you start, check the oil level. Then start the engine." },
    ],
    nonCompliantExamples: [
      { text: "Check the oil level; then start the engine.", reason: "Semicolon not allowed; use two sentences." },
    ],
  },
  {
    id: "STE-9.1",
    name: "Cross-references",
    topic: 9,
    topicName: "References",
    description:
      "Refer to other sections or figures clearly. Use consistent numbering and wording.",
    specText: "Use a clear reference when you refer to another part of the document.",
    compliantExamples: [
      { text: "See Section 4 for the tool list." },
      { text: "Refer to Figure 3-2." },
    ],
    nonCompliantExamples: [
      { text: "Refer to the section that describes the tools.", reason: "Give the exact section number." },
    ],
  },
  {
    id: "STE-10.1",
    name: "Consistency",
    topic: 10,
    topicName: "Writing Practices",
    description:
      "Use the same word for the same thing throughout the document. Do not switch between synonyms (e.g. 'remove' and 'take off').",
    specText: "Use the same word for the same thing in the whole document.",
    compliantExamples: [
      { text: "Remove the bolt. Remove the cover. (Same word used.)" },
    ],
    nonCompliantExamples: [
      { text: "Remove the bolt. Take off the cover.", reason: "Use 'Remove' for both; avoid synonyms." },
    ],
  },
];

const FAVORITES_KEY = "adam-rule-favorites";

export function getFavoriteRuleIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function setFavoriteRuleIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function toggleFavorite(id: string): boolean {
  const current = getFavoriteRuleIds();
  const has = current.includes(id);
  const next = has ? current.filter((x) => x !== id) : [...current, id];
  setFavoriteRuleIds(next);
  return !has;
}
