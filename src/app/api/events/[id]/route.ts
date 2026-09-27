import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";

/** Detail event untuk admin: posisi + kandidat (tanpa RFID peserta). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      positions: {
        orderBy: { order: "asc" },
        include: { candidates: { orderBy: { number: "asc" } } },
      },
      _count: { select: { participants: true, ballots: true } },
    },
  });
  if (!event) return NextResponse.json({ error: "Event tidak ditemukan." }, { status: 404 });
  const { _count, ...rest } = event;
  return NextResponse.json({
    ...rest,
    participantCount: _count.participants,
    ballotCount: _count.ballots,
  });
}

/** Update nama/deskripsi/status event. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};
  if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body?.description === "string") data.description = body.description;
  if (["DRAFT", "ACTIVE", "CLOSED"].includes(body?.status)) data.status = body.status;
  // Edit URL event secara manual (mis. pemilihan-2026)
  if (typeof body?.slug === "string" && body.slug.trim()) {
    data.slug = await uniqueSlug(body.slug, id);
  }

  const event = await prisma.event.update({ where: { id }, data });
  return NextResponse.json(event);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
