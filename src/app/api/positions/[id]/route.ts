import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Update / hapus posisi. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};
  if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (Number.isFinite(Number(body?.maxSelect))) {
    data.maxSelect = Math.max(1, Math.min(10, Number(body.maxSelect)));
  }
  const position = await prisma.position.update({ where: { id }, data });
  return NextResponse.json(position);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.position.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
