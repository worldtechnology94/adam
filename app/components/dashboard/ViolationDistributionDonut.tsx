"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Layers } from "lucide-react";

interface RuleCount {
  ruleId: string;
  ruleName: string;
  count: number;
}

interface ViolationDistributionDonutProps {
  data: RuleCount[];
}

const COLORS = [
  "var(--danger)",
  "var(--accent)",
  "var(--primary)",
  "var(--success)",
  "var(--muted-foreground)",
  "#6366f1",
  "#ec4899",
];

export function ViolationDistributionDonut({
  data,
}: ViolationDistributionDonutProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-[var(--muted-foreground)]">
        <Layers className="size-8 opacity-30" />
        <p className="text-sm">Run an analysis to see results</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: `${d.ruleId} — ${d.ruleName}`,
    shortName: d.ruleId,
    value: d.count,
  }));

  return (
    <div className="h-64 min-h-[12rem] w-full min-w-0">
      <ResponsiveContainer width="100%" height={256}>
        <PieChart aria-label="Violation distribution by rule">
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
                stroke="var(--background)"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              const total = chartData.reduce((s, x) => s + x.value, 0);
              const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0";
              return (
                <div className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 shadow-md">
                  <p className="font-medium text-[var(--foreground)]">
                    {d.name}
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {d.value} violation{d.value !== 1 ? "s" : ""} ({pct}%)
                  </p>
                </div>
              );
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={72}
            formatter={(value, entry) => {
              const short = chartData.find((d) => d.name === value)?.shortName ?? value;
              return (
                <span className="text-sm text-[var(--foreground)]">
                  {short}
                </span>
              );
            }}
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
