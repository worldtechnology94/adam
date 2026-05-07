"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PieChart as PieIcon } from "lucide-react";

interface SentenceTypeItem {
  type: string;
  label: string;
  count: number;
}

interface SentenceTypePieChartProps {
  data: SentenceTypeItem[];
}

const COLORS = [
  "var(--primary)",
  "var(--accent)",
  "var(--success)",
];

export function SentenceTypePieChart({ data }: SentenceTypePieChartProps) {
  const chartData = data.map((d) => ({ name: d.label, value: d.count }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-[var(--muted-foreground)]">
        <PieIcon className="size-8 opacity-30" />
        <p className="text-sm">Run an analysis to see results</p>
      </div>
    );
  }

  return (
    <div className="h-64 min-h-[12rem] w-full min-w-0">
      <ResponsiveContainer width="100%" height={256}>
        <PieChart aria-label="Sentence type breakdown">
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={0}
            outerRadius="80%"
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
              const d = payload[0];
              const total = chartData.reduce((s, x) => s + x.value, 0);
              const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0";
              return (
                <div className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 shadow-md">
                  <p className="font-medium text-[var(--foreground)]">
                    {d.payload.name}
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {d.value} sentences ({pct}%)
                  </p>
                </div>
              );
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-sm text-[var(--foreground)]">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
