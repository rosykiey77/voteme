import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Tambah kandidat. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Nama kandidat wajib diisi." }, { status: 400 });

  const position = await prisma.position.findUnique({
    where: { id },
    include: { _count: { select: { candidates: true } } },
  });
  if (!position) return NextResponse.json({ error: "Posisi tidak ditemukan." }, { status: 404 });

  const candidate = await prisma.candidate.create({
    data: {
      eventId: position.eventId,
      positionId: position.id,
      name,
      number: position._count.candidates + 1,
      vision: String(body?.vision ?? ""),
      mission: String(body?.mission ?? ""),
      photoUrl: String(body?.photoUrl ?? ""),
    },
  });
  return NextResponse.json(candidate, { status: 201 });
}
