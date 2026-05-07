/**
 * Mock analytics data — Phase G (UI only).
 */

export interface ScoreTrendPoint {
  date: string;
  score: number;
  label?: string;
}

export interface RuleFrequencyItem {
  ruleId: string;
  ruleName: string;
  count: number;
}

/** Last 14 days score trend (mock). */
export function getMockScoreTrend(days: number = 14): ScoreTrendPoint[] {
  const points: ScoreTrendPoint[] = [];
  const today = new Date();
  let score = 65;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    score = Math.min(100, Math.max(0, score + (Math.random() - 0.45) * 8));
    points.push({
      date: d.toISOString().slice(0, 10),
      score: Math.round(score),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }
  return points;
}

/** Most violated rules across project (mock). */
export const MOCK_ANALYTICS_RULE_FREQUENCY: RuleFrequencyItem[] = [
  { ruleId: "STE-1.1", ruleName: "Approved words only", count: 42 },
  { ruleId: "STE-5.1", ruleName: "Sentence length (instruction)", count: 28 },
  { ruleId: "STE-3.2", ruleName: "Passive voice", count: 19 },
  { ruleId: "STE-2.1", ruleName: "Noun clusters (max 3 words)", count: 15 },
  { ruleId: "STE-8.1", ruleName: "Semicolons", count: 12 },
  { ruleId: "STE-4.1", ruleName: "Imperative for procedures", count: 9 },
];

/** Calendar heatmap: days with activity (mock). */
export interface CalendarDay {
  date: string;
  count: number;
}

export function getMockViolationCalendarDays(): CalendarDay[] {
  const days: CalendarDay[] = [];
  const today = new Date();
  for (let i = 0; i < 35; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const count = Math.random() > 0.6 ? Math.floor(Math.random() * 5) + 1 : 0;
    days.push({
      date: d.toISOString().slice(0, 10),
      count,
    });
  }
  return days.reverse();
}
