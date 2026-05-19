/**
 * T4.3 — GET /api/rules
 *
 * Returns all rules for the Rule Library. Optional query: topic (1–10).
 * Response shape matches frontend SteRule (id, name, topic, topicName, description, specText, compliantExamples, nonCompliantExamples).
 *
 * @see thesisplan.md T4.3 — Rules API and Rule Library
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

function mapRule(row: {
  ruleId: string;
  name: string;
  topic: number;
  topicName: string;
  description: string;
  specText: string;
  compliantExamples: unknown;
  nonCompliantExamples: unknown;
}) {
  return {
    id: row.ruleId,
    name: row.name,
    topic: row.topic,
    topicName: row.topicName,
    description: row.description,
    specText: row.specText,
    compliantExamples: Array.isArray(row.compliantExamples) ? row.compliantExamples : [],
    nonCompliantExamples: Array.isArray(row.nonCompliantExamples) ? row.nonCompliantExamples : [],
  };
}

export async function GET(request: NextRequest) {
  const topicParam = request.nextUrl.searchParams.get("topic");

  try {
    const where: { topic?: number } = {};
    if (topicParam !== null && topicParam !== "") {
      const topic = parseInt(topicParam, 10);
      if (Number.isNaN(topic) || topic < 1 || topic > 9) {
        return NextResponse.json({ error: "topic must be 1–9" }, { status: 400 });
      }
      where.topic = topic;
    }

    const rules = await prisma.rule.findMany({
      where,
      orderBy: [{ topic: "asc" }, { ruleId: "asc" }],
    });

    return NextResponse.json(rules.map(mapRule));
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Rules list error:", err.message, err);
    return NextResponse.json(
      { error: "Failed to fetch rules", details: process.env.NODE_ENV !== "production" ? err.message : undefined },
      { status: 500 }
    );
  }
}
