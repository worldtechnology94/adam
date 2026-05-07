/**
 * Mock projects and documents — Phase G (UI only).
 */

export interface ProjectDocument {
  id: string;
  name: string;
  score: number;
  lastAnalyzed: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  documentCount: number;
  aggregateScore: number;
  lastUpdated: string;
  documents: ProjectDocument[];
}

export interface ProjectActivityEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  documentName?: string;
}

export const MOCK_PROJECT_ACTIVITY: ProjectActivityEntry[] = [
  { id: "pa1", timestamp: "2026-02-28 14:32", user: "You", action: "Analysis completed", documentName: "Maintenance_Procedure_v2.docx" },
  { id: "pa2", timestamp: "2026-02-28 11:00", user: "You", action: "Document uploaded", documentName: "Safety_Checklist.pdf" },
  { id: "pa3", timestamp: "2026-02-27 16:45", user: "You", action: "Analysis completed", documentName: "Installation_Guide.docx" },
  { id: "pa4", timestamp: "2026-02-27 10:20", user: "You", action: "Project created", documentName: undefined },
  { id: "pa5", timestamp: "2026-02-26 09:15", user: "You", action: "Document uploaded", documentName: "Quick_Start.txt" },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Maintenance Procedures",
    description: "STE-compliant maintenance and repair documentation.",
    documentCount: 12,
    aggregateScore: 78,
    lastUpdated: "2026-02-28",
    documents: [
      { id: "d1", name: "Maintenance_Procedure_v2.docx", score: 82, lastAnalyzed: "2026-02-28" },
      { id: "d2", name: "Inspection_Checklist.pdf", score: 75, lastAnalyzed: "2026-02-27" },
      { id: "d3", name: "Troubleshooting_Guide.docx", score: 71, lastAnalyzed: "2026-02-25" },
    ],
  },
  {
    id: "p2",
    name: "Safety Documentation",
    description: "Safety instructions and warnings.",
    documentCount: 5,
    aggregateScore: 85,
    lastUpdated: "2026-02-27",
    documents: [
      { id: "d4", name: "Safety_Checklist.pdf", score: 88, lastAnalyzed: "2026-02-28" },
      { id: "d5", name: "Emergency_Procedures.docx", score: 83, lastAnalyzed: "2026-02-26" },
    ],
  },
  {
    id: "p3",
    name: "Installation Guides",
    description: "Product installation and setup.",
    documentCount: 8,
    aggregateScore: 69,
    lastUpdated: "2026-02-26",
    documents: [
      { id: "d6", name: "Installation_Guide.docx", score: 72, lastAnalyzed: "2026-02-27" },
      { id: "d7", name: "Quick_Start.txt", score: 65, lastAnalyzed: "2026-02-26" },
    ],
  },
];
