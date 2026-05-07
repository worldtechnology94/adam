/**
 * Mock violation log for ADAM — Phase D (UI only, no API).
 */

export type ViolationSeverity = "critical" | "major" | "minor";
export type ViolationSentenceType =
  | "instructional"
  | "descriptive"
  | "warning_caution";

export type ViolationStatus = "pending" | "accepted" | "rejected";

export interface Violation {
  id: string;
  sentenceExcerpt: string;
  ruleId: string;
  ruleName: string;
  sentenceType: ViolationSentenceType;
  wordCount: number;
  severity: ViolationSeverity;
  aiSuggestion: string;
  paragraphContext?: string;
  position?: { start: number; end: number };
  status: ViolationStatus;
  note?: string;
}

export const MOCK_VIOLATIONS: Violation[] = [
  {
    id: "v1",
    sentenceExcerpt:
      "The technician should ensure that the valve is completely shut before proceeding.",
    ruleId: "STE-4.1",
    ruleName: "Active voice (procedures)",
    sentenceType: "instructional",
    wordCount: 14,
    severity: "major",
    aiSuggestion:
      "Ensure the valve is completely shut before you proceed.",
    paragraphContext:
      "Before removing the cover, the technician should ensure that the valve is completely shut before proceeding. Then disconnect the electrical connector.",
    status: "pending",
  },
  {
    id: "v2",
    sentenceExcerpt: "Utilize the correct tool for the job.",
    ruleId: "STE-1.1",
    ruleName: "Approved words only",
    sentenceType: "instructional",
    wordCount: 6,
    severity: "major",
    aiSuggestion: "Use the correct tool for the job.",
    paragraphContext: "Utilize the correct tool for the job. Do not use substitute parts.",
    status: "pending",
  },
  {
    id: "v3",
    sentenceExcerpt:
      "The hydraulic pressure was measured and found to be approximately 3000 psi.",
    ruleId: "STE-3.2",
    ruleName: "Passive voice",
    sentenceType: "descriptive",
    wordCount: 12,
    severity: "major",
    aiSuggestion:
      "The hydraulic pressure is 3000 psi. (Or: Measure the hydraulic pressure. It must be 3000 psi.)",
    paragraphContext:
      "After the test run, the hydraulic pressure was measured and found to be approximately 3000 psi. Record this value.",
    status: "pending",
  },
  {
    id: "v4",
    sentenceExcerpt: "Remove the high-pressure fuel pump assembly component.",
    ruleId: "STE-2.1",
    ruleName: "Noun clusters (max 3 words)",
    sentenceType: "instructional",
    wordCount: 6,
    severity: "major",
    aiSuggestion: "Remove the high-pressure fuel pump.",
    paragraphContext:
      "Remove the high-pressure fuel pump assembly component. Install the new unit.",
    status: "pending",
  },
  {
    id: "v5",
    sentenceExcerpt: "Prior to starting the engine; check the oil level.",
    ruleId: "STE-8.1",
    ruleName: "Semicolons",
    sentenceType: "instructional",
    wordCount: 8,
    severity: "minor",
    aiSuggestion: "Before you start the engine, check the oil level.",
    paragraphContext:
      "Prior to starting the engine; check the oil level. Then verify the fuel quantity.",
    status: "pending",
  },
  {
    id: "v6",
    sentenceExcerpt: "The operator must ascertain whether the fault has been cleared.",
    ruleId: "STE-1.1",
    ruleName: "Approved words only",
    sentenceType: "instructional",
    wordCount: 10,
    severity: "major",
    aiSuggestion: "The operator must check that the fault is cleared.",
    paragraphContext:
      "The operator must ascertain whether the fault has been cleared before continuing.",
    status: "pending",
  },
  {
    id: "v7",
    sentenceExcerpt:
      "In the event that the warning light illuminates, shut down the system immediately.",
    ruleId: "STE-5.1",
    ruleName: "Sentence length (instruction)",
    sentenceType: "instructional",
    wordCount: 13,
    severity: "minor",
    aiSuggestion:
      "If the warning light comes on, shut down the system immediately.",
    paragraphContext:
      "In the event that the warning light illuminates, shut down the system immediately. Do not restart until the cause is found.",
    status: "pending",
  },
  {
    id: "v8",
    sentenceExcerpt: "WARNING: Do not utilize flammable materials in the vicinity.",
    ruleId: "STE-7.1",
    ruleName: "Warnings format",
    sentenceType: "warning_caution",
    wordCount: 9,
    severity: "major",
    aiSuggestion: "WARNING: Do not use flammable materials near this area.",
    paragraphContext:
      "WARNING: Do not utilize flammable materials in the vicinity. Failure to comply may result in fire.",
    status: "pending",
  },
  {
    id: "v9",
    sentenceExcerpt: "Subsequent to the inspection, the component was replaced.",
    ruleId: "STE-1.1",
    ruleName: "Approved words only",
    sentenceType: "descriptive",
    wordCount: 7,
    severity: "major",
    aiSuggestion: "After the inspection, the component was replaced.",
    paragraphContext:
      "Subsequent to the inspection, the component was replaced. The system was then tested.",
    status: "pending",
  },
  {
    id: "v10",
    sentenceExcerpt:
      "It is necessary to verify that all connections are secure prior to applying power.",
    ruleId: "STE-4.1",
    ruleName: "Active voice (procedures)",
    sentenceType: "instructional",
    wordCount: 14,
    severity: "major",
    aiSuggestion: "Verify that all connections are secure before you apply power.",
    paragraphContext:
      "It is necessary to verify that all connections are secure prior to applying power. Then turn on the main switch.",
    status: "pending",
  },
  {
    id: "v11",
    sentenceExcerpt: "Commence the test procedure.",
    ruleId: "STE-1.1",
    ruleName: "Approved words only",
    sentenceType: "instructional",
    wordCount: 3,
    severity: "major",
    aiSuggestion: "Start the test procedure.",
    paragraphContext: "Commence the test procedure. Record the results.",
    status: "pending",
  },
  {
    id: "v12",
    sentenceExcerpt: "The defective unit has been isolated from the system.",
    ruleId: "STE-3.2",
    ruleName: "Passive voice",
    sentenceType: "descriptive",
    wordCount: 8,
    severity: "minor",
    aiSuggestion: "The defective unit is now isolated from the system.",
    paragraphContext:
      "The defective unit has been isolated from the system. Replacement can proceed.",
    status: "pending",
  },
  {
    id: "v13",
    sentenceExcerpt: "Perform a comprehensive inspection of the assembly.",
    ruleId: "STE-1.1",
    ruleName: "Approved words only",
    sentenceType: "instructional",
    wordCount: 6,
    severity: "major",
    aiSuggestion: "Inspect the assembly fully.",
    paragraphContext:
      "Perform a comprehensive inspection of the assembly. Document any damage.",
    status: "pending",
  },
  {
    id: "v14",
    sentenceExcerpt: "Ensure that the ambient temperature is within limits.",
    ruleId: "STE-5.1",
    ruleName: "Sentence length (instruction)",
    sentenceType: "instructional",
    wordCount: 8,
    severity: "minor",
    aiSuggestion: "Ensure the air temperature is within limits.",
    paragraphContext:
      "Ensure that the ambient temperature is within limits. If not, wait before starting.",
    status: "pending",
  },
  {
    id: "v15",
    sentenceExcerpt: "The valve positioning mechanism actuator assembly was removed.",
    ruleId: "STE-2.1",
    ruleName: "Noun clusters (max 3 words)",
    sentenceType: "descriptive",
    wordCount: 6,
    severity: "critical",
    aiSuggestion: "The valve actuator was removed.",
    paragraphContext:
      "The valve positioning mechanism actuator assembly was removed. Install the new actuator.",
    status: "pending",
  },
  {
    id: "v16",
    sentenceExcerpt: "Utilize extreme caution when handling the component.",
    ruleId: "STE-1.1",
    ruleName: "Approved words only",
    sentenceType: "instructional",
    wordCount: 7,
    severity: "major",
    aiSuggestion: "Use extreme care when you handle the component.",
    paragraphContext:
      "Utilize extreme caution when handling the component. Wear gloves.",
    status: "pending",
  },
  {
    id: "v17",
    sentenceExcerpt: "Refer to the appropriate manual; see Section 4.",
    ruleId: "STE-8.1",
    ruleName: "Semicolons",
    sentenceType: "instructional",
    wordCount: 7,
    severity: "minor",
    aiSuggestion: "Refer to the correct manual. See Section 4.",
    paragraphContext:
      "Refer to the appropriate manual; see Section 4. Do not proceed without reading it.",
    status: "pending",
  },
  {
    id: "v18",
    sentenceExcerpt: "The installation of the new module was completed successfully.",
    ruleId: "STE-3.2",
    ruleName: "Passive voice",
    sentenceType: "descriptive",
    wordCount: 8,
    severity: "major",
    aiSuggestion: "The new module is installed. The installation was successful.",
    paragraphContext:
      "The installation of the new module was completed successfully. The system is ready for test.",
    status: "pending",
  },
  {
    id: "v19",
    sentenceExcerpt: "Facilitate access to the area by removing the panel.",
    ruleId: "STE-1.1",
    ruleName: "Approved words only",
    sentenceType: "instructional",
    wordCount: 8,
    severity: "major",
    aiSuggestion: "Remove the panel to get access to the area.",
    paragraphContext:
      "Facilitate access to the area by removing the panel. Then locate the connector.",
    status: "pending",
  },
  {
    id: "v20",
    sentenceExcerpt: "CAUTION: The surface might be extremely hot during operation.",
    ruleId: "STE-7.2",
    ruleName: "Cautions format",
    sentenceType: "warning_caution",
    wordCount: 8,
    severity: "major",
    aiSuggestion: "CAUTION: The surface can be very hot when the system is on.",
    paragraphContext:
      "CAUTION: The surface might be extremely hot during operation. Do not touch.",
    status: "pending",
  },
  {
    id: "v21",
    sentenceExcerpt: "The parameters were observed to be within normal limits.",
    ruleId: "STE-3.2",
    ruleName: "Passive voice",
    sentenceType: "descriptive",
    wordCount: 8,
    severity: "minor",
    aiSuggestion: "The parameters are within normal limits.",
    paragraphContext:
      "The parameters were observed to be within normal limits. No action was required.",
    status: "pending",
  },
  {
    id: "v22",
    sentenceExcerpt: "Prior to commencing the procedure, gather the required tools.",
    ruleId: "STE-1.1",
    ruleName: "Approved words only",
    sentenceType: "instructional",
    wordCount: 8,
    severity: "major",
    aiSuggestion: "Before you start the procedure, get the correct tools.",
    paragraphContext:
      "Prior to commencing the procedure, gather the required tools. Then open the manual.",
    status: "pending",
  },
  {
    id: "v23",
    sentenceExcerpt: "Disconnect the electrical power supply connection cable.",
    ruleId: "STE-2.1",
    ruleName: "Noun clusters (max 3 words)",
    sentenceType: "instructional",
    wordCount: 6,
    severity: "major",
    aiSuggestion: "Disconnect the power supply cable.",
    paragraphContext:
      "Disconnect the electrical power supply connection cable. Then remove the cover.",
    status: "pending",
  },
  {
    id: "v24",
    sentenceExcerpt:
      "It is recommended that the operator should perform a visual inspection.",
    ruleId: "STE-4.1",
    ruleName: "Active voice (procedures)",
    sentenceType: "instructional",
    wordCount: 11,
    severity: "major",
    aiSuggestion: "The operator must inspect the unit visually.",
    paragraphContext:
      "It is recommended that the operator should perform a visual inspection before signing off.",
    status: "pending",
  },
  {
    id: "v25",
    sentenceExcerpt: "Terminate the process if any abnormality is detected.",
    ruleId: "STE-1.1",
    ruleName: "Approved words only",
    sentenceType: "instructional",
    wordCount: 7,
    severity: "major",
    aiSuggestion: "Stop the process if you see any fault.",
    paragraphContext:
      "Terminate the process if any abnormality is detected. Report the fault.",
    status: "pending",
  },
];

/** All rule IDs for filter dropdown (STE-1.1 through STE-10.7 sample) */
export const RULE_IDS = [
  "STE-1.1",
  "STE-2.1",
  "STE-3.2",
  "STE-4.1",
  "STE-5.1",
  "STE-6.1",
  "STE-7.1",
  "STE-7.2",
  "STE-8.1",
  "STE-9.1",
  "STE-10.1",
] as const;

export const SENTENCE_TYPE_LABELS: Record<ViolationSentenceType, string> = {
  instructional: "Instructional",
  descriptive: "Descriptive",
  warning_caution: "Warning / Caution",
};

export const SEVERITY_LABELS: Record<ViolationSeverity, string> = {
  critical: "Critical",
  major: "Major",
  minor: "Minor",
};
