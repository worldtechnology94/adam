# Abstract

## Review notes (implementation alignment)

**What fits ADAM well**

- User manuals, safety, clarity, ambiguity as a motivation — **keep**.
- ASD-STE100 as the CNL frame — **keep**.
- NLP applied to manual text — **keep**; prefer **rule-based and dictionary-driven** processing over generic “information extraction” unless you explicitly include NER/table IE (ADAM’s core is **compliance checking**, not entity extraction from semi-structured fields).
- Lengthy sentences, terminology, complex structures — **partially** covered (e.g. STE-5.x length, STE-10.x writing practices, STE-1.x vocabulary); **“inconsistent terminology”** is only fully supportable if you document **STE-10.1 / consistency** or similar as implemented—otherwise phrase as **terminology and wording risks** or **non-approved word use**.
- ADAM as a named framework — **keep**.
- Violations, suggestions, replicable workflow — **keep** (suggestions come from dictionary alternatives and rule text).

**What to soften or rephrase**

- **“Information extraction techniques”** — Often implies named-entity or structured field extraction. Safer: **“natural language processing techniques, including lexical lookup and pattern- and heuristic-based rule engines”** (or shorter: **“NLP and rule-based analysis”**).
- **“Systematically detects ambiguous constructs”** — The system detects **STE rule violations and linguistic cues** used as **proxies** for ambiguity/non-compliance; it does not perform full **semantic** ambiguity resolution. Prefer **“detects non-conformities and ambiguity-related linguistic patterns”** or similar.
- **“Identify ambiguity types, quantify their frequency”** — Align with **violation types / rule families and counts** (and optional compliance score), not a full typology of philosophical ambiguity.
- **Outcomes** — Readability/translatability/reliability are **plausible goals** of STE; tie them to **controlled vocabulary and rules** rather than claiming proven outcomes without user studies.

**Optional one-sentence add-on (if your thesis includes evaluation)**

- Brief mention of **evaluation against human judgments** on a **frozen corpus** (reproducibility, limitations).

---

## Abstract (revised text — use in thesis)

User manuals are vital documents in technical industries where safety, precision, and clarity are paramount. Ambiguity in these texts—whether semantic or syntactic—can lead to misinterpretations, operational inefficiencies, and safety hazards. Reducing such risk requires documentation practices that can be taught, repeated, and checked against an explicit standard.

This study investigates how **non-conformity and ambiguity-related wording** manifest in industrial equipment manuals and evaluates **Controlled Natural Language**, specifically **ASD-STE100**, as a practical mitigation framework. Using **natural language processing**, the research implements a **rule- and dictionary-aligned pipeline** that processes PDF manuals, segments text, and **detects linguistic patterns** associated with STE violations—such as non-approved or misclassified word use, discouraged constructions, sentence-length issues, and other writing-rule checks supported by the implementation.

To meet these objectives, the study presents **ADAM (Ambiguity Detection and Assessment Model)**, a framework grounded in ASD-STE100 principles. ADAM operationalizes STE guidance by mapping extracted text to **violations** with **rule identifiers**, **severity**, and, where available, **dictionary- or rule-based suggestions**—offering a **structured, replicable** approach to assessing linguistic quality and standard alignment in technical documentation.

The expected contributions include stronger support for **reviewable, consistent checking** of manual text prior to publication, with benefits for **clarity** and **translation readiness** that are characteristic of STE-oriented writing—while acknowledging that automated checks complement, rather than replace, qualified human judgment and regulatory processes.

---

## Short abstract variant (if word limit is strict)

User manuals underpin safe operation in technical industries; ambiguous or non-standard wording can cause misinterpretation and hazard. This thesis evaluates **ASD-STE100** as a mitigation strategy and presents **ADAM**, an **NLP framework** that analyzes PDF manuals using a **dictionary-backed STE lexicon** and **rule engines** to flag violations, prioritize issues by rule families, and suggest clearer alternatives where the lexicon provides them. The work positions ADAM as a **replicable assessment model** for improving the **consistency and inspectability** of technical English in industrial documentation.

---

*File: `docs/abstract.md` — align the chosen paragraph with your university’s abstract length and formatting rules.*
