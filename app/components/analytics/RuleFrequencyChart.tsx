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
import type { RuleFrequencyItem } from "@/app/lib/mock/mock-analytics";

interface RuleFrequencyChartProps {
  data: RuleFrequencyItem[];
}

const COLORS = ["var(--accent)", "var(--primary)", "var(--muted-foreground)", "var(--primary)", "var(--accent)", "var(--muted-foreground)"];

export function RuleFrequencyChart({ data }: RuleFrequencyChartProps) {
  const chartData = data.map((d) => ({
    name: d.ruleId,
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
          aria-label="Most violated rules across project"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={56}
            tick={{ fontSize: 12, fill: "var(--foreground)" }}
            stroke="var(--border)"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 shadow-md">
                  <p className="font-medium text-[var(--foreground)]">{d.fullName}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {d.count} violation{d.count !== 1 ? "s" : ""}
                  </p>
                </div>
              );
            }}
            cursor={{ fill: "var(--muted)", fillOpacity: 0.3 }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28} label={false}>
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
