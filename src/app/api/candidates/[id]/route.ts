import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Update / hapus kandidat. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};
  if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body?.vision === "string") data.vision = body.vision;
  if (typeof body?.mission === "string") data.mission = body.mission;
  if (Number.isFinite(Number(body?.number))) data.number = Number(body.number);

  const candidate = await prisma.candidate.update({ where: { id }, data });
  return NextResponse.json(candidate);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.candidate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
