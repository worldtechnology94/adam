# ADAM — Frontend Implementation Plan
## UI-First Approach | No Backend Dependency

**Document version:** 1.0  
**Date:** March 2026  
**Status:** Planning  
**Purpose:** Build a complete, navigable, high-fidelity frontend for ADAM using mock data. Backend integration will follow in a separate phase.

**References:** `adam.md` (§4 Application Modules, §5 Frontend, §7 Accessibility, §10 Branding), `implementation-plan.md`

---

## 1. Executive Summary

This plan delivers the **entire ADAM user interface** before any real APIs or business logic. All screens are built with **mock data** and **client-side state** (Zustand). The result is a polished, accessible, branded application that can be demoed and refined; backend endpoints will be wired in later without changing the UI structure.

**Out of scope for this plan:** Real authentication, real document upload/analysis, live NLP, live AI chat, real report generation. Those are covered in `backend-implementation-plan.md`.

---

## 2. Principles

- **UI only:** Components and pages consume mock data or local state; no dependency on running backend services.
- **Spec-accurate:** Layouts, copy, and behaviour match `adam.md` (Dashboard widgets, Violation Log columns, Rule Library content, etc.).
- **Accessible from day one:** WCAG 2.1 AA (contrast, focus, ARIA, 14px min, color + icon for severity).
- **Brand-consistent:** ADAM colours, typography, and tagline applied globally.
- **Step-by-step:** Each step produces a testable, buildable outcome.

---

## 3. Tech Stack (Confirmed)

| Layer | Choice | Notes |
|-------|--------|------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript | Already in project |
| State | Zustand | Client state + mock data stores |
| UI components | Radix UI + Tailwind CSS | Already in project |
| Charts | Recharts | Dashboard & Analytics |
| Diff / code view | CodeMirror 6 (or simple diff component initially) | Violation Log inline diff |
| Icons | Lucide React | Already in project |
| Forms | React Hook Form + Zod | Already in project |

---

## 4. Design Tokens & Branding

Apply these from `adam.md` §10:

| Token | Value | Usage |
|-------|--------|--------|
| Primary | `#1A2B4A` (Deep Navy) | Header, sidebar, primary buttons, key headings |
| Accent | `#F59E0B` (Amber) | Violation highlights, CTAs, alerts, score gauge amber band |
| Success | `#10B981` (Emerald) | Pass states, green score tier, success messages |
| Danger | Red (e.g. `#DC2626`) | Critical severity, red score tier, destructive actions |
| Background | Light: `#FFFFFF` / Dark: `#0F172A` | Surfaces |
| Text | Light: `#171717` / Dark: `#F8FAFC` | Body and headings |

**Typography:** Minimum 14px body; ensure one sans-serif stack for UI (e.g. Geist or Inter).  
**Tagline:** *"Write it right. Every time."* — use in layout header or login shell.  
**Logo:** Placeholder (e.g. stylized “A” + “ADAM” text) until final asset exists.

---

## 5. Mock Data Strategy

- **Location:** `app/lib/mock/` (or `app/data/mock/`).
- **Contents:**
  - `mock-dashboard.ts` — Compliance score, violation counts by severity, top 5 rules, sentence type counts, document metadata, recent activity list.
  - `mock-violations.ts` — Array of violations (sentence, ruleId, ruleName, sentenceType, wordCount, severity, aiSuggestion, paragraphContext); enough for pagination and filters.
  - `mock-rules.ts` — Subset of 60 STE rules (e.g. 10–15) with id, name, topic, description, specText, compliantExamples, nonCompliantExamples; full set can be expanded later.
  - `mock-projects.ts` — List of projects with name, document count, aggregate score.
  - `mock-reports.ts` — Report type list and placeholder “last generated” info.
  - `mock-activity.ts` — Recent activity entries (timestamp, action, document name).
- **Zustand stores (optional):** e.g. `useMockDocumentStore` (current document, analysis result), `useMockViolationsFilterStore` (filters, sort), `useThemeStore` (light/dark/high-contrast). Keep stores minimal; prefer passing props or reading mock files where sufficient.

---

## 6. Application Structure (Routes & Layout)

```
app/
├── layout.tsx                 # Root: theme, fonts, providers
├── page.tsx                   # Redirect to /dashboard or landing
├── (auth)/
│   ├── login/page.tsx         # Sign-in (UI only; no real auth)
│   └── layout.tsx             # Centered card layout
├── (app)/                     # Main app shell
│   ├── layout.tsx             # Sidebar + top bar + “ADAM” branding
│   ├── dashboard/page.tsx      # Dashboard (home)
│   ├── upload/page.tsx        # Document upload & ingestion
│   ├── violations/page.tsx    # Violation Log
│   ├── rules/page.tsx         # Rule Reference Library
│   ├── ask-adam/page.tsx      # Ask ADAM chat
│   ├── reports/page.tsx       # Reports & Export
│   ├── projects/page.tsx      # Project & Document Management
│   ├── analytics/page.tsx     # Analytics & Trends
│   └── settings/page.tsx      # Settings & Configuration
├── components/                # Shared UI
│   ├── ui/                    # Radix + Tailwind primitives
│   ├── layout/                # Sidebar, Header, AppShell
│   ├── dashboard/             # Score gauge, charts, metadata bar, activity feed
│   ├── upload/                # Dropzone, file queue, preview pane
│   ├── violations/            # Table, filters, diff view, row actions
│   ├── rules/                 # Rule card, search, sandbox
│   ├── ask-adam/              # Chat container, message bubbles, copy button
│   └── charts/                # Recharts wrappers (score gauge, bar, pie, donut)
└── lib/
    ├── mock/                  # Mock data modules
    ├── stores/                # Zustand stores (optional)
    └── utils.ts               # cn, formatters, etc.
```

Use Next.js route groups `(auth)` and `(app)` so login has a different layout from the main app. Home `page.tsx` can redirect to `/dashboard` when “logged in” (e.g. a mock session flag in state or cookie).

---

## 7. Frontend Implementation Steps (Ordered)

Execute in order. Each step ends with a working, buildable state.

---

### Phase A — Shell & Foundation

#### Step A.1 — Design tokens and global styles

- **Tasks:**
  - In `app/globals.css` (or Tailwind theme): define CSS variables for primary, accent, success, danger, background, foreground; support `[data-theme="light"]`, `[data-theme="dark"]`, `[data-theme="high-contrast"]`.
  - Set base font size (min 14px), line height, and focus ring styles for accessibility.
  - Add utility classes for severity (e.g. `.severity-critical`, `.severity-major`, `.severity-minor`) using both color and icon semantics.
- **Acceptance criteria:** Theme variables applied; toggling theme (e.g. via a store or data attribute) updates the UI; focus visible on interactive elements.

#### Step A.2 — Root layout and app shell

- **Tasks:**
  - Update `app/layout.tsx`: ADAM metadata (title, description), load fonts, apply `data-theme` from a provider or cookie.
  - Create `(app)/layout.tsx`: sidebar navigation (Dashboard, Upload, Violations, Rules, Ask ADAM, Reports, Projects, Analytics, Settings), top bar with logo, tagline, theme toggle, user menu placeholder.
  - Sidebar: icons + labels; active route highlighted; collapsible on small screens (drawer or overlay).
  - Ensure keyboard navigation (Tab through nav, Enter to activate).
- **Acceptance criteria:** Navigating to `/dashboard` (or any `(app)` route) shows sidebar and top bar; all nav links work; theme toggle works; no layout shift on load.

#### Step A.3 — Placeholder pages and routing

- **Tasks:**
  - Add one page per route under `(app)/`: `dashboard`, `upload`, `violations`, `rules`, `ask-adam`, `reports`, `projects`, `analytics`, `settings`.
  - Each page renders a simple heading and one sentence (e.g. “Dashboard — Compliance overview”) so every link has a destination.
- **Acceptance criteria:** Every sidebar link goes to a valid page; no 404s.

---

### Phase B — Dashboard

#### Step B.1 — Mock data and dashboard layout

- **Tasks:**
  - Create `app/lib/mock/mock-dashboard.ts`: compliance score (e.g. 72), violation counts (Critical/Major/Minor), top 5 rules with counts, rules-found count, sentence-type breakdown (instructional/descriptive/warning), document metadata (name, word count, sentence count, upload time, type), recent activity (5–10 items).
  - Create `app/lib/mock/mock-activity.ts` if separated.
  - On `(app)/dashboard/page.tsx`: two-column or grid layout with clear regions for: score, violations summary, charts, document bar, activity feed.
- **Acceptance criteria:** Dashboard page shows structured layout; data comes from mock; no API calls.

#### Step B.2 — Compliance score and violation summary

- **Tasks:**
  - Build a **compliance score** component: large 0–100 gauge (Recharts radial or custom SVG); color bands Red &lt;60, Amber 60–79, Green 80–100; optional subtle animation on mount.
  - Build **violation summary**: total count + breakdown by severity (Critical / Major / Minor) with icons and colors.
  - Place both prominently on the dashboard.
- **Acceptance criteria:** Score displays with correct tier colour; severity breakdown matches mock counts; icons visible for severity.

#### Step B.3 — Dashboard charts

- **Tasks:**
  - **Most violated rules:** Horizontal bar chart (Recharts), top 5 rules by count.
  - **Sentence type breakdown:** Pie chart (Instructional, Descriptive, Warning/Caution).
  - **Violation distribution:** Donut chart by STE rule (or by topic).
  - **Rules found:** Single stat (distinct rule count).
  - All charts: accessible labels, legend, and hover tooltips.
- **Acceptance criteria:** All three charts render with mock data; tooltips and legends clear; no console errors.

#### Step B.4 — Document metadata bar and recent activity

- **Tasks:**
  - **Document metadata bar:** File name, word count, sentence count, upload timestamp, document type (procedure/description/warning/mixed); use mock document.
  - **Recent activity feed:** List of timestamped entries (e.g. “Analysis completed for Document A”, “Document B uploaded”); use mock activity.
  - Responsive: stack or truncate on small screens.
- **Acceptance criteria:** Bar and feed visible; data from mock; readable on mobile.

---

### Phase C — Document Upload

#### Step C.1 — Upload page layout and drop zone

- **Tasks:**
  - Create `(app)/upload/page.tsx` with a large **drag-and-drop zone** (Radix or custom with `react-dropzone`).
  - Support multi-file (e.g. up to 20); show accepted types: .docx, .doc, .pdf, .txt, .md, .xml, .sgml.
  - On drop/select: store files in local state (no upload to server); show **file queue** with file name and size.
  - Optional: **progress bar** per file (simulated 0→100% for demo).
- **Acceptance criteria:** User can drop or select multiple files; queue displays; progress can be simulated; no backend call.

#### Step C.2 — Preview pane and metadata form

- **Tasks:**
  - **Pre-analysis preview:** When at least one file is selected, show a preview pane with raw text (for demo, use a short mock paragraph or first file’s name + placeholder text).
  - **Metadata form:** Project (dropdown or text), document type (procedure/description/warning/mixed), revision number, author (all optional); use React Hook Form + Zod.
  - “Analyze” button: in frontend-only phase, navigate to dashboard with a query param or set mock “last analyzed document” in state so dashboard shows as if analysis just ran.
- **Acceptance criteria:** Preview updates when file(s) selected; form validates; “Analyze” triggers navigation or state update without API.

---

### Phase D — Violation Log

#### Step D.1 — Mock violations and table shell

- **Tasks:**
  - Create `app/lib/mock/mock-violations.ts`: 20–30 violations with sentence, ruleId, ruleName, sentenceType, wordCount, severity, aiSuggestion, optional paragraphContext and position.
  - Create violations page: **data table** (TanStack Table or Radix Table) with columns: Sentence excerpt, Rule ID, Rule Name, Sentence Type, Word Count, Severity, AI Suggestion.
  - Client-side sort by each column; pagination (e.g. 10 per page).
- **Acceptance criteria:** Table renders all columns; sort and pagination work; data from mock.

#### Step D.2 — Filter bar

- **Tasks:**
  - **Filter bar** above table: filter by Rule (dropdown STE-1.1–STE-10.7 or multi-select), Sentence Type, Severity, Keyword (text search in sentence/suggestion).
  - Filters update table view (filter mock array in memory).
- **Acceptance criteria:** Changing any filter updates visible rows; clear filters resets view.

#### Step D.3 — Inline diff and row actions

- **Tasks:**
  - **Inline diff:** For each row (or on expand), show original sentence vs AI-corrected sentence with red (removed) / green (added) highlights. Use a simple diff component or CodeMirror diff view.
  - **Per-row actions:** Accept, Reject, Edit (buttons); actions only update local state (e.g. mark as accepted/rejected in mock store or hide row).
  - **Bulk actions:** “Accept all for this rule” and “Export selected” (export can be CSV/JSON from current table data in memory).
- **Acceptance criteria:** Diff visible and readable; Accept/Reject/Edit change UI state; bulk actions work on selected rows.

#### Step D.4 — Context expansion and heatmap placeholder

- **Tasks:**
  - **Expand row:** Click row to expand and show “surrounding paragraph” (from mock `paragraphContext`).
  - **Annotation:** Optional input for “private note” per violation (stored in local state).
  - **Violation heatmap:** Placeholder area (e.g. “Document preview with density of violations per paragraph”) — can be a simple list of paragraph labels with colour intensity or a stub component.
- **Acceptance criteria:** Expand shows context; note can be typed and stored in state; heatmap placeholder present.

---

### Phase E — Rule Reference Library

#### Step E.1 — Mock rules and list view

- **Tasks:**
  - Create `app/lib/mock/mock-rules.ts`: 10–15 STE rules with id, name, topic (1–10), description, specText, compliantExamples[], nonCompliantExamples[] (with reason).
  - Rules page: **search** (full-text on name/description/examples) and **filter by STE topic** (1–10).
  - List or grid of rule cards: rule ID, name, short description; click opens detail.
- **Acceptance criteria:** Search and topic filter work; rule list and detail render from mock.

#### Step E.2 — Rule detail and “Test this rule” sandbox

- **Tasks:**
  - **Rule detail:** Full view: rule ID and name, plain-language explanation, exact spec text, compliant examples (✅), non-compliant examples with explanation (❌).
  - **Favorites:** Toggle to “bookmark” a rule (store in Zustand or localStorage).
  - **“Test this rule” sandbox:** Input sentence + “Run” button; in frontend-only phase, show a mock result (e.g. “Compliant” or “Violation: …” based on hardcoded logic or random for demo).
- **Acceptance criteria:** Detail view shows all sections; favorites persist; sandbox runs and shows a result without backend.

---

### Phase F — Ask ADAM (Chat UI)

#### Step F.1 — Chat layout and message list

- **Tasks:**
  - Create `(app)/ask-adam/page.tsx`: chat container (full-width or side-panel style); message list (user + assistant); input at bottom.
  - **Mock conversation:** 3–5 preloaded messages (user question + ADAM answer with markdown-style content); store in Zustand or component state.
  - **Markdown rendering:** Use a small markdown renderer (e.g. `react-markdown`) for assistant messages so that lists, code, and rule citations display correctly.
- **Acceptance criteria:** Chat UI renders; mock messages show; new user message can be appended (stored in state); assistant reply can be simulated (e.g. fixed placeholder reply).

#### Step F.2 — Chat features (UI only)

- **Tasks:**
  - **Copy-to-document** button on assistant messages that contain a suggested sentence (copy to clipboard and show toast).
  - **Mode selector or prompts:** Shortcuts like “Rewrite in STE”, “Explain rule”, “Compare two sentences” (buttons that insert a template into the input).
  - Optional: **conversation history** list (mock list of past chats); selecting one loads that mock thread.
- **Acceptance criteria:** Copy works; mode prompts insert text into input; history list visible (mock).

---

### Phase G — Reports, Projects, Analytics, Settings

#### Step G.1 — Reports page

- **Tasks:**
  - List **report types** (Executive Summary, Full Compliance Audit, Rule-by-Rule Breakdown, Corrected Document, Delta Report, Trend Report) with short description.
  - **Export format** selector: PDF, DOCX, XLSX, JSON, HTML (no real export; “Generate” can show a success message and a disabled “Download” or mock download).
  - Optional: **Customization** panel (logo upload placeholder, header/footer text, rule categories) — UI only.
- **Acceptance criteria:** All report types and formats listed; “Generate” triggers success state; no real file generation.

#### Step G.2 — Projects page

- **Tasks:**
  - **Project list:** Cards or table from `mock-projects.ts` (name, document count, aggregate score, last updated).
  - **Create project:** Modal or inline form (name, optional description); adds to mock list in state.
  - **Document list** per project: placeholder or mock list of documents with name and score.
  - **Activity log** placeholder: “Who ran which analysis when” (mock 3–5 entries).
- **Acceptance criteria:** Projects list and create work with mock data; document list and activity placeholders visible.

#### Step G.3 — Analytics page

- **Tasks:**
  - **Score trend line:** Recharts line chart (mock: score over last 7 or 30 days).
  - **Rule frequency chart:** Bar or donut of “most violated rules across project” (mock).
  - **Violation heatmap calendar:** Placeholder or simple calendar with a few highlighted days (mock).
  - Optional: **Word frequency** (most flagged words) and **sentence complexity** histogram (mock).
  - All charts: tooltips, legends, export placeholder (e.g. “Export as PNG” shows toast).
- **Acceptance criteria:** At least two charts render with mock data; calendar placeholder present; no backend.

#### Step G.4 — Settings page

- **Tasks:**
  - **User preferences:** Theme (Light / Dark / High-Contrast), notifications (checkboxes), default export format (dropdown), language (English only for now).
  - **Analysis configuration:** Toggle list for “Enable/disable rules” (e.g. STE-1.1–STE-10.7 as checkboxes; mock), link to “Custom word list” (placeholder page or modal with CSV upload placeholder), severity thresholds (dropdowns or number inputs — mock).
  - **Integrations:** Placeholder sections for REST API, Webhook, SSO (no real config).
  - Persist theme (and optionally prefs) in localStorage so they survive refresh.
- **Acceptance criteria:** Theme and preferences persist; toggles and inputs update state; no backend.

---

### Phase H — Polish & Accessibility

#### Step H.1 — Accessibility pass

- **Tasks:**
  - Add `aria-label` or `aria-labelledby` to all interactive elements (buttons, links, form fields, charts).
  - Ensure focus order and visible focus ring on keyboard nav; skip link “Skip to main content” if needed.
  - Verify severity uses both colour and icon (e.g. Critical = red + X icon).
  - Test with browser zoom 200%; fix any layout breakage.
- **Acceptance criteria:** No critical a11y violations in manual/Lighthouse check; keyboard-only navigation works.

#### Step H.2 — Login and landing (UI only)

- **Tasks:**
  - **Login page:** Form (email, password) + “Sign in”; on submit, set a mock “logged in” state (e.g. Zustand or cookie) and redirect to `/dashboard`. No real auth.
  - **Landing:** If user not “logged in”, `/` shows a simple landing (logo, tagline, “Sign in” / “Get started”); if “logged in”, redirect to `/dashboard`.
- **Acceptance criteria:** Login form submits and redirects; landing shows correct state.

#### Step H.3 — Onboarding and help placeholders

- **Tasks:**
  - **Keyboard shortcut:** Press `?` to open a modal or slide-over with shortcut list (e.g. “? — Show this help”).
  - **First-time walkthrough:** Optional; show a simple 2–3 step tooltip sequence on first visit (state in localStorage “tour completed”); skip button.
  - **Rule ID links:** In Violation Log and elsewhere, rule IDs link to `/rules?highlight=<ruleId>` or scroll to that rule in Rule Library.
- **Acceptance criteria:** `?` opens help; tour can be completed or skipped; rule ID links navigate to Rule Library.

---

## 8. File and Component Checklist

Use this as a quick reference for “what to build” in the frontend.

| Item | Location / Name |
|------|------------------|
| Theme variables | `globals.css` / Tailwind theme |
| App shell layout | `(app)/layout.tsx`, `components/layout/Sidebar.tsx`, `Header.tsx` |
| Mock data | `lib/mock/mock-dashboard.ts`, `mock-violations.ts`, `mock-rules.ts`, `mock-projects.ts`, `mock-activity.ts`, `mock-reports.ts` |
| Dashboard | `dashboard/page.tsx`, `components/dashboard/ComplianceScoreGauge.tsx`, `ViolationSummary.tsx`, `DocumentMetadataBar.tsx`, `RecentActivityFeed.tsx`, chart components |
| Upload | `upload/page.tsx`, `components/upload/DropZone.tsx`, `FileQueue.tsx`, `PreviewPane.tsx`, metadata form |
| Violations | `violations/page.tsx`, `ViolationsTable.tsx`, `FilterBar.tsx`, `DiffView.tsx`, row actions, heatmap placeholder |
| Rules | `rules/page.tsx`, `RuleCard.tsx`, `RuleDetail.tsx`, search/filter, sandbox |
| Ask ADAM | `ask-adam/page.tsx`, `ChatContainer.tsx`, `MessageList.tsx`, markdown renderer, copy button |
| Reports | `reports/page.tsx`, report type list, format selector |
| Projects | `projects/page.tsx`, project list, create form, document list placeholder |
| Analytics | `analytics/page.tsx`, trend chart, rule frequency chart, calendar placeholder |
| Settings | `settings/page.tsx`, theme, notifications, analysis toggles, integrations placeholder |
| Auth (UI) | `(auth)/login/page.tsx`, landing in `page.tsx` |

---

## 9. Success Criteria (Frontend Complete)

- All routes in §6 render without error; navigation is consistent and keyboard-accessible.
- Dashboard shows score, charts, document bar, and activity feed with mock data.
- Upload page supports drop zone, file queue, preview, and metadata form; “Analyze” advances flow without backend.
- Violation Log has table, filters, sort, pagination, diff view, row and bulk actions, expand and annotation.
- Rule Reference Library has search, topic filter, rule list and detail, favorites, and “Test this rule” sandbox.
- Ask ADAM has chat UI, mock thread, markdown replies, copy button, and mode prompts.
- Reports, Projects, Analytics, and Settings pages have all widgets and forms described; data is mock; theme and preferences persist where specified.
- WCAG 2.1 AA baseline met; `?` help and optional onboarding in place.
- No runtime dependency on backend APIs; app runs with `npm run dev` (and `npm run build`) without any server other than Next.js.

---

## 10. After Frontend: Wiring the Backend

When moving to backend implementation (`backend-implementation-plan.md`):

- Replace mock data with API calls (e.g. `GET /api/dashboard/summary`, `GET /api/violations`, etc.).
- Replace mock “Analyze” and “Login” with real endpoints.
- Keep the same component and route structure; only data sources and submit handlers change.
- Add loading and error states where API is used.

---

## 11. Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | March 2026 | Initial frontend-only implementation plan. |

---

*Next: Implement steps in order, starting with Phase A. Backend work is described in `backend-implementation-plan.md`.*
