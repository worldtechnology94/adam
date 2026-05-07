"use client";

import { useMemo } from "react";

function getScoreColor(score: number): string {
  if (score < 60) return "var(--danger)";
  if (score < 80) return "var(--accent)";
  return "var(--success)";
}

function getGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function getTierLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Compliant";
  if (score >= 70) return "Acceptable";
  if (score >= 60) return "Needs work";
  return "Non-compliant";
}

interface ComplianceScoreGaugeProps {
  score: number;
  previousScore?: number;
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
}

export function ComplianceScoreGauge({
  score,
  previousScore,
  size = 220,
  strokeWidth = 16,
  animated = true,
}: ComplianceScoreGaugeProps) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const color = useMemo(() => getScoreColor(clampedScore), [clampedScore]);
  const grade = getGrade(clampedScore);
  const tierLabel = getTierLabel(clampedScore);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;

  const band60 = (60 / 100) * circumference;
  const band20 = (20 / 100) * circumference;

  const delta =
    previousScore !== undefined ? clampedScore - Math.round(previousScore) : null;

  return (
    <div
      className="flex flex-col items-center gap-3"
      role="img"
      aria-label={`Compliance score: ${clampedScore} out of 100, grade ${grade}. ${tierLabel}.`}
    >
      {/* Gauge + centered overlay */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          aria-hidden
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          {/* Three-tier color bands */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--danger)" strokeWidth={strokeWidth}
            strokeDasharray={`${band60} ${circumference - band60}`}
            strokeDashoffset={0} opacity={0.2}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--accent)" strokeWidth={strokeWidth}
            strokeDasharray={`${band20} ${circumference - band20}`}
            strokeDashoffset={-band60} opacity={0.2}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--success)" strokeWidth={strokeWidth}
            strokeDasharray={`${band20} ${circumference - band20}`}
            strokeDashoffset={-(band60 + band20)} opacity={0.2}
          />
          {/* Score arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={animated ? { transition: "stroke-dashoffset 0.8s ease-out" } : undefined}
          />
        </svg>

        {/* Center content — grade letter + score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span
            className="text-5xl font-black leading-none tabular-nums"
            style={{ color }}
          >
            {grade}
          </span>
          <span className="text-sm font-semibold tabular-nums text-[var(--muted-foreground)]">
            {clampedScore} / 100
          </span>
          {delta !== null && (
            <span
              className="text-xs font-medium"
              style={{ color: delta >= 0 ? "var(--success)" : "var(--danger)" }}
            >
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)} pts
            </span>
          )}
        </div>
      </div>

      {/* Tier label below gauge */}
      <p className="text-sm font-semibold" style={{ color }}>
        {tierLabel}
      </p>
    </div>
  );
}
