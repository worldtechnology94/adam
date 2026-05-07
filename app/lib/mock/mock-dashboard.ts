/**
 * Mock dashboard data for ADAM — Phase B (UI only, no API).
 */

export type DocumentType = "procedure" | "description" | "warning" | "mixed";
export type Severity = "critical" | "major" | "minor";
export type SentenceType = "instructional" | "descriptive" | "warning_caution";

export interface DashboardSummary {
  complianceScore: number;
  violations: {
    total: number;
    critical: number;
    major: number;
    minor: number;
  };
  topViolatedRules: { ruleId: string; ruleName: string; count: number }[];
  rulesFoundCount: number;
  sentenceTypeBreakdown: { type: SentenceType; label: string; count: number }[];
  violationDistribution: { ruleId: string; ruleName: string; count: number }[];
  document: DocumentMetadata;
  recentActivity: ActivityEntry[];
}

export interface DocumentMetadata {
  fileName: string;
  wordCount: number;
  sentenceCount: number;
  uploadTimestamp: string; // ISO or display string
  documentType: DocumentType;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  action: string;
  documentName?: string;
  description: string;
}

export const mockDashboardSummary: DashboardSummary = {
  complianceScore: 72,
  violations: {
    total: 47,
    critical: 8,
    major: 24,
    minor: 15,
  },
  topViolatedRules: [
    { ruleId: "STE-1.1", ruleName: "Approved words only", count: 18 },
    { ruleId: "STE-5.1", ruleName: "Sentence length (instruction)", count: 12 },
    { ruleId: "STE-3.2", ruleName: "Passive voice", count: 7 },
    { ruleId: "STE-2.1", ruleName: "Noun clusters (max 3 words)", count: 5 },
    { ruleId: "STE-8.1", ruleName: "Semicolons", count: 5 },
  ],
  rulesFoundCount: 12,
  sentenceTypeBreakdown: [
    { type: "instructional", label: "Instructional", count: 84 },
    { type: "descriptive", label: "Descriptive", count: 31 },
    { type: "warning_caution", label: "Warning / Caution", count: 6 },
  ],
  violationDistribution: [
    { ruleId: "STE-1.1", ruleName: "Approved words only", count: 18 },
    { ruleId: "STE-5.1", ruleName: "Sentence length", count: 12 },
    { ruleId: "STE-3.2", ruleName: "Passive voice", count: 7 },
    { ruleId: "STE-2.1", ruleName: "Noun clusters", count: 5 },
    { ruleId: "STE-8.1", ruleName: "Semicolons", count: 5 },
    { ruleId: "STE-4.1", ruleName: "Active voice (procedures)", count: 3 },
    { ruleId: "STE-6.1", ruleName: "Paragraph structure", count: 2 },
  ],
  document: {
    fileName: "B737-AMM-32-21-00-Rev12.docx",
    wordCount: 2847,
    sentenceCount: 121,
    uploadTimestamp: "2026-02-28T14:32:00Z",
    documentType: "procedure",
  },
  recentActivity: [
    {
      id: "1",
      timestamp: "2026-02-28T15:02:00Z",
      action: "analysis_completed",
      documentName: "B737-AMM-32-21-00-Rev12.docx",
      description: "Analysis completed for B737-AMM-32-21-00-Rev12.docx",
    },
    {
      id: "2",
      timestamp: "2026-02-28T14:32:00Z",
      action: "document_uploaded",
      documentName: "B737-AMM-32-21-00-Rev12.docx",
      description: "Document uploaded",
    },
    {
      id: "3",
      timestamp: "2026-02-27T11:20:00Z",
      action: "analysis_completed",
      documentName: "A320-CMM-29-00-00.docx",
      description: "Analysis completed for A320-CMM-29-00-00.docx",
    },
    {
      id: "4",
      timestamp: "2026-02-27T09:15:00Z",
      action: "document_uploaded",
      documentName: "A320-CMM-29-00-00.docx",
      description: "Document uploaded",
    },
    {
      id: "5",
      timestamp: "2026-02-26T16:45:00Z",
      action: "report_generated",
      documentName: "B737-AMM-32-21-00-Rev11.docx",
      description: "Full compliance audit report generated",
    },
  ],
};
