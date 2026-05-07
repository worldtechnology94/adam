"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { ScoreTrendPoint } from "@/app/lib/mock/mock-analytics";

interface ScoreTrendChartProps {
  data: ScoreTrendPoint[];
  ariaLabel?: string;
}

export function ScoreTrendChart({ data, ariaLabel = "Compliance score over time" }: ScoreTrendChartProps) {
  return (
    <div className="h-64 min-h-[12rem] w-full min-w-0">
      <ResponsiveContainer width="100%" height={256}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          aria-label={ariaLabel}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
            tickLine={false}
            tickFormatter={(_, i) => data[i]?.label ?? ""}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <ReferenceLine y={80} stroke="var(--success)" strokeDasharray="2 2" strokeOpacity={0.6} />
          <ReferenceLine y={60} stroke="var(--accent)" strokeDasharray="2 2" strokeOpacity={0.6} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 shadow-md">
                  <p className="text-sm text-[var(--muted-foreground)]">{d.label ?? d.date}</p>
                  <p className="font-medium text-[var(--foreground)]">Score: {d.score}%</p>
                </div>
              );
            }}
            cursor={{ stroke: "var(--border)" }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ fill: "var(--primary)", r: 3 }}
            activeDot={{ r: 5, fill: "var(--primary)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
