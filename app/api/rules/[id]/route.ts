/**
 * T4.3 — GET /api/rules/[id]
 *
 * Returns a single rule by ruleId (e.g. STE-1.1). The [id] segment is the ruleId.
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ruleId = (await params).id;
  if (!ruleId) {
    return NextResponse.json({ error: "Rule id is required" }, { status: 400 });
  }

  try {
    const rule = await prisma.rule.findUnique({
      where: { ruleId },
    });

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json(mapRule(rule));
  } catch (e) {
    console.error("Rule get error:", e);
    return NextResponse.json({ error: "Failed to fetch rule" }, { status: 500 });
  }
}
