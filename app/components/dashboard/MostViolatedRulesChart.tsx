"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BarChart2 } from "lucide-react";

interface RuleCount {
  ruleId: string;
  ruleName: string;
  count: number;
}

interface MostViolatedRulesChartProps {
  data: RuleCount[];
}

const COLORS = [
  "var(--danger)",
  "var(--accent)",
  "var(--primary)",
  "var(--success)",
  "var(--muted-foreground)",
];

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export function MostViolatedRulesChart({ data }: MostViolatedRulesChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-[var(--muted-foreground)]">
        <BarChart2 className="size-8 opacity-30" />
        <p className="text-sm">Run an analysis to see results</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    label: truncate(d.ruleName, 22),
    ruleId: d.ruleId,
    fullName: d.ruleName,
    count: d.count,
  }));

  return (
    <div className="h-64 min-h-[12rem] w-full min-w-0">
      <ResponsiveContainer width="100%" height={256}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          aria-label="Top 5 most violated rules"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={148}
            tick={{ fontSize: 11, fill: "var(--foreground)" }}
            stroke="var(--border)"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]!.payload;
              return (
                <div className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 shadow-md">
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">
                    {d.ruleId}
                  </p>
                  <p className="font-medium text-[var(--foreground)]">
                    {d.fullName}
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {d.count} violation{d.count !== 1 ? "s" : ""}
                  </p>
                </div>
              );
            }}
            cursor={{ fill: "var(--muted)", fillOpacity: 0.3 }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {chartData.map((_, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.9}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
