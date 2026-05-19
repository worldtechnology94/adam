/**
 * ADAM — Simple part-of-speech heuristic (T2.1 optional)
 *
 * Assigns a likely part-of-speech to a normalized token using suffix and
 * pattern rules. Used to narrow suggestions in the STE-1.1 engine when
 * we do not have a full NLP POS tagger. Dictionary POS inventory:
 * v, adj, n, adv, prep, conj, pron, art (adam_dictionary_spec.md §1).
 *
 * Rules are applied in order; the first match wins. "unknown" is returned
 * when no rule matches. This is acceptable for thesis scope (thesisplan:
 * "can be 'unknown' initially").
 *
 * @see thesisplan.md T2.1 — Optional: simple POS heuristic (e.g. -ed → verb)
 * @see adam_dictionary_spec.md §1 — POS Tag Inventory
 */

/** POS codes aligned with the STE dictionary (schema and spec). */
export type POSCode = "v" | "adj" | "n" | "adv" | "prep" | "conj" | "pron" | "art" | "unknown";

/**
 * Heuristic rules: suffix (or pattern) → POS.
 * Order matters: more specific suffixes should come before more general ones
 * (e.g. -tion before -ion). All checks are on lowercase token.
 */
const SUFFIX_RULES: { pattern: RegExp | string; pos: POSCode }[] = [
  // Verbs: common imperative (base form) for STE-5 instructional detection
  { pattern: /^(?:open|close|check|press|turn|set|start|stop|remove|install|connect|disconnect|use|run|add|hold|push|pull|wait|read|write|tighten|loosen|put|get|make|take|give|move|place|apply|attach|align|measure|adjust|replace|lift|fix|clean|test|inspect|secure|lock|unlock|release|engage|disengage|activate|deactivate|reset|enable|disable|enter|select|load|insert|extract|mount|detach|drain|fill|position|verify|confirm|ensure|note|ream|bleed|flush|purge|prime|lubricate|torque|trim|solder|rinse|hone|lap|grind|deburr)$/, pos: "v" },
  // Technical nouns that would be mis-tagged by the generic verb-suffix rules (-ing → v, -s → v)
  // or that return "unknown" due to no matching suffix. Listed before suffix rules to take priority.
  { pattern: /^(?:housing|casing|wiring|tubing|piping|coupling|couplings|bearing|bearings|fitting|fittings|mounting|lining|coating|sealing|bonding|shielding|ducting|bolt|bolts|nut|nuts|seal|seals|ring|rings|spring|springs|engine|engines|shaft|shafts|bracket|brackets|rail|rails|drum|drums|rotor|rotors|stator|stators|piston|pistons|nozzle|nozzles|manifold|manifolds|orifice|orifices|inlet|inlets|outlet|outlets|port|ports|disk|disks|cap|caps|pin|pins|clip|clips|pad|pads|strap|straps|clamp|clamps|washer|washers|gasket|gaskets|joint|joints|hinge|hinges|lever|levers|pedal|pedals|knob|knobs|slot|slots|flange|flanges|bushing|bushings|gland|glands|plug|plugs|socket|sockets|collet|collets|shim|shims|spacer|spacers|key|keys|groove|grooves|thread|threads)$/, pos: "n" },
  // Verbs: past tense / past participle
  { pattern: /ed$/, pos: "v" },
  { pattern: /(?:ing)$/, pos: "v" },
  { pattern: /(?:es)$/, pos: "v" },
  { pattern: /(?:s)$/, pos: "v" },
  // Adverbs
  { pattern: /ly$/, pos: "adv" },
  { pattern: /wise$/, pos: "adv" },
  // Nouns: common derivational suffixes
  { pattern: /(?:tion|sion|ation|ition)$/, pos: "n" },
  { pattern: /(?:ness|ment|ship|hood|dom)$/, pos: "n" },
  { pattern: /(?:er|or|ar)$/, pos: "n" },
  { pattern: /(?:ist|ism|ian)$/, pos: "n" },
  { pattern: /(?:ity|ty)$/, pos: "n" },
  { pattern: /(?:ance|ence)$/, pos: "n" },
  { pattern: /(?:acy|cy)$/, pos: "n" },
  // Adjectives
  { pattern: /(?:ful|less|ous|ious|ive|able|ible|al|ial|ic|ical)$/, pos: "adj" },
  { pattern: /(?:est)$/, pos: "adj" },
  { pattern: /(?:ant|ent)$/, pos: "adj" },
  // Articles / determiners (closed set; heuristic for common ones)
  { pattern: /^(?:a|an|the)$/, pos: "art" },
  // Prepositions (closed set; common ones)
  { pattern: /^(?:in|on|at|to|for|of|with|by|from|as|into|through|during|before|after|above|below|between|under|over)$/, pos: "prep" },
  // Conjunctions
  { pattern: /^(?:and|or|but|nor|so|yet|if|because|when|while|although|that)$/, pos: "conj" },
  // Pronouns (simple list)
  { pattern: /^(?:i|you|he|she|it|we|they|me|him|her|us|them|this|that|these|those|who|which|what)$/, pos: "pron" },
];

/**
 * Returns a best-guess POS for a normalized token (lowercase, punctuation stripped).
 * Returns "unknown" if no rule matches.
 */
export function inferPOS(normalized: string): POSCode {
  if (!normalized || normalized.length === 0) return "unknown";

  const lower = normalized.toLowerCase();

  for (const rule of SUFFIX_RULES) {
    if (typeof rule.pattern === "string") {
      if (lower === rule.pattern || lower.endsWith(rule.pattern)) return rule.pos;
    } else {
      if (rule.pattern.test(lower)) return rule.pos;
    }
  }

  return "unknown";
}
