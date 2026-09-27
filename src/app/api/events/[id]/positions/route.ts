import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Tambah posisi ke event. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const maxSelect = Math.max(1, Math.min(10, Number(body?.maxSelect ?? 1) || 1));
  if (!name) return NextResponse.json({ error: "Nama posisi wajib diisi." }, { status: 400 });

  const count = await prisma.position.count({ where: { eventId: id } });
  const position = await prisma.position.create({
    data: { eventId: id, name, order: count + 1, maxSelect },
  });
  return NextResponse.json(position, { status: 201 });
}
