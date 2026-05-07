/**
 * T4.2 — PATCH /api/violations/[id]
 *
 * Updates a violation's status (and optionally note when the field exists).
 * Body: { status?: "pending" | "accepted" | "rejected" }
 *
 * @see thesisplan.md T4.2 — Persist Accept/Reject
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

const ALLOWED_STATUSES = ["pending", "accepted", "rejected"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const idParam = (await params).id;
  const id = parseInt(idParam, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid violation id" }, { status: 400 });
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body == null || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }

  const status = body.status;
  if (status !== undefined) {
    if (typeof status !== "string" || !ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
      return NextResponse.json(
        { error: "status must be one of: pending, accepted, rejected" },
        { status: 400 }
      );
    }
  }

  if (status === undefined) {
    return NextResponse.json({ error: "At least one field to update is required (e.g. status)" }, { status: 400 });
  }

  try {
    const violation = await prisma.violation.findUnique({
      where: { id },
    });

    if (!violation) {
      return NextResponse.json({ error: "Violation not found" }, { status: 404 });
    }

    const updated = await prisma.violation.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      id: String(updated.id),
      status: updated.status,
    });
  } catch (e) {
    console.error("Violation PATCH error:", e);
    return NextResponse.json({ error: "Failed to update violation" }, { status: 500 });
  }
}
