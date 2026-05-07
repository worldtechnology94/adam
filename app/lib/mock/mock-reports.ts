/**
 * Mock report types and export formats — Phase G (UI only).
 */

export interface ReportType {
  id: string;
  name: string;
  description: string;
}

export const REPORT_TYPES: ReportType[] = [
  {
    id: "executive-summary",
    name: "Executive Summary",
    description: "High-level compliance score and key findings for stakeholders.",
  },
  {
    id: "full-audit",
    name: "Full Compliance Audit",
    description: "Complete list of violations with rule references and suggestions.",
  },
  {
    id: "rule-breakdown",
    name: "Rule-by-Rule Breakdown",
    description: "Violations grouped by STE rule with counts and examples.",
  },
  {
    id: "corrected-document",
    name: "Corrected Document",
    description: "Full document text with suggested corrections applied.",
  },
  {
    id: "delta-report",
    name: "Delta Report",
    description: "Changes between this version and the previous revision.",
  },
  {
    id: "trend-report",
    name: "Trend Report",
    description: "Compliance score and violation trends over time.",
  },
];

export type ExportFormat = "pdf" | "docx" | "xlsx" | "json" | "html";

export const EXPORT_FORMATS: { value: ExportFormat; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "DOCX" },
  { value: "xlsx", label: "XLSX" },
  { value: "json", label: "JSON" },
  { value: "html", label: "HTML" },
];
